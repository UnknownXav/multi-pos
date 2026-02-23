"use client"
import React, { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import { useRouter } from 'next/navigation'

export default function ReportsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [weeklyData, setWeeklyData] = useState<{ day: string; total: number }[]>([])
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [movements, setMovements] = useState<any[]>([])
  const [salesFilter, setSalesFilter] = useState<'today' | 'week' | 'month'>('week')

  useEffect(() => {
    const storeStr = localStorage.getItem('store')
    if (!storeStr) return
    const s = JSON.parse(storeStr)
    setStore(s)
    fetchData(s.id, salesFilter)
    if (s.businessType === 'PHARMACY') {
      fetchMovements(s.id)
    }
  }, [salesFilter])

  const fetchData = async (storeId: number, filter: string) => {
    try {
      setLoading(true)

      let startDateStr = ''
      const now = new Date()
      if (filter === 'today') {
        const today = new Date(now); today.setHours(0, 0, 0, 0); startDateStr = today.toISOString()
      } else if (filter === 'week') {
        const week = new Date(now); week.setDate(now.getDate() - 7); startDateStr = week.toISOString()
      } else if (filter === 'month') {
        const month = new Date(now); month.setDate(1); startDateStr = month.toISOString()
      }

      const [statsRes, salesRes] = await Promise.all([
        fetch(`/api/dashboard/stats?storeId=${storeId}`),
        fetch(`/api/sales?storeId=${storeId}&startDate=${startDateStr}&endDate=${now.toISOString()}&limit=100`)
      ])
      const statsData = await statsRes.json()
      const salesData = await salesRes.json()

      if (statsData.success) setStats(statsData.data)
      if (salesData.success) {
        const sales: any[] = salesData.data
        setRecentSales(sales)

        // Build last 7 days chart data
        const days: { day: string; total: number }[] = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const label = d.toLocaleDateString('en-US', { weekday: 'short' })
          const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0)
          const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999)
          const total = sales
            .filter(s => {
              const t = new Date(s.createdAt)
              return t >= dayStart && t <= dayEnd
            })
            .reduce((acc, s) => acc + s.total, 0)
          days.push({ day: label, total })
        }
        setWeeklyData(days)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMovements = async (storeId: number) => {
    try {
      const res = await fetch(`/api/inventory/movement?storeId=${storeId}&limit=10`)
      const data = await res.json()
      if (data.success) setMovements(data.data)
    } catch (err) { console.error(err) }
  }

  const maxBar = Math.max(...weeklyData.map(d => d.total), 1)
  const totalSales = recentSales.reduce((acc, s) => acc + s.total, 0)
  const transactions = recentSales.length
  const avgTxn = transactions > 0 ? totalSales / transactions : 0

  return (
    <div className="space-y-6 pb-10 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Analytical Reports</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Store Performance Insights</p>
        </div>

        <div className="flex items-center gap-3">
          {store?.businessType === 'PHARMACY' && (
            <button
              onClick={() => router.push('/reports/expiring')}
              className="px-6 h-12 rounded-2xl bg-rose-50 text-rose-600 font-black text-[11px] uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Expiring Medicines
            </button>
          )}
          <button onClick={() => router.push('/reports/advanced')} className="px-6 h-12 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-black transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Advanced
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-white p-1.5 rounded-[20px] shadow-sm border border-slate-100 w-max">
        {(['today', 'week', 'month'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setSalesFilter(f)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${salesFilter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 opacity-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">Compiling Data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card
              title={`${salesFilter.charAt(0).toUpperCase() + salesFilter.slice(1)} Sales`}
              value={`₱${totalSales.toLocaleString()}`}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <Card
              title="Transactions"
              value={String(transactions)}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
            />
            <Card
              title="Avg Order"
              value={`₱${avgTxn.toFixed(2)}`}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
            />
            <Card
              title="Inventory Health"
              value={String(stats?.lowStockCount ?? 0)}
              subtitle="Items low in stock"
              highlight={stats?.lowStockCount > 0}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Chart */}
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50">
              <h2 className="text-xl font-black tracking-tight mb-10">Revenue Trend</h2>
              {weeklyData.every(d => d.total === 0) ? (
                <div className="h-64 flex items-center justify-center text-slate-300 font-black uppercase tracking-widest text-[10px]">No sales recorded</div>
              ) : (
                <div className="h-64 flex items-end justify-between px-2 gap-3">
                  {weeklyData.map((d, i) => {
                    const heightPct = (d.total / maxBar) * 100
                    const isToday = i === weeklyData.length - 1
                    return (
                      <div key={i} className="flex flex-col items-center group w-full">
                        <div
                          className={`w-full rounded-2xl transition-all duration-500 relative ${isToday ? 'bg-blue-600 shadow-xl shadow-blue-100' : 'bg-slate-100 group-hover:bg-slate-200'}`}
                          style={{ height: `${Math.max(heightPct * 2, 4)}px` }}
                        />
                        <span className={`mt-4 text-[11px] font-black ${isToday ? 'text-blue-600' : 'text-slate-400 opacity-60'}`}>{d.day}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Recent Table */}
            <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-50">
              <h2 className="text-xl font-black tracking-tight px-8 py-8 pb-4">Recent Sales History</h2>
              {recentSales.length === 0 ? (
                <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Awaiting Transaction</div>
              ) : (
                <Table columns={["ID", "Time", "Items", "Amount"]}>
                  {recentSales.map(s => {
                    const t = new Date(s.createdAt)
                    return (
                      <tr key={s.id} className="group hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-5 font-black text-slate-800 tracking-tight text-[11px]">#{String(s.id).padStart(4, '0')}</td>
                        <td className="px-6 py-5 font-bold text-slate-400 text-[10px]">{t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-6 py-5 font-bold text-slate-600 text-[11px]">{s.items?.length ?? 0} sku</td>
                        <td className="px-6 py-5 font-black text-blue-600 text-[13px] text-right">₱{s.total.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </Table>
              )}
            </div>
          </div>

          {store?.businessType === 'RESTAURANT' && recentSales.length > 0 && (
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50">
              <h2 className="text-xl font-black tracking-tight mb-8">Best Selling Items</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const itemMap = new Map<string, { qty: number, revenue: number }>()
                  recentSales.forEach(s => {
                    s.items?.forEach((i: any) => {
                      const name = i.product?.name || 'Unknown'
                      const current = itemMap.get(name) || { qty: 0, revenue: 0 }
                      itemMap.set(name, {
                        qty: current.qty + i.quantity,
                        revenue: current.revenue + (i.price * i.quantity)
                      })
                    })
                  })
                  const sorted = Array.from(itemMap.entries())
                    .sort((a, b) => b[1].revenue - a[1].revenue)
                    .slice(0, 4)

                  return sorted.map(([name, data], idx) => (
                    <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-between h-40">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Top {idx + 1}</p>
                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm leading-tight truncate">{name}</h4>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="text-2xl font-black text-blue-600">₱{data.revenue.toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-slate-400">{data.qty} sold</div>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
