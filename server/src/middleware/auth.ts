import OktaJwtVerifier from '@okta/jwt-verifier';
import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTA_ISSUER || '', 
  clientId: process.env.OKTA_CLIENT_ID
});

// Simple in-memory cache to avoid hitting the DB on every request for user sync
const verifiedUsers = new Set<string>();

export interface CustomRequest extends Request {
  userId?: string;
}

export const verifyToken = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[Auth] Verifying token for ${req.path}`);
  // Allow Dev Bypass
  if (req.headers['x-dev-user-id'] && req.headers.authorization === 'Bearer dev-token') {
    console.log('[Auth] Dev bypass detected');
    const userId = req.headers['x-dev-user-id'] as string;
    req.userId = userId;

    // Only sync if not recently verified
    if (!verifiedUsers.has(userId)) {
      console.log('[Auth] Syncing dev user to DB...');
      try {
        await prisma.user.upsert({
          where: { id: userId },
          update: {},
          create: {
            id: userId,
            email: `dev-${userId}@local.test`,
            firstName: 'Dev',
            lastName: 'User',
            settings: {
              create: {
                 lowStockThreshold: 25,
                 expirationWarningDays: JSON.stringify([30, 60, 90]),
                 theme: 'system',
                 userRole: 'captain',
                 subscriptionTier: 'free'
              }
            }
          }
        });
        verifiedUsers.add(userId);
        console.log('[Auth] Dev user synced.');
      } catch (e) {
        console.error("Failed to seed dev user", e);
        // If we can't seed the user, subsequent DB calls will fail 500
        // It's better to fail here or at least know why.
        // Proceeding might be dangerous if the user doesn't exist.
        // Let's verify if user exists even if upsert failed (maybe unique constraint on email but user exists?)
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
           res.status(500).json({ error: 'Dev user sync failed', details: String(e) });
           return;
        }
      }
    } else {
      console.log('[Auth] Dev user already verified.');
    }

    next();
    return;
  }

  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/Bearer (.+)/);

  if (!match) {
    res.status(401).send('Unauthorized: No token provided');
    return;
  }

  const accessToken = match[1];

  try {
    const jwt = await oktaJwtVerifier.verifyAccessToken(accessToken, 'api://default');
    req.userId = jwt.claims.sub;
    
    // Only sync if not recently verified to drastically reduce DB load
    if (!verifiedUsers.has(req.userId)) {
      try {
        // Basic best-effort claim mapping
        // Note: verifyAccessToken usually returns limited claims. 
        // Ideally we would hit /userinfo for full profile, but this is lighter.
        const email = (jwt.claims.email as string) || (jwt.claims.sub + '@placeholder.okta');
        
        // Upsert User
        await prisma.user.upsert({
          where: { id: req.userId },
          update: {}, // No-op if exists
          create: {
            id: req.userId,
            email: email,
            firstName: 'SailMed', // Helper defaults until profile edit implemented
            lastName: 'User',
            // Create default settings immediately
            settings: {
              create: {
                 lowStockThreshold: 25,
                 expirationWarningDays: JSON.stringify([30, 60, 90]),
                 theme: 'system',
                 userRole: 'captain',
                 subscriptionTier: 'free'
              }
            }
          }
        });
        verifiedUsers.add(req.userId);
      } catch (e) {
        // Log but don't block auth - though subsequent DB calls might fail on FK
        console.error("Failed to sync okta user", e);
      }
    }

    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).send('Unauthorized: Invalid token');
  }
};
