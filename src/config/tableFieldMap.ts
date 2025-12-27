export type FieldBehavior =
  | 'plain'
  | 'hashed'
  | 'readonly'
  | 'alias'
  | 'relation';


  export type RelationMeta = {
    table: string;
    valueKey: string;
    labelKey: string;
  };
  
  export type FieldDefinition = {
    db: string;
    behavior: FieldBehavior;
    relation?: RelationMeta;
  };


export const TABLE_FIELD_MAP: Record<
  string,
  Record<string, FieldDefinition>
> = {

  leads: {
    id: {
        db: 'id',
        behavior: 'readonly',
      }, 
        email: {
      db: 'email',
      behavior: 'plain',
    },
    first_name: {
      db: 'first_name',
      behavior: 'plain',
    },
    company: {
      db: 'company',
      behavior: 'plain',
    },
    operator_id: {
      db: 'operator_id',
      behavior: 'relation',
      relation: {
        table: 'operators',
        valueKey: 'id',
        labelKey: 'name',
      },
    },
  
    created_at: {
      db: 'created_at',
      behavior: 'readonly',
    },
  },
  users: {
    id: {
        db: 'id',
        behavior: 'readonly',
      },
    email: {
      db: 'email',
      behavior: 'plain',
    },
    password: {
      db: 'password_hash',
      behavior: 'hashed',
    },
    role: {
      db: 'role',
      behavior: 'plain',
    },
    active: {
        db: 'active',
        behavior: 'plain',
      },
      operator_id: {
        db: 'operator_id',
        behavior: 'relation',
        relation: {
          table: 'operators',
          valueKey: 'id',
          labelKey: 'name',
        },
      },
    created_at: {
      db: 'created_at',
      behavior: 'readonly',
    },
  },
  operators: {
    id: {
        db: 'id',
        behavior: 'readonly',
      }, 
        name: {
      db: 'name',
      behavior: 'alias',
    },
    region: {
      db: 'region',
      behavior: 'plain',
    },
    created_at: {
      db: 'created_at',
      behavior: 'readonly',
    },
  },
  
  sequence_analytics: {
    id: {
        db: 'id',
        behavior: 'readonly',
      }, 
        name: {
      db: 'name',
      behavior: 'plain',
    },
    is_active: {
      db: 'is_active',
      behavior: 'plain',
    },
    leads_enrolled: {
      db: 'leads_enrolled',
      behavior: 'plain',
    },
    completed: {
      db: 'completed',
      behavior: 'plain',
    },    stopped: {
      db: 'stopped',
      behavior: 'plain',
    },
    created_at: {
      db: 'created_at',
      behavior: 'readonly',
    },
  },
  sequences: {
    id: {
        db: 'id',
        behavior: 'readonly',
      }, 
        name: {
      db: 'name',
      behavior: 'plain',
    },
    is_active: {
      db: 'is_active',
      behavior: 'plain',
    },
    created_at: {
      db: 'created_at',
      behavior: 'readonly',
    },
  },
  campaigns: {
    id: {
      db: 'id',
      behavior: 'readonly',
    },
    name: {
      db: 'name',
      behavior: 'plain',
    },
    sequence_id: {
      db: 'sequence_id',
      behavior: 'relation',
      relation: {
        table: 'sequences',
        valueKey: 'id',
        labelKey: 'name',
      },
    },  operator_id: {
      db: 'operator_id',
      behavior: 'relation',
      relation: {
        table: 'operators',
        valueKey: 'id',
        labelKey: 'name',
      },
    },
   
    status: {
      db: 'status',
      behavior: 'plain',
    },
    created_at: {
      db: 'created_at',
      behavior: 'readonly',
    },
  },
  campaign_leads: {
    id: {
      db: 'id',
      behavior: 'readonly',
    },
    campaign_id: {
      db: 'campaign_id',
      behavior: 'plain',
    },
    lead_id: {
      db: 'lead_id',
      behavior: 'plain',
    },
    status: {
      db: 'status',
      behavior: 'plain',
    },
    current_step: {
      db: 'current_step',
      behavior: 'plain',
    },
    last_sent_at: {
      db: 'last_sent_at',
      behavior: 'plain',
    },
    created_at: {
      db: 'created_at',
      behavior: 'readonly',
    },
  },
  inboxes: {
    email: {
      db: 'email_address',
      behavior: 'alias',
    },
    provider: {
      db: 'provider',
      behavior: 'plain',
    },
    created_at: {
      db: 'created_at',
      behavior: 'readonly',
    },
  },
};
