import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function getSessionId() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('directory_session_id')?.value;

  if (sessionId) {
    return sessionId;
  }

  const newSessionId = uuidv4();
  cookieStore.set('directory_session_id', newSessionId, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return newSessionId;
}
