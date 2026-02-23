"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdvancedAnalyticsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [store, setStore] = useState<any>(null)
    const [analytics, setAnalytics] = useState<any>(null)

    useEffect(() => {
        const storeStr = localStorage.getItem('store')
        if (!storeStr) {
            router.push('/login')
            return
        }
        const s = JSON.parse(storeStr)
        setStore(s)
        fetchAnalytics(s.id)
    }, [router])

    const fetchAnalytics = async (storeId: number) => {
        try {
            const res = await fetch(`/api/reports/advanced?storeId=${storeId}`)
            const data = await res.json()
            if (data.success) {
                setAnalytics(data.data)
            }
        } catch (err) {
            console.error("Analytics fetch error:", err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-12 text-center font-black animate-pulse">GENERATING DEEP INSIGHTS...</div>

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Advanced Financials</h1>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Mission Control • Profit & Loss</p>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl shadow-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Gross Revenue</p>
                    <h2 className="text-4xl font-black italic tracking-tighter">₱{analytics?.overview.revenue.toFixed(2)}</h2>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Cost of Goods</p>
                    <h2 className="text-4xl font-black italic tracking-tighter text-slate-700">₱{analytics?.overview.cogs.toFixed(2)}</h2>
                </div>
                <div className="bg-emerald-500 p-8 rounded-[40px] text-white shadow-2xl shadow-emerald-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-1">Gross Profit</p>
                    <h2 className="text-4xl font-black italic tracking-tighter">₱{analytics?.overview.grossProfit.toFixed(2)}</h2>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Margin Percentage</p>
                    <h2 className="text-4xl font-black italic tracking-tighter text-blue-600">{analytics?.overview.margin.toFixed(1)}%</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Products Chart */}
                <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8">Top Revenue Generators</h3>
                    <div className="space-y-6">
                        {analytics?.topProducts.map((p: any, i: number) => {
                            const maxRev = analytics.topProducts[0].revenue
                            const width = (p.revenue / maxRev) * 100
                            return (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                                        <span className="text-slate-500">{p.name}</span>
                                        <span className="text-slate-800">₱{p.revenue.toFixed(2)}</span>
                                    </div>
                                    <div className="h-4 bg-slate-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${width}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Category Sales */}
                <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8">Revenue by Category</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {analytics?.categorySales.map((c: any, i: number) => (
                            <div key={i} className="p-6 bg-slate-50 rounded-3xl group hover:bg-slate-900 transition-all cursor-default">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-500">{c.category}</p>
                                <p className="text-2xl font-black italic text-slate-800 group-hover:text-white mt-1">₱{c.value.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-blue-600 p-12 rounded-[60px] text-white flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-blue-200">
                <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">Ready for expansion?</h3>
                    <p className="font-bold text-blue-100 opacity-80 uppercase tracking-widest text-[10px]">Your margins are healthy. Time to open another store.</p>
                </div>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="mt-6 md:mt-0 px-10 h-16 bg-white text-blue-600 rounded-full font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-all"
                >
                    Back to Terminal
                </button>
            </div>
        </div>
    )
}
