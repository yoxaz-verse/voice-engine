import { supabase } from '../../supabase';

/**
 * Handles domain rules for users BEFORE write
 */
export async function handleUserBeforeWrite(
  payload: Record<string, any>,
  mode: 'create' | 'update'
) {
  
  console.log("Am here");
  
    // Operator user must always have operator_id
  if (payload.role === 'operator' && !payload.operator_id) {
    const { data: operator, error } = await supabase
      .from('operators')
      .insert({
        name: payload.email,
      })
      .select('id')
      .single();

    if (error) throw error;
    console.log("operator.id",operator.id);

    payload.operator_id = operator.id;

  console.log(payload);

  }

  // Admin should never have operator_id
  if (payload.role === 'admin') {
    payload.operator_id = null;
  }

  return payload;
}
