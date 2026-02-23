"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Card from '../../../components/Card'
import Modal from '../../../components/Modal'

interface Product {
    id: number
    name: string
    price: number
    stock: number
    category?: string
}

interface OrderItem {
    productId: number
    name: string
    price: number
    quantity: number
    notes: string
}

export default function OrderPage() {
    const params = useParams()
    const tableId = params.tableId as string
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [store, setStore] = useState<any>(null)
    const [user, setUser] = useState<any>(null)
    const [table, setTable] = useState<any>(null)
    const [order, setOrder] = useState<any>(null)

    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Product[]>([])
    const [cart, setCart] = useState<OrderItem[]>([])
    const [isSaving, setIsSaving] = useState(false)

    const [showNoteModal, setShowNoteModal] = useState<number | null>(null) // productId
    const [tempNote, setTempNote] = useState('')

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        const storeStr = localStorage.getItem('store')
        if (!userStr || !storeStr) {
            router.push('/login')
            return
        }
        setUser(JSON.parse(userStr))
        setStore(JSON.parse(storeStr))

        fetchInitialData(JSON.parse(storeStr).id)
    }, [router, tableId])

    const fetchInitialData = async (storeId: number) => {
        try {
            // 1. Fetch Table
            const tRes = await fetch(`/api/tables?storeId=${storeId}`)
            const tData = await tRes.json()
            if (tData.success) {
                const foundTable = tData.data.find((t: any) => t.id === parseInt(tableId))
                setTable(foundTable)
            }

            // 2. Fetch Active Order
            const oRes = await fetch(`/api/orders?storeId=${storeId}&tableId=${tableId}`)
            const oData = await oRes.json()
            if (oData.success && oData.data.length > 0) {
                setOrder(oData.data[0])
            }
        } catch (err) {
            console.error("Fetch initial data error:", err)
        } finally {
            setLoading(false)
        }
    }

    // Search Logic
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([])
            return
        }

        const delayDebounceFn = setTimeout(async () => {
            try {
                const res = await fetch(`/api/products?q=${searchQuery}&storeId=${store.id}`)
                const data = await res.json()
                if (data.success) {
                    setSearchResults(data.data)
                }
            } catch (err) {
                console.error('Search error:', err)
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery, store])

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id)
            if (existing) {
                return prev.map(item =>
                    item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
                )
            }
            return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, notes: '' }]
        })
        setSearchQuery('')
        setSearchResults([])
    }

    const openNoteModal = (index: number) => {
        setTempNote(cart[index].notes)
        setShowNoteModal(index)
    }

    const saveNote = () => {
        if (showNoteModal === null) return
        setCart(cart.map((item, i) => i === showNoteModal ? { ...item, notes: tempNote } : item))
        setShowNoteModal(null)
    }

    const handleOpenOrder = async () => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: store.id,
                    tableId: parseInt(tableId),
                    cashierId: user.id
                })
            })
            const data = await res.json()
            if (data.success) {
                setOrder(data.data)
                setTable({ ...table, status: 'OCCUPIED' })
            }
        } catch (err) {
            alert("Failed to open order")
        } finally {
            setIsSaving(false)
        }
    }

    const sendToKitchen = async () => {
        if (cart.length === 0) return
        setIsSaving(true)
        try {
            const res = await fetch('/api/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    status: 'IN_PROGRESS',
                    items: cart
                })
            })
            const data = await res.json()
            if (data.success) {
                setOrder(data.data)
                setCart([])
                alert("Order sent to kitchen!")
            }
        } catch (err) {
            alert("Failed to send to kitchen")
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    )

    if (!table) return <div className="p-10 text-center">Table not found</div>

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            {/* Left: Menu Search */}
            <div className="flex-1 flex flex-col space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Table {table.tableNumber}</h1>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${table.status === 'OCCUPIED' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                {table.status}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">Capacity: {table.capacity} Seats</span>
                        </div>
                    </div>
                    {!order && (
                        <button
                            onClick={handleOpenOrder}
                            disabled={isSaving}
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg"
                        >
                            {isSaving ? 'Opening...' : 'Open New Order'}
                        </button>
                    )}
                </div>

                {order && (
                    <>
                        <div className="relative">
                            <input
                                className="w-full h-14 pl-12 pr-4 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg font-medium shadow-sm"
                                placeholder="Search products/menu items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <svg className="absolute left-4 top-4.5 w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-20 max-h-60 overflow-y-auto">
                                {searchResults.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b last:border-0 text-left"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800 uppercase tracking-tight">{p.name}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.category || 'Food'}</span>
                                        </div>
                                        <span className="font-black text-blue-600">${p.price.toFixed(2)}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="bg-white rounded-3xl p-6 border border-slate-50 flex-1 overflow-y-auto">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Current Order Progress</h3>
                            {order.items && order.items.length > 0 ? (
                                <div className="space-y-3">
                                    {order.items.map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl">
                                            <div>
                                                <span className="font-bold text-slate-700">{item.quantity}x {item.product.name}</span>
                                                {item.notes && <p className="text-[10px] italic text-slate-400 mt-0.5">Note: {item.notes}</p>}
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${order.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-300 italic text-sm text-center py-10 font-bold">No items sent to kitchen yet.</p>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Right: Cart/Draft Order */}
            <div className="w-full lg:w-[450px] bg-white rounded-[32px] shadow-2xl border border-slate-50 flex flex-col overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">New Items</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pending kitchen transmission</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 text-center">
                            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 11-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            <span className="text-[11px] font-black uppercase tracking-widest">Select items to add</span>
                        </div>
                    ) : (
                        cart.map((item, i) => (
                            <div key={i} className="group animate-in slide-in-from-right-4 duration-200">
                                <div className="flex items-start justify-between mb-1">
                                    <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">{item.quantity}x {item.name}</h4>
                                    <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => openNoteModal(i)}
                                        className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest hover:bg-blue-100 transition"
                                    >
                                        {item.notes ? 'Edit Note' : '+ Add Note'}
                                    </button>
                                    {item.notes && <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">"{item.notes}"</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-8 bg-white border-t border-slate-100">
                    <button
                        onClick={sendToKitchen}
                        disabled={cart.length === 0 || isSaving}
                        className="w-full h-16 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-[24px] font-black text-lg shadow-xl shadow-blue-200 transition-all flex items-center justify-center space-x-3"
                    >
                        <span>Send to Kitchen</span>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>

                    {order && (
                        <button
                            onClick={() => router.push(`/checkout?tableId=${tableId}&orderId=${order.id}`)}
                            className="w-full mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition"
                        >
                            Or Go to Billing / Checkout
                        </button>
                    )}
                </div>
            </div>

            <Modal open={showNoteModal !== null} onClose={() => setShowNoteModal(null)} title="Item Notes">
                <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cooking instructions for {showNoteModal !== null ? cart[showNoteModal].name : ''}</p>
                    <textarea
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-600 min-h-[120px]"
                        placeholder="e.g. No onions, Medium rare..."
                        value={tempNote}
                        onChange={e => setTempNote(e.target.value)}
                    />
                    <button
                        onClick={saveNote}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-black hover:bg-black transition"
                    >
                        Save Note
                    </button>
                </div>
            </Modal>
        </div>
    )
}
