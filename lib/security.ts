export function getSafeRedirect(url: string | null | undefined, fallback: string = '/dashboard'): string {
    if (!url) return fallback

    // Ensure it's a relative URL and doesn't start with // (which browsers interpret as protocol-relative external)
    if (url.startsWith('/') && !url.startsWith('//')) {
        return url
    }

    return fallback
}
