"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '../../../components/Modal'
import Table from '../../../components/Table'

export default function InventoryAuditPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [store, setStore] = useState<any>(null)
    const [logs, setLogs] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])

    // Adjustment Form
    const [showAdjust, setShowAdjust] = useState(false)
    const [selectedProductId, setSelectedProductId] = useState('')
    const [quantity, setQuantity] = useState('')
    const [type, setType] = useState('CORRECTION')
    const [reason, setReason] = useState('')

    useEffect(() => {
        const storeStr = localStorage.getItem('store')
        if (!storeStr) {
            router.push('/login')
            return
        }
        const s = JSON.parse(storeStr)
        setStore(s)
        fetchData(s.id)
    }, [router])

    const fetchData = async (storeId: number) => {
        try {
            const [lRes, pRes] = await Promise.all([
                fetch(`/api/inventory/audit?storeId=${storeId}`),
                fetch(`/api/products?storeId=${storeId}`)
            ])
            const [lData, pData] = await Promise.all([lRes.json(), pRes.json()])
            if (lData.success) setLogs(lData.data)
            if (pData.success) setProducts(pData.data)
        } catch (err) {
            console.error("Fetch data error:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleAdjust = async () => {
        if (!selectedProductId || !quantity || !type) return
        try {
            const userStr = localStorage.getItem('user')
            const user = userStr ? JSON.parse(userStr) : null

            const res = await fetch('/api/inventory/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: parseInt(selectedProductId),
                    userId: user?.id,
                    quantity: parseInt(quantity),
                    type,
                    reason
                })
            })
            const data = await res.json()
            if (data.success) {
                setShowAdjust(false)
                setQuantity(''); setReason('');
                fetchData(store.id)
            }
        } catch (err) {
            alert("Adjustment failed")
        }
    }

    const handleDeleteLog = async (id: number) => {
        if (!confirm("Delete this audit log entry? This cannot be undone.")) return
        try {
            const res = await fetch(`/api/inventory/audit?id=${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                fetchData(store.id)
            }
        } catch (err) {
            alert("Delete failed")
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Inventory Audit Log</h1>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Stock Movements & Corrections</p>
                </div>
                <button
                    onClick={() => setShowAdjust(true)}
                    className="px-8 h-12 rounded-2xl bg-blue-600 font-black text-white shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center space-x-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    <span>Manual Adjustment</span>
                </button>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-slate-50 overflow-hidden">
                <Table columns={["Date", "Product", "Type", "Qty", "Reason", "User", "Actions"]}>
                    {logs.map((log: any) => (
                        <tr key={log.id} className="group hover:bg-slate-50/80 transition-colors">
                            <td className="py-6 px-6 font-bold text-slate-400 text-[11px] leading-tight">{new Date(log.createdAt).toLocaleString()}</td>
                            <td className="py-6 px-6">
                                <span className="font-black text-slate-800 uppercase tracking-tight text-[13px]">{log.product?.name}</span>
                                <span className="block text-[10px] text-slate-400 font-medium">#{log.product?.id}</span>
                            </td>
                            <td className="py-6 px-6">
                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${["IN", "RETURN"].includes(log.type) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                    }`}>
                                    {log.type}
                                </span>
                            </td>
                            <td className={`py-6 px-6 font-black text-[15px] ${["IN", "RETURN"].includes(log.type) ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                {["IN", "RETURN"].includes(log.type) ? '+' : '-'}{Math.abs(log.quantity)}
                            </td>
                            <td className="py-6 px-6 text-slate-500 font-medium text-xs max-w-[200px] truncate italic">{log.reason || 'No notes provided'}</td>
                            <td className="py-6 px-6">
                                <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                                        {log.user?.name?.charAt(0)}
                                    </div>
                                    <span className="font-black text-slate-400 text-[10px] uppercase tracking-wider">{log.user?.name}</span>
                                </div>
                            </td>
                            <td className="py-6 px-6">
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => handleDeleteLog(log.id)}
                                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all hover:scale-110 active:scale-90"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </Table>
            </div>

            <Modal open={showAdjust} onClose={() => setShowAdjust(false)} title="New Stock Adjustment">
                <div className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Product</label>
                        <select
                            className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none font-bold"
                            value={selectedProductId}
                            onChange={e => setSelectedProductId(e.target.value)}
                        >
                            <option value="">Search/Choose Product...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} (Current: {p.stock})</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adjustment Type</label>
                            <select
                                className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none font-bold"
                                value={type}
                                onChange={e => setType(e.target.value)}
                            >
                                <option value="IN">Stock In / Restock</option>
                                <option value="OUT">Manual Sale / Out</option>
                                <option value="DAMAGE">Damaged / Expired</option>
                                <option value="RETURN">Customer Return</option>
                                <option value="CORRECTION">General Correction</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                            <input
                                type="number"
                                className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none font-bold"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason / Notes</label>
                        <textarea
                            className="w-full p-4 rounded-xl bg-slate-50 border-none font-medium h-24"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="e.g. Monthly audit correction..."
                        />
                    </div>

                    <button
                        onClick={handleAdjust}
                        className="w-full h-16 bg-slate-900 text-white rounded-3xl font-black shadow-xl hover:bg-black transition"
                    >
                        Commit Adjustment
                    </button>
                </div>
            </Modal>
        </div>
    )
}
