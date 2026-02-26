"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '../../components/Card'
import Modal from '../../components/Modal'

const STATUS_CONFIG: Record<string, { label: string; bg: string; ring: string; dot: string; shadow: string }> = {
  AVAILABLE: { label: 'Available', bg: 'bg-emerald-500', ring: 'ring-emerald-300', dot: 'bg-emerald-400', shadow: 'shadow-emerald-200' },
  OCCUPIED: { label: 'Occupied', bg: 'bg-rose-500', ring: 'ring-rose-300', dot: 'bg-rose-400', shadow: 'shadow-rose-200' },
  RESERVED: { label: 'Reserved', bg: 'bg-amber-400', ring: 'ring-amber-300', dot: 'bg-amber-400', shadow: 'shadow-amber-200' },
  CLEANING: { label: 'Cleaning', bg: 'bg-sky-400', ring: 'ring-sky-300', dot: 'bg-sky-400', shadow: 'shadow-sky-200' },
}

const ChairIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
    <path d="M5 3h14v6H5V3zm-2 7h18v2H3v-2zm1 3h2v8H4v-8zm14 0h2v8h-2v-8zM7 13h10v2H7v-2z" />
  </svg>
)

export default function TablesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tables, setTables] = useState<any[]>([])
  const [store, setStore] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: 4 })
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [contextMenu, setContextMenu] = useState<{ table: any; x: number; y: number } | null>(null)

  useEffect(() => {
    const storeStr = localStorage.getItem('store')
    if (!storeStr) { router.push('/login'); return }
    const s = JSON.parse(storeStr)
    setStore(s)
    fetchTables()
  }, [router])

  useEffect(() => {
    const closeMenu = () => setContextMenu(null)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables')
      const data = await res.json()
      if (data.success) setTables(data.data)
    } catch (err) { console.error("Fetch tables error:", err) }
    finally { setLoading(false) }
  }

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTable.tableNumber) return
    setAdding(true); setError('')
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: newTable.tableNumber, capacity: parseInt(newTable.capacity.toString()) })
      })
      const data = await res.json()
      if (data.success) {
        setTables([...tables, data.data]); setShowModal(false)
        setNewTable({ tableNumber: '', capacity: 4 })
      } else { setError(data.error || 'Failed to add table') }
    } catch { setError('An error occurred') }
    finally { setAdding(false) }
  }

  const updateTableStatus = async (tableId: number, status: string) => {
    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (data.success) setTables(tables.map(t => t.id === tableId ? { ...t, status } : t))
    } catch (err) { console.error("Update table error:", err) }
    setContextMenu(null)
  }

  const handleTableClick = (table: any) => {
    if (table.status === 'AVAILABLE' || table.status === 'OCCUPIED') {
      router.push(`/orders/${table.id}`)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, table: any) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ table, x: e.clientX, y: e.clientY })
  }

  const stats = {
    occupied: tables.filter(t => t.status === 'OCCUPIED').length,
    available: tables.filter(t => t.status === 'AVAILABLE').length,
    reserved: tables.filter(t => t.status === 'RESERVED').length,
    cleaning: tables.filter(t => t.status === 'CLEANING').length,
  }
  const occupancyPct = tables.length ? Math.round((stats.occupied / tables.length) * 100) : 0

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Floor Plan</h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Live Table Status</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchTables} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2"
          >
            <span className="text-xl leading-none">+</span> Add Table
          </button>
        </div>
      </div>

      {/* Stat Chips */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: 'Occupied', count: stats.occupied, color: 'bg-rose-50 text-rose-600 border-rose-100' },
          { label: 'Available', count: stats.available, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
          { label: 'Reserved', count: stats.reserved, color: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'Cleaning', count: stats.cleaning, color: 'bg-sky-50 text-sky-600 border-sky-100' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-2 px-4 py-2 rounded-full border font-black text-xs uppercase tracking-widest ${s.color}`}>
            <span>{s.count}</span><span>{s.label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest">
          <div className="w-28 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-rose-400 rounded-full transition-all duration-700" style={{ width: `${occupancyPct}%` }} />
          </div>
          {occupancyPct}% Occupied
        </div>
      </div>

      {/* Floor Grid */}
      <div className="bg-white rounded-[32px] p-6 md:p-10 shadow-sm border border-slate-50 min-h-[500px] relative">
        {/* Grid paper background */}
        <div className="absolute inset-0 rounded-[32px] opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest">Dining Area</h3>
            <div className="flex items-center gap-4">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.bg}`} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>

          {tables.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <div className="text-8xl">🪑</div>
              <p className="text-slate-400 font-black text-lg">No tables yet</p>
              <p className="text-slate-300 text-sm font-bold">Click "Add Table" to set up your floor plan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {tables.map(table => {
                const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.AVAILABLE
                const isClickable = table.status === 'AVAILABLE' || table.status === 'OCCUPIED'
                return (
                  <div
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    onContextMenu={(e) => handleContextMenu(e, table)}
                    className={`
                      relative group flex flex-col rounded-3xl overflow-hidden
                      shadow-xl ${cfg.shadow} transition-all duration-200
                      ${isClickable ? 'cursor-pointer hover:scale-[1.05] active:scale-95' : 'cursor-context-menu opacity-80'}
                      border-2 border-white
                    `}
                  >
                    {/* Status bar top */}
                    <div className={`${cfg.bg} h-1.5 w-full`} />

                    {/* Table body */}
                    <div className="bg-white p-4 flex-1 flex flex-col items-center justify-center gap-2 min-h-[120px]">
                      {/* Chair icons top */}
                      <div className="flex gap-1 text-slate-300">
                        {Array.from({ length: Math.min(Math.ceil(table.capacity / 2), 3) }).map((_, i) => <ChairIcon key={i} />)}
                      </div>

                      {/* Table number */}
                      <div className={`w-14 h-14 rounded-2xl ${cfg.bg} flex items-center justify-center shadow-lg ${cfg.shadow} ring-4 ring-white`}>
                        <span className="text-lg font-black text-white">{table.tableNumber}</span>
                      </div>

                      {/* Chair icons bottom */}
                      <div className="flex gap-1 text-slate-300">
                        {Array.from({ length: Math.min(Math.floor(table.capacity / 2), 3) }).map((_, i) => <ChairIcon key={i} />)}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50/60 py-2 px-3 flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{table.capacity} seats</span>
                      <div className={`w-2 h-2 rounded-full ${cfg.bg} ring-2 ${cfg.ring}`} />
                    </div>

                    {/* Status label badge */}
                    <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full ${cfg.bg} bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <span className={`text-[8px] font-black uppercase tracking-widest text-white`}>{cfg.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[200] bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <p className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
            Table {contextMenu.table.tableNumber}
          </p>
          {Object.entries(STATUS_CONFIG).filter(([k]) => k !== contextMenu.table.status).map(([status, cfg]) => (
            <button
              key={status}
              onClick={() => updateTableStatus(contextMenu.table.id, status)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition text-left"
            >
              <div className={`w-3 h-3 rounded-full ${cfg.bg}`} />
              <span className="text-sm font-bold text-slate-700">Mark as {cfg.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Table">
        <form onSubmit={handleAddTable} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Table Number / Name</label>
            <input
              type="text" required placeholder="e.g. T1, VIP-1, Patio-2"
              value={newTable.tableNumber}
              onChange={e => setNewTable({ ...newTable, tableNumber: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-blue-600 transition"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Capacity (Seats)</label>
            <input
              type="number" required min="1" max="20"
              value={isNaN(newTable.capacity) ? '' : newTable.capacity}
              onChange={e => setNewTable({ ...newTable, capacity: e.target.value ? parseInt(e.target.value) : NaN })}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <button
            type="submit" disabled={adding}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-black hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 mt-4"
          >
            {adding ? 'Adding...' : 'Add Table'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
