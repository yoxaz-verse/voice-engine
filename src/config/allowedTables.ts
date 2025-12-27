// src/config/allowedTables.ts
export const ALLOWED_TABLES = [
    'leads',
    'operators',
    'users',
    'sequences',
    'sequence_analytics',
    'inboxes',
  'campaigns',
  'campaign_leads',
  ] as const;
  
  export type AllowedTable = typeof ALLOWED_TABLES[number];
  