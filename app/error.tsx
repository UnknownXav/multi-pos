'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service if needed
        console.error('ROOT ERROR BOUNDARY:', error)
    }, [error])

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-xl shadow-rose-100">
                ⚠️
            </div>

            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                Something went wrong
            </h1>

            <p className="text-slate-500 font-bold max-w-md mx-auto mb-10 leading-relaxed uppercase text-[11px] tracking-widest">
                An unexpected error occurred in the application. We have been notified and are looking into it.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => reset()}
                    className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-slate-200"
                >
                    Try Again
                </button>

                <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="bg-white border border-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                    Go to Dashboard
                </button>
            </div>

            <div className="mt-12 text-slate-300 font-mono text-[10px] select-none">
                ERR_ID: {error.digest || 'UNKNOWN_STABLE_CRASH'}
            </div>
        </div>
    )
}
