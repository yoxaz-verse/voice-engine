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

export function requireAuth(minimumRole?: Role) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      /* ======================================================
         1️⃣ JWT AUTH (PRIMARY – DASHBOARD / USER SESSIONS)
      ====================================================== */
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();

        let user: JwtPayload;
        try {
          user = verifyToken(token) as JwtPayload;
        } catch {
          return res.status(401).json({ error: 'Invalid token' });
        }

        req.auth = {
          type: 'user',
          user_id: user.user_id,
          operator_id: user.operator_id ?? null,
          role: user.role
        };

        if (minimumRole && !hasPermission(user.role, minimumRole)) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            required: minimumRole,
            actual: user.role
          });
        }

        return next();
      }

      /* ======================================================
         2️⃣ API KEY AUTH (FALLBACK – SYSTEM / EXTERNAL ACCESS)
      ====================================================== */
      const apiKeyHeader = req.headers['x-api-key'];

      if (typeof apiKeyHeader === 'string') {
        const keyHash = crypto
          .createHash('sha256')
          .update(apiKeyHeader)
          .digest('hex');

        const { data: key, error } = await supabase
          .from('api_keys')
          .select('id, user_id, operator_id, role, active')
          .eq('key_hash', keyHash)
          .single();

        if (error || !key || !key.active) {
          return res.status(403).json({ error: 'Invalid API key' });
        }

        req.auth = {
          type: 'api',
          api_key_id: key.id,
          user_id: key.user_id,
          operator_id: key.operator_id,
          role: key.role as Role
        };

        if (minimumRole && !hasPermission(key.role as Role, minimumRole)) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            required: minimumRole,
            actual: key.role
          });
        }

        return next();
      }

      /* ======================================================
         3️⃣ NO AUTH PROVIDED
      ====================================================== */
      return res.status(401).json({ error: 'Authentication required' });

    } catch (err) {
      console.error('Auth error:', err);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };
}
