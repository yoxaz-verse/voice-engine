import { Router } from 'express';
import { supabase } from '../supabase.js';
import { signToken } from '../utils/jwt.js';
import { supabaseAdmin } from '../utils/supabaseAdmin.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Authenticate via Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const authUserId = data.user.id;

    // 2️⃣ Load app-level user
    const { data: user } = await supabase
      .from('users')
      .select('id, role, operator_id, active')
      .eq('id', authUserId)
      .single();

    if (!user || !user.active) {
      return res.status(403).json({ error: 'User disabled' });
    }

    // 3️⃣ Issue YOUR JWT (UNCHANGED FORMAT)
    const token = signToken({
      user_id: user.id,
      role: user.role,
      operator_id: user.operator_id
    });

    return res.json({
      token,
      user: {
        role: user.role,
        operator_id: user.operator_id
      }
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
