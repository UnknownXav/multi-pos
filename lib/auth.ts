import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'
const key = new TextEncoder().encode(JWT_SECRET)

/**
 * Hash password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Create session token using jose
 * Includes storeId for server-side tenant isolation (prevents IDOR)
 */
export async function createSession(userId: number, role: string, storeId: number | null): Promise<string> {
  return new SignJWT({ userId, role, storeId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
}

/**
 * Verify session token using jose (Edge compatible)
 */
export async function verifySession(token: string): Promise<{ userId: number; role: string; storeId: number | null } | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    })
    return payload as unknown as { userId: number; role: string; storeId: number | null }
  } catch {
    return null
  }
}
