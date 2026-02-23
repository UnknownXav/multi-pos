"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function KitchenPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<any[]>([])
    const [store, setStore] = useState<any>(null)

    useEffect(() => {
        const storeStr = localStorage.getItem('store')
        if (!storeStr) {
            router.push('/login')
            return
        }
        const s = JSON.parse(storeStr)
        setStore(s)
        fetchOrders(s.id)

        // Poll for new orders every 10 seconds
        const interval = setInterval(() => fetchOrders(s.id), 10000)
        return () => clearInterval(interval)
    }, [router])

    const fetchOrders = async (storeId: number) => {
        try {
            const res = await fetch(`/api/orders?storeId=${storeId}`)
            const data = await res.json()
            if (data.success) {
                // Only show orders that are IN_PROGRESS or READY (for recently finished)
                // Filter out OPEN (waiter still adding) and PAID (finished)
                const kitchenOrders = data.data.filter((o: any) =>
                    o.status === 'IN_PROGRESS' || o.status === 'READY'
                )
                setOrders(kitchenOrders)
            }
        } catch (err) {
            console.error("Fetch kitchen orders error:", err)
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (orderId: number, newStatus: string) => {
        try {
            const res = await fetch(`/api/orders`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: newStatus })
            })
            const data = await res.json()
            if (data.success) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
            }
        } catch (err) {
            alert("Failed to update status")
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    )

    return (
        <div className="space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Kitchen Queue</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time Order Monitoring</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Monitoring Active</span>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white rounded-[40px] border border-slate-50 p-20 flex flex-col items-center justify-center space-y-4">
                    <div className="bg-slate-50 p-6 rounded-full text-slate-300">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active orders in the kitchen</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map(order => (
                        <div key={order.id} className={`bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-50 flex flex-col transition-all ${order.status === 'READY' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                            <div className={`px-6 py-4 flex items-center justify-between ${order.status === 'READY' ? 'bg-emerald-500' : 'bg-slate-900'} text-white`}>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Table {order.table?.tableNumber || '??'}</span>
                                    <span className="font-black text-lg">Order #{order.id}</span>
                                </div>
                                <div className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-lg uppercase tracking-tighter">
                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                            <div className="p-6 flex-1 space-y-4">
                                {order.items.map((item: any) => (
                                    <div key={item.id} className="flex items-start justify-between group">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600">{item.quantity}</span>
                                                <span className="font-bold text-slate-800 uppercase tracking-tight text-sm">{item.product.name}</span>
                                            </div>
                                            {item.notes && (
                                                <div className="mt-1 ml-8 p-2 bg-amber-50 rounded-lg border-l-2 border-amber-400">
                                                    <p className="text-[10px] font-bold text-amber-700 italic leading-tight">{item.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 bg-slate-50/50 border-t border-slate-50">
                                {order.status === 'IN_PROGRESS' ? (
                                    <button
                                        onClick={() => updateStatus(order.id, 'READY')}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-100"
                                    >
                                        Mark as Ready
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-center space-x-2 py-2 text-emerald-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Order Ready</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
