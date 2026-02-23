"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '../../components/Card'

interface Store {
  id: number
  name: string
  businessType: string
}

interface User {
  id: number
  name: string
  email: string
  role: string
  storeId: number
  store: Store
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [store, setStore] = useState<Store | null>(null)

  const [stats, setStats] = useState<any>(null)
  const [weeklyChart, setWeeklyChart] = useState<{ day: string; total: number; isToday: boolean }[]>([])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    const storeStr = localStorage.getItem('store')

    if (!userStr || !storeStr) {
      router.push('/login')
      return
    }

    try {
      const u = JSON.parse(userStr)
      const s = JSON.parse(storeStr)
      setUser(u)
      setStore(s)

      const fetchStats = async () => {
        try {
          const [statsRes, salesRes] = await Promise.all([
            fetch(`/api/dashboard/stats?storeId=${s.id}`),
            fetch(`/api/sales?storeId=${s.id}&limit=100`)
          ])
          const statsData = await statsRes.json()
          const salesData = await salesRes.json()

          if (statsData.success) setStats(statsData.data)

          // Build last 7 days chart
          if (salesData.success) {
            const sales: any[] = salesData.data
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            const chart = Array.from({ length: 7 }, (_, i) => {
              const d = new Date()
              d.setDate(d.getDate() - (6 - i))
              const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0)
              const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999)
              const total = sales
                .filter(s => { const t = new Date(s.createdAt); return t >= dayStart && t <= dayEnd })
                .reduce((acc, s) => acc + s.total, 0)
              return { day: dayNames[d.getDay()], total, isToday: i === 6 }
            })
            setWeeklyChart(chart)
          }
        } catch (err) {
          console.error("Stats fetch error:", err)
        } finally {
          setLoading(false)
        }
      }
      fetchStats()
    } catch (err) {
      router.push('/login')
    }
  }, [router])

  if (loading || !user || !store) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Stat Cards Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Standard Sales Cards (Retail) */}
        {store?.businessType === 'RETAIL' ? (
          <>
            <Card
              title="Today's Sales"
              value={`₱${stats?.todaySales?.toLocaleString() || '0'}`}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              onClick={() => router.push('/reports')}
            />
            <Card
              title="Weekly Sales"
              value={`₱${stats?.weeklySales?.toLocaleString() || '0'}`}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
              onClick={() => router.push('/reports')}
            />
            <Card
              title="Monthly Sales"
              value={`₱${stats?.monthlySales?.toLocaleString() || '0'}`}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              onClick={() => router.push('/reports')}
            />
            <Card
              title="Low Stock Items"
              value={stats?.lowStockCount?.toString() || '0'}
              subtitle="Require Restocking"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
              highlight={stats?.lowStockCount > 0}
              onClick={() => router.push('/products')}
            />
          </>
        ) : store?.businessType === 'RESTAURANT' ? (
          <>
            <Card
              title="Today's Revenue"
              value={`₱${stats?.todaySales?.toLocaleString() || '0'}`}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              onClick={() => router.push('/reports')}
            />
            <Card
              title="Active Tables"
              value={stats?.activeTablesCount?.toString() || '0'}
              subtitle="Occupied/Reserved"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>}
              highlight={stats?.activeTablesCount > 0}
              onClick={() => router.push('/tables')}
            />
            <Card
              title="Kitchen Orders"
              value={stats?.kitchenOrdersCount?.toString() || '0'}
              subtitle="In Preparation"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
              highlight={stats?.kitchenOrdersCount > 0}
              onClick={() => router.push('/kitchen')}
            />
            <Card
              title="Completed Today"
              value={stats?.completedOrdersCount?.toString() || '0'}
              subtitle="Orders served"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
              onClick={() => router.push('/sales')}
            />
          </>
        ) : store?.businessType === 'PHARMACY' ? (
          <>
            <Card
              title="Today's Sales"
              value={`₱${stats?.todaySales?.toLocaleString() || '0'}`}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              onClick={() => router.push('/sales')}
            />
            <Card
              title="Expiring Soon"
              value={stats?.expiryAlerts?.toString() || '0'}
              subtitle="Next 30 days"
              highlight={stats?.expiryAlerts > 0}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              onClick={() => router.push('/reports/expiring')}
            />
            <Card
              title="Low Stock"
              value={stats?.lowStockCount?.toString() || '0'}
              subtitle="Medicines"
              highlight={stats?.lowStockCount > 0}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
              onClick={() => router.push('/products')}
            />
            <Card
              title="Prescriptions"
              value={stats?.prescriptionsToday?.toString() || '0'}
              subtitle="Today"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              onClick={() => router.push('/sales')}
            />
          </>
        ) : store?.businessType === 'GYM' ? (
          <>
            <Card
              title="Active Members"
              value={stats?.activeMembers?.toString() || '0'}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              onClick={() => router.push('/memberships')}
            />
            <Card
              title="Monthly Revenue"
              value={`₱${stats?.monthlySales?.toLocaleString() || '0'}`}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              onClick={() => router.push('/reports')}
            />
            <Card
              title="Expiring Subs"
              value={stats?.expiringMemberships?.toString() || '0'}
              subtitle="Next 30 days"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              highlight={stats?.expiringMemberships > 0}
              onClick={() => router.push('/memberships')}
            />
            <Card
              title="New Signups"
              value={stats?.newSignups?.toString() || '0'}
              subtitle="This month"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
              onClick={() => router.push('/memberships')}
            />
          </>
        ) : (
          <>
            <Card
              title="Today's Sales"
              value={`₱${stats?.todaySales?.toLocaleString() || '0'}`}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <Card
              title="Weekly Sales"
              value={`₱${stats?.weeklySales?.toLocaleString() || '0'}`}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            />
            <Card
              title="Monthly Sales"
              value={`₱${stats?.monthlySales?.toLocaleString() || '0'}`}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
          </>
        )}
      </div>

      {/* Sales Overview Chart Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 12l3-3 3 3 4-4" />
            </svg>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Weekly Sales Overview</h2>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">Last 7 Days</p>
        </div>

        {/* Interactive Bar Chart */}
        <div className="relative group">
          <div className="h-64 flex items-end justify-between px-2 sm:px-4">
            {weeklyChart.length === 0 ? (
              <div className="w-full text-center text-slate-400 font-bold text-sm pb-8">No sales data yet for this period.</div>
            ) : (() => {
              const maxVal = Math.max(...weeklyChart.map(d => d.total), 1)
              return weeklyChart.map((d, i) => (
                <div key={i} className="flex flex-col items-center group/bar w-full max-w-[50px] sm:max-w-[70px] relative">
                  {/* Interaction Tooltip */}
                  <div className="absolute -top-12 opacity-0 group-hover/bar:opacity-100 transition-all duration-200 transform translate-y-2 group-hover/bar:translate-y-0 z-10">
                    <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-xl text-[11px] font-black whitespace-nowrap relative">
                      ${d.total.toFixed(2)}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                    </div>
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full rounded-xl transition-all duration-500 cursor-pointer hover:scale-[1.05] active:scale-95 shadow-sm
                      ${d.isToday ? 'bg-blue-600 shadow-blue-200 shadow-lg' : 'bg-blue-100 hover:bg-blue-200'}
                    `}
                    style={{ height: `${Math.max((d.total / maxVal) * 200, d.total > 0 ? 8 : 3)}px` }}
                  >
                    {d.isToday && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    )}
                  </div>

                  {/* Day Label */}
                  <span className={`mt-4 text-[13px] font-bold ${d.isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                    {d.day}
                  </span>
                </div>
              ))
            })()}
          </div>

          {/* Grid lines placeholder */}
          <div className="absolute inset-0 -z-10 flex flex-col justify-between py-2 mb-8 border-b border-slate-50 opacity-50">
            <div className="w-full border-t border-slate-50"></div>
            <div className="w-full border-t border-slate-50"></div>
            <div className="w-full border-t border-slate-50"></div>
          </div>
        </div>
      </div>

      {/* Action Cards Row */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-50 flex flex-col items-start hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 mb-6 font-bold">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">
            {store?.businessType === 'RESTAURANT' ? 'Manage Menu' : store?.businessType === 'GYM' ? 'Manage Services' : 'Manage Products'}
          </h3>
          <p className="text-[15px] font-semibold text-slate-400">Add, edit or remove items</p>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-50 flex flex-col items-start hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 mb-6 font-bold">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">View Reports</h3>
          <p className="text-[15px] font-semibold text-slate-400">Analyze sales and performance</p>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-50 flex flex-col items-start hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 mb-6 font-bold">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">
            {store?.businessType === 'GYM' ? 'Member Management' : 'Customer Insights'}
          </h3>
          <p className="text-[15px] font-semibold text-slate-400">
            {store?.businessType === 'GYM' ? 'Track member activity' : 'Track customer data'}
          </p>
        </div>
      </div>
    </div>
  )
}
