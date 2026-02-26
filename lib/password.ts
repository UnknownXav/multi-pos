import bcrypt from 'bcryptjs'

/**
 * Hash password using bcryptjs
 * Separate from auth.ts to keep auth.ts edge-compatible
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
