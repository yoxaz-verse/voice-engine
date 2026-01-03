import { supabase } from '../../supabase';

export async function handleUserBeforeWrite(
  payload: Record<string, any>,
  mode: 'create' | 'update'
) {
  /* -------------------------------
     1️⃣ VALIDATION + NORMALIZATION
  -------------------------------- */
  if (!payload.email) {
    throw new Error('Email is required');
  }

  payload.email = payload.email.toLowerCase();

  /* -------------------------------
     2️⃣ ENSURE SUPABASE AUTH USER
     (ID SOURCE OF TRUTH)
  -------------------------------- */
  if (!payload.id) {
    const { data: authUsers, error } =
      await supabase.auth.admin.listUsers({
        email: payload.email,
        perPage: 1,
      });

    if (error) throw error;

    if (authUsers?.users?.length) {
      payload.id = authUsers.users[0].id;
    } else {
      const { data, error } =
        await supabase.auth.admin.createUser({
          email: payload.email,
          email_confirm: true,
        });

      if (error) throw error;
      payload.id = data.user.id;
    }
  }

  /* -------------------------------
     3️⃣ OPERATOR INTENT HANDLING
     (CREATE OR UPDATE)
  -------------------------------- */
  const wantsOperator = payload.role === 'operator';

  if (wantsOperator) {
    // Operator is NOT a role → normalize
    payload.role = 'user';

    if (!payload.operator_id) {
      const { data: operator, error } = await supabase
        .from('operators')
        .insert({
          name: payload.email,
          status: 'active',
        })
        .select('id')
        .single();

      if (error) throw error;
      payload.operator_id = operator.id;
    }
  }

  /* -------------------------------
     4️⃣ REMOVE OPERATOR IF ROLE CHANGED
  -------------------------------- */
  if (!wantsOperator && mode === 'update') {
    const { data: existing } = await supabase
      .from('users')
      .select('operator_id')
      .eq('id', payload.id)
      .single();

    if (existing?.operator_id) {
      await supabase
        .from('operators')
        .delete()
        .eq('id', existing.operator_id);

      payload.operator_id = null;
    }
  }

  return payload;
}


export async function handleUserBeforeDelete(userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('operator_id')
    .eq('id', userId)
    .maybeSingle();

  if (user?.operator_id) {
    await supabase
      .from('operators')
      .delete()
      .eq('id', user.operator_id);
  }
}
