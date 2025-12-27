import { supabase } from "../supabase";
import { updateRow } from "./crudService";

/**
 * Attach leads to a campaign
 * NOTE: Direct supabase usage is acceptable here for now
 */
export async function attachLeadsToCampaign(
  campaignId: string,
  leadIds: string[]
) {
  // Remove leads from any existing campaign
  await supabase
    .from("campaign_leads")
    .delete()
    .in("lead_id", leadIds);

  // Attach to this campaign
  const rows = leadIds.map((leadId) => ({
    campaign_id: campaignId,
    lead_id: leadId,
    status: "queued",
  }));

  await supabase.from("campaign_leads").insert(rows);
}

/**
 * Start campaign (IDEMPOTENT)
 */
export async function startCampaign(campaignId: string) {
  // 1. Fetch current campaign state
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("id, status")
    .eq("id", campaignId)
    .single();

  if (error || !campaign) {
    throw new Error("Campaign not found");
  }

  // 2. Idempotency guard
  if (campaign.status === "running") {
    return; // no-op, safe retry
  }

  // 3. Transition campaign to running
  // Lifecycle hook enforces validity
  await updateRow("campaigns", campaignId, {
    status: "running",
    started_at: new Date().toISOString(),
  });

  // 4. Initialize campaign leads for execution
  await initializeCampaignLeads(campaignId);
}

/**
 * Initialize campaign leads for execution
 */
async function initializeCampaignLeads(campaignId: string) {
  await supabase
    .from("campaign_leads")
    .update({
      status: "queued",
      current_step: 1,
      retry_count: 0,
      next_retry_at: null,
      last_sent_at: null,
    })
    .eq("campaign_id", campaignId)
    .in("status", ["pending", "paused", null]);
}

/**
 * Pause campaign
 */
export async function pauseCampaign(campaignId: string) {
  await updateRow("campaigns", campaignId, {
    status: "paused",
  });
}
