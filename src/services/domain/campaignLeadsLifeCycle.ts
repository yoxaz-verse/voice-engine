export async function handleCampaignLeadsBeforeWrite(
    payload: Record<string, any>,
    mode: 'create' | 'update'
  ) {
    if (!payload.campaign_id) {
      throw new Error('campaign_id is required');
    }
  
    if (!payload.lead_id) {
      throw new Error('lead_id is required');
    }
  
    if (mode === 'create' && !payload.status) {
      payload.status = 'queued';
    }
  
    return payload;
  }
  

  