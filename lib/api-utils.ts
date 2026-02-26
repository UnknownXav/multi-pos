import { NextRequest, NextResponse } from 'next/server'

/**
 * Custom error class for API errors with status codes
 */
export class ApiError extends Error {
    constructor(public message: string, public statusCode: number = 500) {
        super(message)
        this.name = 'ApiError'
    }
}

/**
 * Higher-order function to wrap API handlers with error handling
 * - Logs detailed errors to the server console
 * - Returns a generic message to the client for unknown errors
 * - Supports custom ApiError for specific user feedback
 */
export function apiHandler(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) {
    return async (req: NextRequest, ...args: any[]) => {
        try {
            return await handler(req, ...args)
        } catch (error: any) {
            // 1. Detailed server-side logging
            console.error(`[API ERROR] ${req.method} ${req.url}:`, {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            })

            // 2. Response handling
            if (error instanceof ApiError) {
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: error.statusCode }
                )
            }

            // 3. Generic error for unhandled exceptions (Security)
            return NextResponse.json(
                { success: false, error: 'An unexpected error occurred. Please try again later.' },
                { status: 500 }
            )
        }
    }
}

/**
 * Helper to require specific roles in API handlers
 * - Checks the 'X-User-Role' header injected by middleware
 * - Throws a Forbidden ApiError if role is missing or unauthorized
 */
export function requireRole(req: NextRequest, allowedRoles: string[]) {
    const role = req.headers.get('X-User-Role')

    if (!role || !allowedRoles.includes(role)) {
        throw new ApiError('You do not have permission to perform this action', 403)
    }

    return role
}
