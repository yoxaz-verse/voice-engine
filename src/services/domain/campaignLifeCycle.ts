import { supabase } from '../../supabase';

export async function handleCampaignBeforeWrite(
  payload: Record<string, any>,
  mode: 'create' | 'update'
) {
  // ------------------------
  // CREATE
  // ------------------------
  if (mode === 'create') {
    if (!payload.operator_id) {
      throw new Error('operator_id is required for campaign');
    }

    if (!payload.sequence_id) {
      throw new Error('sequence_id is required for campaign');
    }

    if (!payload.status) {
      payload.status = 'draft';
    }

    return payload;
  }

  // ------------------------
  // UPDATE
  // ------------------------
  if (mode === 'update') {
    // If this is NOT a status change, allow silently
    if (!payload.status) {
      return payload;
    }

    // STATUS TRANSITION LOGIC
    if (payload.status === 'running') {
      await validateCampaignCanStart(payload.id);
    }

    if (payload.status === 'paused') {
      // optional future rules
      return payload;
    }
  }

  return payload;
}
async function validateCampaignCanStart(campaignId: string) {
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select(`
      id,
      status,
      operator_id,
      sequence_id,
      campaign_leads(id)
    `)
    .eq('id', campaignId)
    .single();

  if (error || !campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status !== 'draft') {
    throw new Error('Only draft campaigns can be started');
  }

  if (!campaign.operator_id) {
    throw new Error('Campaign has no operator');
  }

  if (!campaign.sequence_id) {
    throw new Error('Campaign has no sequence');
  }

  if (!campaign.campaign_leads || campaign.campaign_leads.length === 0) {
    throw new Error('Campaign has no leads');
  }

  const { count } = await supabase
    .from('sequence_steps')
    .select('*', { count: 'exact', head: true })
    .eq('sequence_id', campaign.sequence_id);

  if (!count || count === 0) {
    throw new Error('Sequence has no steps');
  }
}
