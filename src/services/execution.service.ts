import { supabase } from '../supabase';
import { updateRow } from './crudService';

const MAX_RETRIES = 3;
const RETRY_DELAY_MINUTES = 15;
type ClaimedCampaignLead = {
    id: string;
    lead_id: string;
    campaign_id: string;
    current_step: number;
  };
  
  type LeadRow = {
    id: string;
    email: string;
  };
  
  type SequenceStepRow = {
    step_number: number;
    subject: string;
    body: string;
  };
  
/**
 * GLOBAL execution pickup
 */
export async function getNextExecutionLeads(batchSize: number) {
    const { data, error } = await supabase.rpc('claim_execution_leads', {
      batch_size: batchSize,
    });
  
    if (error) throw error;
    if (!data || data.length === 0) return [];
  
    const claimed = data as ClaimedCampaignLead[];
  
    const leadIds = claimed.map((l: ClaimedCampaignLead) => l.lead_id);
  
    const { data: leads } = await supabase
      .from('leads')
      .select('id, email')
      .in('id', leadIds);
  
    const leadMap = Object.fromEntries(
      (leads as LeadRow[]).map((l: LeadRow) => [l.id, l.email])
    );
  
    const campaignId = claimed[0].campaign_id;
  
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('sequence_id')
      .eq('id', campaignId)
      .single();
  
    const { data: steps } = await supabase
      .from('sequence_steps')
      .select('step_number, subject, body')
      .eq('sequence_id', campaign.sequence_id);
  
    const stepMap = Object.fromEntries(
      (steps as SequenceStepRow[]).map((s: SequenceStepRow) => [
        s.step_number,
        s,
      ])
    );
  
    return claimed.map((cl: ClaimedCampaignLead) => ({
      id: cl.id,
      email: leadMap[cl.lead_id],
      subject: stepMap[cl.current_step].subject,
      body: stepMap[cl.current_step].body,
    }));
  }
  
  

/**
 * STEP SUCCESS
 */
export async function markStepSuccess(campaignLeadId: string) {
  const { data: lead, error } = await supabase
    .from('campaign_leads')
    .select(`
      id,
      current_step,
      campaign_id,
      campaigns (
        sequence_id
      )
    `)
    .eq('id', campaignLeadId)
    .single();

    if (lead.status !== 'processing') {
        return; // idempotent no-op
      }

  if (error || !lead) {
    throw new Error('Campaign lead not found');
  }

  const { count: stepCount } = await supabase
    .from('sequence_steps')
    .select('*', { count: 'exact', head: true })
    .eq('sequence_id', lead.campaigns.sequence_id);

  const isLastStep = lead.current_step >= stepCount;

  if (isLastStep) {
    await supabase
      .from('campaign_leads')
      .update({
        status: 'completed',
        last_sent_at: new Date().toISOString(),
      })
      .eq('id', campaignLeadId);

    await maybeCompleteCampaign(lead.campaign_id);
    return;
  }

  await supabase
    .from('campaign_leads')
    .update({
      status: 'queued',
      current_step: lead.current_step + 1,
      retry_count: 0,
      next_retry_at: null,
      last_sent_at: new Date().toISOString(),
    })
    .eq('id', campaignLeadId);
}

/**
 * STEP FAILURE
 */
export async function markStepFailure(campaignLeadId: string) {
  const { data: lead, error } = await supabase
    .from('campaign_leads')
    .select('id, retry_count, campaign_id')
    .eq('id', campaignLeadId)
    .single();

  if (error || !lead) {
    throw new Error('Campaign lead not found');
  }

  const retryCount = lead.retry_count ?? 0;

  if (retryCount + 1 >= MAX_RETRIES) {
    await supabase
      .from('campaign_leads')
      .update({
        status: 'failed',
        retry_count: retryCount + 1,
      })
      
      .eq('id', campaignLeadId);

      await maybePauseCampaignOnFailure(lead.campaign_id);

    await supabase.from('system_events').insert({
      type: 'lead_failed',
      entity: 'campaign_lead',
      entity_id: campaignLeadId,
      message: 'Retry limit exceeded',
    });

    await maybeCompleteCampaign(lead.campaign_id);
    return;
  }

  const nextRetry = new Date();
  nextRetry.setMinutes(nextRetry.getMinutes() + RETRY_DELAY_MINUTES);

  await supabase
    .from('campaign_leads')
    .update({
      status: 'queued',
      retry_count: retryCount + 1,
      next_retry_at: nextRetry.toISOString(),
    })
    .eq('id', campaignLeadId);
}

/**
 * AUTO COMPLETE CAMPAIGN
 */
export async function maybeCompleteCampaign(campaignId: string) {
  const { count } = await supabase
    .from('campaign_leads')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .in('status', ['queued', 'processing', 'paused']);

  if (count === 0) {
    await updateRow('campaigns', campaignId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    await supabase.from('system_events').insert({
      type: 'campaign_completed',
      entity: 'campaign',
      entity_id: campaignId,
      message: 'Campaign completed automatically',
    });
  }
}


async function maybePauseCampaignOnFailure(campaignId: string) {
    // Total leads
    const { count: totalLeads } = await supabase
      .from('campaign_leads')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);
  
    if (!totalLeads || totalLeads === 0) return;
  
    // Failed leads
    const { count: failedLeads } = await supabase
      .from('campaign_leads')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'failed');
  
    const failureRate = failedLeads / totalLeads;
  
    // Threshold: 30%
    if (failureRate >= 0.3) {
      await updateRow('campaigns', campaignId, {
        status: 'paused',
        paused_reason: 'High failure rate detected',
      });
  
      await supabase.from('system_events').insert({
        type: 'campaign_paused',
        entity: 'campaign',
        entity_id: campaignId,
        message: `Paused due to high failure rate (${Math.round(failureRate * 100)}%)`,
      });
    }
  }
  



  type BounceType = 'hard' | 'soft' | 'reply';
  
  export async function handleBounce(
    email: string,
    type: BounceType,
    reason?: string
  ) {
    // Find active campaign lead for this email
    const { data: lead } = await supabase
      .from('leads')
      .select(`
        id,
        campaign_leads (
          id,
          campaign_id,
          status
        )
      `)
      .eq('email', email)
      .single();
  
    if (!lead || !lead.campaign_leads?.length) {
      return; // nothing to do
    }
  
    const campaignLead = lead.campaign_leads[0];
  
    // HARD BOUNCE → permanent stop
    if (type === 'hard') {
      await supabase
        .from('campaign_leads')
        .update({ status: 'failed' })
        .eq('id', campaignLead.id);
    }
  
    // SOFT BOUNCE → allow retry
    if (type === 'soft') {
      const retryAt = new Date();
      retryAt.setMinutes(retryAt.getMinutes() + 30);
  
      await supabase
        .from('campaign_leads')
        .update({
          status: 'queued',
          next_retry_at: retryAt.toISOString(),
        })
        .eq('id', campaignLead.id);
    }
  
    // REPLY → optional positive signal
    if (type === 'reply') {
      await supabase
        .from('campaign_leads')
        .update({ status: 'completed' })
        .eq('id', campaignLead.id);
    }
  
    // Always log
    await supabase.from('email_logs').insert({
      lead_id: lead.id,
      bounce_type: type,
      bounce_reason: reason,
    });
  }
  
  