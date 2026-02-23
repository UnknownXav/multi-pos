"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function CheckInPage() {
    const router = useRouter()
    const [store, setStore] = useState<any>(null)
    const [identifier, setIdentifier] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message: string; member?: any } | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const storeStr = localStorage.getItem('store')
        if (!storeStr) {
            router.push('/login')
            return
        }
        setStore(JSON.parse(storeStr))
        inputRef.current?.focus()
    }, [router])

    const handleCheckIn = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!identifier || isProcessing) return

        setIsProcessing(true)
        setResult(null)

        try {
            const res = await fetch('/api/check-ins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: store.id,
                    identifier
                })
            })
            const data = await res.json()
            setResult({
                success: data.success,
                message: data.success ? data.message : (data.error || 'Check-in failed'),
                member: data.data?.member
            })
            setIdentifier('')

            // Auto-clear result after 4 seconds
            setTimeout(() => {
                setResult(null)
                inputRef.current?.focus()
            }, 4000)
        } catch (err) {
            setResult({ success: false, message: 'Network error' })
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className={`fixed inset-0 flex items-center justify-center transition-colors duration-500 ${result ? (result.success ? 'bg-emerald-500' : 'bg-red-500') : 'bg-slate-900'
            }`}>
            <div className="w-full max-w-2xl px-6 text-center">
                {!result ? (
                    <div className="space-y-12 animate-in fade-in zoom-in duration-500">
                        <div className="space-y-4">
                            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Check-in Station</h1>
                            <p className="text-slate-400 font-bold tracking-[0.3em] uppercase text-xs">Scan member card or enter ID</p>
                        </div>

                        <form onSubmit={handleCheckIn} className="relative group">
                            <input
                                ref={inputRef}
                                className="w-full h-32 bg-slate-800/50 border-4 border-slate-700/50 rounded-[40px] px-12 text-5xl font-black text-white text-center focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-all shadow-2xl placeholder:text-slate-700"
                                placeholder="00000000"
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                                disabled={isProcessing}
                                autoFocus
                            />
                            {isProcessing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-[40px]">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
                                </div>
                            )}
                        </form>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in zoom-in slide-in-from-bottom-10 duration-500">
                        <div className="w-32 h-32 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                            {result.success ? (
                                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-6xl font-black text-white tracking-tight leading-tight uppercase">
                                {result.success ? 'Access Granted' : 'Access Denied'}
                            </h2>
                            <p className="text-2xl font-black text-white/80 uppercase tracking-widest">{result.message}</p>
                        </div>

                        {result.member && (
                            <div className="bg-black/20 backdrop-blur-md p-8 rounded-[32px] border border-white/10 max-w-md mx-auto">
                                <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">{result.member.name}</h3>
                                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                    <span className="text-white/60 font-black uppercase text-[10px] tracking-widest">Expires on</span>
                                    <span className="text-white font-black">{new Date(result.member.subscriptions[0]?.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        )}

                        <p className="text-white/40 font-bold uppercase tracking-widest text-xs animate-pulse">Resuming in a few seconds...</p>
                    </div>
                )}
            </div>

            {/* Quick exit to dashboard */}
            <button
                onClick={() => router.push('/dashboard')}
                className="absolute top-8 left-8 p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-all"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
        </div>
    )
}
