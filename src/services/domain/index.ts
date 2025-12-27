import { AllowedTable } from '../../config/allowedTables';
import { handleCampaignLeadsBeforeWrite } from './campaignLeadsLifeCycle';
import { handleCampaignBeforeWrite } from './campaignLifeCycle';
import { handleUserBeforeWrite } from './userLifeCycle';

export async function runBeforeWrite(
  table: AllowedTable,
  payload: Record<string, any>,
  mode: 'create' | 'update'
) {
  if (table === 'users') {
    return handleUserBeforeWrite(payload, mode);
  }

  if (table === 'campaigns') {
    return handleCampaignBeforeWrite(payload, mode);
  }

  if (table === 'campaign_leads') {
    return handleCampaignLeadsBeforeWrite(payload, mode);
  }

  return payload;
}
