"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Table from '@/components/Table'

export default function ExpiringProductsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [batches, setBatches] = useState<any[]>([])
    const [store, setStore] = useState<any>(null)
    const [days, setDays] = useState(30)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const storeStr = localStorage.getItem('store')
        if (!storeStr) {
            router.push('/login')
            return
        }

        const s = JSON.parse(storeStr)
        setStore(s)
        fetchExpiringBatches(s.id, days)
    }, [router, days])

    const fetchExpiringBatches = async (storeId: number, filterDays: number) => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch(`/api/reports/expiring?storeId=${storeId}&days=${filterDays}`)
            const data = await res.json()
            if (data.success) {
                setBatches(data.data)
            } else {
                setError(data.error || 'Failed to fetch expiring products')
            }
        } catch (err) {
            console.error('Fetch expiring products error:', err)
            setError('Failed to load expiring products')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (expiryDate: string) => {
        const date = new Date(expiryDate)
        const now = new Date()
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays <= 7) return 'bg-rose-50 text-rose-600 border-rose-100' // Critical: Within 7 days
        if (diffDays <= 30) return 'bg-amber-50 text-amber-600 border-amber-100' // Warning: Within 30 days
        return 'bg-blue-50 text-blue-600 border-blue-100' // Info: More than 30 days
    }

    const getStatusText = (expiryDate: string) => {
        const date = new Date(expiryDate)
        const now = new Date()
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays <= 7) return 'Critical'
        if (diffDays <= 30) return 'Warning'
        return 'Near Expiry'
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Expiring Products Report
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pharmacy Inventory Management</p>
                </div>

                <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm self-start">
                    {[30, 60, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-4 py-1.5 rounded-lg font-black text-xs transition-all ${days === d ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {d} Days
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Card
                    title="Expiring Batches"
                    value={String(batches.length)}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                />
                <Card
                    title="Total Quantity"
                    value={String(batches.reduce((acc, b) => acc + b.quantity, 0))}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                />
                <Card
                    title="Potential Value"
                    value={`₱${batches.reduce((acc, b) => acc + (b.quantity * b.sellingPrice), 0).toLocaleString()}`}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </div>

            <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-50">
                <h2 className="text-lg font-black text-slate-800 tracking-tight p-8 pb-4">Products Expiring within {days} Days</h2>

                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Analyzing Inventory...</p>
                    </div>
                ) : error ? (
                    <div className="p-20 text-center">
                        <p className="text-rose-500 font-bold">{error}</p>
                    </div>
                ) : batches.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
                        <div className="bg-emerald-50 p-6 rounded-full text-emerald-500">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">All clear! No products expiring in the next {days} days.</p>
                    </div>
                ) : (
                    <Table columns={["Medicine Name", "Batch Number", "Expiry Date", "Days Left", "Stock", "Status"]}>
                        {batches.map((b) => {
                            const diffDays = Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                            return (
                                <tr key={b.id} className="group hover:bg-slate-50 transition-colors text-slate-700">
                                    <td className="px-6 py-5 transition-all group-hover:pl-8">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800 uppercase tracking-tight text-[13px]">{b.product.name}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{b.product.genericName || 'No Generic Name'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-black text-slate-600 tracking-tight uppercase text-[12px]">#{b.batchNumber}</td>
                                    <td className="px-6 py-5 font-bold text-slate-400 text-[11px]">{new Date(b.expiryDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-5">
                                        <span className={`font-black text-[11px] ${diffDays <= 7 ? 'text-rose-500' : diffDays <= 30 ? 'text-amber-500' : 'text-slate-400'}`}>
                                            {diffDays} days
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 font-black text-slate-800 text-[13px]">{b.quantity}</td>
                                    <td className="px-6 py-5 text-right">
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(b.expiryDate)}`}>
                                            {getStatusText(b.expiryDate)}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </Table>
                )}
            </div>
        </div>
    )
}
