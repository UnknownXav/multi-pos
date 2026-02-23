"use client"
import React, { useState, useEffect, useCallback } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts'

const RANGE_OPTIONS = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => {
    if (i === 0) return '12am'
    if (i < 12) return `${i}am`
    if (i === 12) return '12pm'
    return `${i - 12}pm`
})

const CATEGORY_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
    return (
        <div className={`rounded-2xl p-5 ${color}`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
            <p className="text-2xl font-black">{value}</p>
            {sub && <p className="text-[11px] font-bold opacity-60 mt-0.5">{sub}</p>}
        </div>
    )
}

export default function AnalyticsPage() {
    const [range, setRange] = useState(30)
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState('')

    const fetchAnalytics = useCallback(async () => {
        setLoading(true); setError('')
        try {
            const res = await fetch(`/api/reports/analytics?range=${range}`)
            const json = await res.json()
            if (json.success) setData(json.data)
            else setError(json.error || 'Failed to load')
        } catch { setError('Network error') }
        finally { setLoading(false) }
    }, [range])

    useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

    const maxHeat = data ? Math.max(...data.heatmap.flat()) : 1

    const heatColor = (val: number) => {
        if (!val) return 'bg-slate-100'
        const pct = val / maxHeat
        if (pct < 0.2) return 'bg-indigo-100'
        if (pct < 0.4) return 'bg-indigo-200'
        if (pct < 0.6) return 'bg-indigo-400'
        if (pct < 0.8) return 'bg-indigo-600'
        return 'bg-indigo-800'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Analytics</h1>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Profit & Performance</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 p-1 shadow-sm">
                    {RANGE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setRange(opt.value)}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${range === opt.value
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600" />
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-6 font-bold text-center">{error}</div>
            )}

            {!loading && data && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <SummaryCard
                            label="Total Revenue"
                            value={`₱${data.summary.totalRevenue.toFixed(2)}`}
                            color="bg-indigo-600 text-white"
                        />
                        <SummaryCard
                            label="Gross Profit"
                            value={`₱${data.summary.grossProfit.toFixed(2)}`}
                            sub={`${data.summary.marginPct}% margin`}
                            color="bg-emerald-500 text-white"
                        />
                        <SummaryCard
                            label="Transactions"
                            value={data.summary.totalTransactions.toString()}
                            color="bg-white text-slate-800 border border-slate-100 shadow-sm"
                        />
                        <SummaryCard
                            label="Top Category"
                            value={data.summary.topCategory}
                            color="bg-amber-400 text-white"
                        />
                    </div>

                    {/* Revenue Trend Chart */}
                    {data.dailyTrend.length > 0 && (
                        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
                            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6">Revenue Trend</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={data.dailyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                                        tickFormatter={d => { const parts = d.split('-'); return `${parts[1]}/${parts[2]}` }}
                                    />
                                    <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                                        tickFormatter={v => `₱${v < 1000 ? v : `${(v / 1000).toFixed(1)}k`}`}
                                    />
                                    <Tooltip formatter={(v: any) => [`₱${Number(v).toFixed(2)}`, 'Revenue']} />
                                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Category Breakdown Bar Chart */}
                        {data.categoryData.length > 0 && (
                            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
                                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6">Revenue by Category</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={data.categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={28} barCategoryGap="30%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                                            tickFormatter={v => `₱${v < 1000 ? v : `${(v / 1000).toFixed(1)}k`}`}
                                        />
                                        <Tooltip formatter={(v: any, name: any) => [`₱${Number(v).toFixed(2)}`, name === 'revenue' ? 'Revenue' : 'Profit']} />
                                        <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="profit" fill="#10b981" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="flex gap-4 mt-2">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-indigo-500" /><span className="text-[10px] font-black text-slate-400 uppercase">Revenue</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-[10px] font-black text-slate-400 uppercase">Profit</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Hourly Heatmap */}
                        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
                            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Busy Hours Heatmap</h3>
                            <div className="overflow-x-auto">
                                <div className="min-w-[500px]">
                                    <div className="flex gap-1 mb-1">
                                        <div className="w-8" />
                                        {HOURS.filter((_, i) => i % 2 === 0).map((h, i) => (
                                            <div key={i} className="flex-1 text-center text-[8px] font-black text-slate-300 uppercase">{h}</div>
                                        ))}
                                    </div>
                                    {data.heatmap.map((row: number[], dayIdx: number) => (
                                        <div key={dayIdx} className="flex gap-1 mb-1 items-center">
                                            <div className="w-8 text-[9px] font-black text-slate-400 text-right pr-1">{DAYS[dayIdx]}</div>
                                            {row.map((val, hourIdx) => (
                                                <div
                                                    key={hourIdx}
                                                    className={`flex-1 h-5 rounded-sm ${heatColor(val)} transition-all`}
                                                    title={`${DAYS[dayIdx]} ${HOURS[hourIdx]}: ${val} orders`}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className="text-[9px] font-black text-slate-300">Low</span>
                                        {['bg-slate-100', 'bg-indigo-100', 'bg-indigo-200', 'bg-indigo-400', 'bg-indigo-600', 'bg-indigo-800'].map(c => (
                                            <div key={c} className={`h-3 flex-1 rounded-sm ${c}`} />
                                        ))}
                                        <span className="text-[9px] font-black text-slate-400">High</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Products Profit Table */}
                    {data.topProducts.length > 0 && (
                        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
                            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Top Products — Profit Analysis</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-50">
                                            {['Product', 'Units Sold', 'Revenue', 'Profit', 'Margin'].map(col => (
                                                <th key={col} className={`py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest ${['REVENUE', 'PROFIT'].includes(col.toUpperCase()) ? 'text-right' : 'text-left'}`}>
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.topProducts.map((p: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 font-black text-slate-800 pr-4">{p.name}</td>
                                                <td className="py-3 font-bold text-slate-500">{p.units}</td>
                                                <td className="py-3 font-black text-slate-800 text-right">₱{p.revenue.toFixed(2)}</td>
                                                <td className={`py-3 font-black text-right ${p.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    ₱{p.profit.toFixed(2)}
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 max-w-[80px]">
                                                            <div
                                                                className={`h-full rounded-full ${p.marginPct >= 30 ? 'bg-emerald-400' : p.marginPct >= 0 ? 'bg-amber-400' : 'bg-red-400'}`}
                                                                style={{ width: `${Math.min(Math.abs(p.marginPct), 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-xs font-black ${p.marginPct >= 30 ? 'text-emerald-600' : p.marginPct >= 0 ? 'text-amber-600' : 'text-red-500'}`}>
                                                            {p.marginPct}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {!data.topProducts.length && !data.categoryData.length && (
                        <div className="bg-white rounded-[24px] p-16 text-center shadow-sm border border-slate-50">
                            <div className="text-5xl mb-4">📊</div>
                            <p className="font-black text-slate-400 text-lg">No sales data yet for this period</p>
                            <p className="text-slate-300 text-sm font-bold mt-1">Complete some transactions to see analytics here!</p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
