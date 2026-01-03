import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { supabase } from '../supabase.js';
import { verifyToken } from '../utils/jwt';
import { Role, hasPermission } from '../auth/roles.js';

type JwtPayload = {
  user_id: string;
  role: Role;
  operator_id?: string | null;
};


export function requireAuth(
  minimumRole?: Role,
  requireOperator: boolean = false
) {

  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      /* ======================================================
         1️⃣ JWT AUTH
      ====================================================== */
      const authHeader = req.headers.authorization;

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();

        let user: JwtPayload;
        try {
          user = verifyToken(token) as JwtPayload;
        } catch {
          clearAuthCookies(res);
          return res.status(401).json({ error: 'Invalid token' });
        }

        /* ======================================================
           2️⃣ DB REVALIDATION (AUTHORITATIVE)
        ====================================================== */
        const { data: dbUser } = await supabase
          .from('users')
          .select('id, role, operator_id, active')
          .eq('id', user.user_id)
          .single();

        if (!dbUser || !dbUser.active) {
          clearAuthCookies(res);
          return res.status(401).json({ error: 'User no longer active' });
        }

        /* ======================================================
           3️⃣ ROLE PERMISSION CHECK
        ====================================================== */
        if (minimumRole && !hasPermission(dbUser.role, minimumRole)) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            required: minimumRole,
            actual: dbUser.role,
          });
        }

        /* ======================================================
           4️⃣ OPERATOR CAPABILITY CHECK
        ====================================================== */
        if (requireOperator && !dbUser.operator_id) {
          return res.status(403).json({
            error: 'Operator access required',
          });
        }

        /* ======================================================
           5️⃣ ATTACH AUTH CONTEXT
        ====================================================== */
        req.auth = {
          type: 'user',
          user_id: dbUser.id,
          role: dbUser.role,
          operator_id: dbUser.operator_id ?? null,
        };

        return next();
      }

      /* ======================================================
         6️⃣ API KEY AUTH (UNCHANGED)
      ====================================================== */
      const apiKeyHeader = req.headers['x-api-key'];

      if (typeof apiKeyHeader === 'string') {
        const keyHash = crypto
          .createHash('sha256')
          .update(apiKeyHeader)
          .digest('hex');

        const { data: key } = await supabase
          .from('api_keys')
          .select('id, user_id, operator_id, role, active')
          .eq('key_hash', keyHash)
          .single();

        if (!key || !key.active) {
          return res.status(403).json({ error: 'Invalid API key' });
        }

        if (minimumRole && !hasPermission(key.role as Role, minimumRole)) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            required: minimumRole,
            actual: key.role,
          });
        }

        if (requireOperator && !key.operator_id) {
          return res.status(403).json({
            error: 'Operator access required',
          });
        }

        req.auth = {
          type: 'api',
          api_key_id: key.id,
          user_id: key.user_id,
          role: key.role as Role,
          operator_id: key.operator_id,
        };

        return next();
      }

      return res.status(401).json({ error: 'Authentication required' });
    } catch (err) {
      console.error('Auth error:', err);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };
}

function clearAuthCookies(res: Response) {
  res.clearCookie('auth_token', { path: '/' });
  res.clearCookie('user_role', { path: '/' });
  res.clearCookie('operator_id', { path: '/' });
}
