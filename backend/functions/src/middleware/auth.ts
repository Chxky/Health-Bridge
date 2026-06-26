import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export interface AuthUser {
  uid: string;
  email: string;
  role: string;
  facilityId: string | null;
  name: string;
}

export function extractAuthUser(context: functions.https.CallableContext): AuthUser {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to perform this action.'
    );
  }

  const uid = context.auth.uid;
  const token = context.auth.token;

  return {
    uid,
    email: token.email || '',
    role: token.role || 'pharmacist',
    facilityId: token.facilityId || null,
    name: token.name || 'Unknown User',
  };
}

export function extractAuthUserFromRequest(
  req: functions.https.Request,
  res: functions.Response
): AuthUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return null;
  }

  // In a real implementation, you would decode and verify the token here
  // For now, this function serves as a placeholder for HTTP-based auth
  console.warn('extractAuthUserFromRequest requires proper token verification implementation');
  return null;
}

export function requireRole(allowedRoles: string[]) {
  return (user: AuthUser): boolean => {
    return allowedRoles.includes(user.role);
  };
}

export function requireFacilityAccess(user: AuthUser, facilityId: string): boolean {
  return user.role === 'natpharm_admin'
    || user.role === 'natpharm_officer'
    || user.role === 'ministry_viewer'
    || user.facilityId === facilityId;
}
