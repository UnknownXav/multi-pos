"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function GymReportsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [subscriptions, setSubscriptions] = useState<any[]>([])

    useEffect(() => {
        const storeStr = localStorage.getItem('store')
        if (!storeStr) {
            router.push('/login')
            return
        }
        const store = JSON.parse(storeStr)
        fetchData(store.id)
    }, [router])

    const fetchData = async (storeId: number) => {
        try {
            const [statsRes, subsRes] = await Promise.all([
                fetch(`/api/dashboard/stats?storeId=${storeId}`),
                fetch(`/api/reports/gym/subscriptions?storeId=${storeId}`)
            ])

            const statsData = await statsRes.json()
            const subsData = await subsRes.json()

            if (statsData.success) setStats(statsData.data)
            if (subsData.success) setSubscriptions(subsData.data)
        } catch (err) {
            console.error("Fetch reports error:", err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8">Loading Reports...</div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gym Performance</h1>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Analytics & Subscription Summary</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-50 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Members</div>
                    <div className="text-6xl font-black text-emerald-500">{stats?.activeMembers || 0}</div>
                    <div className="text-xs font-bold text-slate-400">Current active subscriptions</div>
                </div>

                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-50 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Renewal Rate</div>
                    <div className="text-6xl font-black text-blue-500">
                        {stats?.activeMembers + stats?.expiredMembers > 0
                            ? Math.round((stats?.activeMembers / (stats?.activeMembers + stats?.expiredMembers)) * 100)
                            : 0}%
                    </div>
                    <div className="text-xs font-bold text-slate-400">vs expired members</div>
                </div>

                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-50 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signups (MTD)</div>
                    <div className="text-6xl font-black text-indigo-500">{stats?.newSignups || 0}</div>
                    <div className="text-xs font-bold text-slate-400">New members this month</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50">
                    <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Revenue Trends</h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                            <span className="text-sm font-bold text-slate-400">Today</span>
                            <span className="text-2xl font-black text-slate-800 font-mono">₱{stats?.todaySales?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                            <span className="text-sm font-bold text-slate-400">This Week</span>
                            <span className="text-2xl font-black text-slate-800 font-mono">₱{stats?.weeklySales?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                            <span className="text-sm font-bold text-slate-400">This Month</span>
                            <span className="text-3xl font-black text-blue-600 font-mono">₱{stats?.monthlySales?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50">
                    <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Member Status</h3>
                    <div className="space-y-4 pt-4">
                        <div className="relative h-12 bg-slate-50 rounded-2xl overflow-hidden flex">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-1000"
                                style={{ width: `${(stats?.activeMembers / (stats?.activeMembers + stats?.expiredMembers || 1)) * 100}%` }}
                            ></div>
                            <div className="h-full bg-red-400/20 flex-1"></div>
                        </div>
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                                <span className="text-emerald-600">{stats?.activeMembers} Active</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-400 rounded-sm"></div>
                                <span className="text-red-500">{stats?.expiredMembers} Expired</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white rounded-2xl text-blue-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <p className="text-xs font-black text-blue-800 uppercase tracking-tight">Expansion Tip</p>
                                <p className="text-[11px] font-bold text-blue-600">Most members sign up on Mondays. Consider running promos then!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription Summary Table */}
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Subscription Summary</h3>
                    <span className="px-4 py-1.5 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">Recent Activity</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Member</th>
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Plan</th>
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-center">Reference</th>
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-right">Amount</th>
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {subscriptions.length > 0 ? (
                                subscriptions.map((sub) => (
                                    <tr key={sub.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-5 px-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-800 uppercase leading-none">{sub.member.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400 mt-1">{new Date(sub.startDate).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-4 font-bold text-slate-600 text-sm italic">{sub.plan.name}</td>
                                        <td className="py-5 px-4 text-center">
                                            <span className="font-mono text-[10px] text-slate-400">SUB-{sub.id.toString().padStart(4, '0')}</span>
                                        </td>
                                        <td className="py-5 px-4 text-right font-black text-slate-800">
                                            ₱{sub.plan.price.toLocaleString()}
                                        </td>
                                        <td className="py-5 px-4 text-right">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${sub.status === 'active' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'
                                                }`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <p className="text-sm font-bold text-slate-400">No subscriptions found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
