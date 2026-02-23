"use client"
import React, { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import ThermalReceipt from '../../components/ThermalReceipt'

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [businessType, setBusinessType] = useState('RETAIL')
  const [store, setStore] = useState<any>(null)
  const [selectedSale, setSelectedSale] = useState<any>(null)

  useEffect(() => {
    const storeStr = localStorage.getItem('store')
    const userStr = localStorage.getItem('user')
    if (storeStr) {
      const s = JSON.parse(storeStr)
      const u = userStr ? JSON.parse(userStr) : null
      setStore(s)
      setBusinessType(s.businessType || 'RETAIL')
      fetchSales(s.id)
    }
  }, [])

  const fetchSales = async (storeId: number) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/sales?storeId=${storeId}&limit=100`)
      const data = await res.json()
      if (data.success) {
        setSales(data.data)
      } else {
        setError(data.error || 'Failed to load sales')
      }
    } catch (err) {
      setError('Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-6">
          {businessType === 'RESTAURANT' ? 'Orders' : 'Sales History'}
        </h1>

        {/* Summary Row */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card
            title="Total Revenue"
            value={`₱${totalRevenue.toFixed(2)}`}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <Card
            title="Transactions"
            value={sales.length.toString()}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold">
          {error}
        </div>
      )}

      {/* Sales Table Section */}
      <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-50">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center text-slate-400 py-16 font-bold text-sm">
            No sales records yet. Complete a checkout to see transactions here.
          </div>
        ) : (
          <Table columns={["Sale ID", "Date", "Time", "Cashier", "Items", "Total", "Actions"]}>
            {sales.map(s => {
              const createdAt = new Date(s.createdAt)
              return (
                <tr key={s.id} className="group hover:bg-slate-50/80 transition-colors uppercase">
                  <td className="px-6 py-6 font-black text-slate-800 text-[14px] leading-tight group-hover:text-blue-600 transition-colors tracking-tight">
                    #{String(s.id).padStart(4, '0')}
                  </td>
                  <td className="px-6 py-6 font-bold text-slate-400 text-[11px] tracking-wider">
                    {createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-6 font-bold text-slate-400 text-[11px] tracking-wider">
                    {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-6 font-black text-slate-600 tracking-tight text-[13px]">
                    {s.cashier?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-6">
                    <span className="bg-slate-50 text-slate-500 border border-slate-100 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      {s.items?.length ?? 0} items
                    </span>
                  </td>
                  <td className="px-6 py-6 font-black text-blue-600 tracking-tight text-[15px] text-right">
                    ₱{s.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setSelectedSale(s)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all hover:scale-110 active:scale-90"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </Table>
        )}
      </div>

      {selectedSale && (
        <ThermalReceipt
          sale={selectedSale}
          store={store}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  )
}
