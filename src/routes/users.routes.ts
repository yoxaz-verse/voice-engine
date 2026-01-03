import { Router } from 'express';
import { supabaseAdmin } from '../utils/supabaseAdmin.js';
import { supabase } from '../supabase.js';

const router = Router();



/**
 * BOOTSTRAP ADMIN CREATION (ONE-TIME)
 */
router.post('/bootstrap', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    /* ======================================================
       1️⃣ CHECK IF ANY USER ALREADY EXISTS
    ====================================================== */
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (count && count > 0) {
      return res.status(403).json({
        error: 'Bootstrap already completed'
      });
    }

    /* ======================================================
       2️⃣ CREATE SUPABASE AUTH USER
    ====================================================== */
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

    if (authError || !authData.user) {
      return res.status(400).json({
        error: authError?.message || 'Auth user creation failed'
      });
    }

    const authUserId = authData.user.id;

    /* ======================================================
       3️⃣ CREATE FIRST APP USER (SUPERADMIN)
    ====================================================== */
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        email: email.toLowerCase(),
        role: 'superadmin',
        operator_id: null,
        active: true
      });

    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return res.status(400).json({ error: userError.message });
    }

    return res.json({
      success: true,
      message: 'Superadmin created. Bootstrap complete.'
    });

  } catch (err) {
    console.error('BOOTSTRAP ERROR:', err);
    return res.status(500).json({ error: 'Bootstrap failed' });
  }
});


router.post('/create-user', 
    // requireAuth('admin'), 
  
  async (req, res) => {
    const { email, password, role, operator } = req.body;
  
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    let operator_id: string | null = null;
  
    try {
      /* ======================================================
         1️⃣ CREATE OPERATOR IF ROLE = OPERATOR
      ====================================================== */
      if (role === 'operator') {
        if (!operator?.name) {
          return res.status(400).json({
            error: 'operator.name is required for operator role'
          });
        }
  
        const { data: op, error: opError } = await supabase
          .from('operators')
          .insert({
            name: operator.name,
            region: operator.region ?? null,
            status: 'active'
          })
          .select('id')
          .single();
  
        if (opError || !op) {
          return res.status(400).json({
            error: 'Failed to create operator'
          });
        }
  
        operator_id = op.id;
      }
  
      /* ======================================================
         2️⃣ CREATE SUPABASE AUTH USER
      ====================================================== */
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });
  
      if (authError || !authData.user) {
        return res.status(400).json({
          error: authError?.message || 'Auth user creation failed'
        });
      }
  
      const authUserId = authData.user.id;
  
      /* ======================================================
         3️⃣ CREATE APP USER (public.users)
      ====================================================== */
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          email: email.toLowerCase(),
          role,
          operator_id,
          active: true
        });
  
      if (userError) {
        // rollback auth user
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
  
        // rollback operator
        if (operator_id) {
          await supabase.from('operators').delete().eq('id', operator_id);
        }
  
        return res.status(400).json({ error: userError.message });
      }
  
      return res.json({
        success: true,
        operator_id
      });
  
    } catch (err) {
      console.error('CREATE USER ERROR:', err);
      return res.status(500).json({ error: 'User creation failed' });
    }
  });
  

export default router;
