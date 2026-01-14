import OktaJwtVerifier from '@okta/jwt-verifier';
import { Request, Response, NextFunction } from 'express';

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTA_ISSUER || '', 
  clientId: process.env.OKTA_CLIENT_ID
});

export interface CustomRequest extends Request {
  userId?: string;
}

export const verifyToken = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
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
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).send('Unauthorized: Invalid token');
  }
};
