"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '../../components/Modal'
import ThermalReceipt from '../../components/ThermalReceipt'

interface Product {
    id: number
    name: string
    barcode: string
    price: number
    stock: number
    isPrescriptionRequired?: boolean
    category?: string
}

interface CartItem extends Product {
    quantity: number
    verifiedRx?: string
}

export default function CheckoutPage() {
    const router = useRouter()
    const [store, setStore] = useState<any>(null)
    const [user, setUser] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Product[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [showCheckoutModal, setShowCheckoutModal] = useState(false)
    const [cashAmount, setCashAmount] = useState('')
    const [saleSuccess, setSaleSuccess] = useState<any>(null)
    const [showReceipt, setShowReceipt] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)

    const [orderId, setOrderId] = useState<string | null>(null)
    const [tableId, setTableId] = useState<string | null>(null)

    const [showRxModal, setShowRxModal] = useState<number | null>(null)
    const [rxRef, setRxRef] = useState('')

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        const storeStr = localStorage.getItem('store')
        if (!userStr || !storeStr) {
            router.push('/login')
            return
        }
        const s = JSON.parse(storeStr)
        setUser(JSON.parse(userStr))
        setStore(s)

        const params = new URLSearchParams(window.location.search)
        const oId = params.get('orderId')
        const tId = params.get('tableId')
        if (oId) {
            setOrderId(oId)
            setTableId(tId)
            fetchOrder(oId, s.id, tId)
        }
    }, [router])

    const fetchOrder = async (id: string, storeId: number, tId: string | null) => {
        try {
            const res = await fetch(`/api/orders?storeId=${storeId}&tableId=${tId || ''}`)
            const data = await res.json()
            if (data.success) {
                const activeOrder = data.data.find((o: any) => o.id === parseInt(id))
                if (activeOrder) {
                    setCart(activeOrder.items.map((item: any) => ({
                        id: item.productId,
                        name: item.product.name,
                        price: item.price,
                        quantity: item.quantity,
                        barcode: item.product.barcode || '',
                        stock: 999,
                        isPrescriptionRequired: item.product.isPrescriptionRequired
                    })))
                }
            }
        } catch (err) {
            console.error("Fetch order error:", err)
        }
    }

    const [isScannedPulse, setIsScannedPulse] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [capturedRx, setCapturedRx] = useState<string | null>(null)

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
                    const exactMatch = data.data.find((p: Product) =>
                        p.barcode.toLowerCase() === searchQuery.toLowerCase()
                    )
                    if (exactMatch) {
                        addToCart(exactMatch)
                        setSearchQuery('')
                        setIsScannedPulse(true)
                        setTimeout(() => setIsScannedPulse(false), 1000)
                    }
                }
            } catch (err) {
                console.error('Search error:', err)
            }
        }, 300)
        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery, store])

    const handleRxCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setCapturedRx(file.name)
            // Auto-verify items in cart that need Rx
            setCart(prev => prev.map(item =>
                item.isPrescriptionRequired ? { ...item, verifiedRx: `IMG-${new Date().getTime()}` } : item
            ))
        }
    }

    const addToCart = (product: any) => {
        if (store?.businessType !== 'RESTAURANT' && product.stock <= 0) {
            alert("Out of stock!")
            return
        }
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                if (store?.businessType !== 'RESTAURANT' && existing.quantity >= product.stock) {
                    alert("Cannot exceed available stock!")
                    return prev
                }
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                )
            }
            // If we have a captured RX, auto-verify new RX items
            const verifiedRx = (product.isPrescriptionRequired && capturedRx) ? `IMG-${new Date().getTime()}` : undefined
            return [...prev, { ...product, quantity: 1, isPrescriptionRequired: product.isPrescriptionRequired || false, verifiedRx }]
        })
        setSearchResults([])
        setSearchQuery('')
        searchInputRef.current?.focus()
    }

    const updateQuantity = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta
                if (newQty <= 0) return item
                if (store?.businessType !== 'RESTAURANT' && newQty > item.stock) return item
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(item => item.id !== id))
    }

    const openRxModal = (productId: number) => {
        const item = cart.find(i => i.id === productId)
        setRxRef(item?.verifiedRx || '')
        setShowRxModal(productId)
    }

    const saveRx = () => {
        setCart(prev => prev.map(item =>
            item.id === showRxModal ? { ...item, verifiedRx: rxRef } : item
        ))
        setShowRxModal(null)
        setRxRef('')
    }

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    const change = parseFloat(cashAmount) ? parseFloat(cashAmount) - total : 0

    const isCheckoutDisabled = () => {
        const needsRx = cart.filter(item => item.isPrescriptionRequired && !item.verifiedRx)
        return cart.length === 0 || needsRx.length > 0
    }

    const handleCheckout = async () => {
        if (isCheckoutDisabled()) return
        setIsProcessing(true)

        try {
            if (orderId) {
                const res = await fetch('/api/orders', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: parseInt(orderId), status: 'PAID' })
                })
                const data = await res.json()
                if (data.success) {
                    setSaleSuccess(data.data)
                    setCart([])
                    setCapturedRx(null)
                    setShowCheckoutModal(false)
                    setCashAmount('')
                } else {
                    alert(data.error || 'Failed to settle order')
                }
            } else {
                const res = await fetch('/api/sales', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cashierId: user.id,
                        items: cart.map(item => ({
                            productId: item.id,
                            quantity: item.quantity,
                            prescription: item.verifiedRx ? { referenceNumber: item.verifiedRx } : undefined
                        }))
                    })
                })
                const data = await res.json()
                if (data.success) {
                    setSaleSuccess(data.data)
                    setCart([])
                    setCapturedRx(null)
                    setShowCheckoutModal(false)
                    setCashAmount('')
                } else {
                    alert(data.error || 'Failed to process sale')
                }
            }
        } catch (err) {
            alert('Network error')
        } finally {
            setIsProcessing(false)
        }
    }

    const [categories, setCategories] = useState<string[]>([])
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const [allProducts, setAllProducts] = useState<Product[]>([])
    const [notes, setNotes] = useState('')

    useEffect(() => {
        if (store?.businessType === 'RESTAURANT') {
            fetchAllProducts()
        }
    }, [store])

    const fetchAllProducts = async () => {
        try {
            const res = await fetch(`/api/products?storeId=${store.id}`)
            const data = await res.json()
            if (data.success) {
                setAllProducts(data.data)
                const cats: string[] = Array.from(new Set(data.data.map((p: any) => p.category || 'General')))
                setCategories(cats)
                if (cats.length > 0) setActiveCategory(cats[0])
            }
        } catch (err) { console.error("Fetch products error:", err) }
    }

    const handleSendToKitchen = async () => {
        if (cart.length === 0) return
        setIsProcessing(true)
        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cashierId: user.id,
                    tableId: tableId ? parseInt(tableId) : undefined,
                    status: 'IN_PROGRESS',
                    items: cart.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        notes: notes || undefined
                    }))
                })
            })
            const data = await res.json()
            if (data.success) {
                alert("Order sent to kitchen!")
                setCart([])
                setNotes('')
                router.push('/tables')
            } else {
                alert(data.error || 'Failed to send to kitchen')
            }
        } catch (err) { alert('Network error') }
        finally { setIsProcessing(false) }
    }

    const filteredProducts = activeCategory
        ? allProducts.filter(p => (p.category || 'General') === activeCategory)
        : allProducts

    if (store?.businessType === 'RESTAURANT') {
        return (
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] overflow-hidden">
                {/* Left: Categories & Items */}
                <div className="flex-1 flex gap-6 min-w-0">
                    {/* Categories Sidebar */}
                    <div className="w-32 md:w-40 flex flex-col gap-3 overflow-y-auto pr-2 pb-6">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`
                                    px-4 py-6 rounded-[24px] text-center transition-all duration-300
                                    ${activeCategory === cat
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-[1.02]'
                                        : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 border border-slate-100'}
                                `}
                            >
                                <span className="font-black text-[11px] uppercase tracking-widest leading-tight">{cat}</span>
                            </button>
                        ))}
                    </div>

                    {/* Items Grid */}
                    <div className="flex-1 flex flex-col space-y-6">
                        {/* Search Bar (Mini) */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input
                                className="w-full h-14 pl-14 pr-6 rounded-[24px] bg-white border-none focus:ring-4 focus:ring-blue-500/5 transition-all text-base font-bold text-slate-800 placeholder:text-slate-200 shadow-sm border border-slate-50"
                                placeholder="Search menu..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Grid */}
                        <div className="flex-1 overflow-y-auto pb-10">
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        className="bg-white p-5 rounded-[32px] border border-slate-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col text-left group"
                                    >
                                        <div className="w-full aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center text-slate-200 overflow-hidden">
                                            {/* In a real app, img src={p.imageUrl} */}
                                            <svg className="w-12 h-12 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-[13px] leading-tight truncate px-1">{p.name}</h4>
                                        <div className="mt-2 flex items-center justify-between px-1">
                                            <span className="text-blue-600 font-black text-sm">₱{p.price.toFixed(2)}</span>
                                            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black">+</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Order Summary */}
                <div className="w-full lg:w-[400px] bg-white rounded-[40px] shadow-2xl border border-slate-50 flex flex-col overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Table {tableId || '--'}</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{cart.length} items in order</p>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {cart.map(item => (
                            <div key={item.id} className="flex items-center justify-between group">
                                <div className="flex-1 min-w-0 pr-4">
                                    <h4 className="font-black text-slate-800 uppercase tracking-tight text-[13px] leading-tight truncate">{item.name}</h4>
                                    <p className="text-[11px] font-black text-blue-600 mt-1">₱{(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1.5 hover:bg-slate-100 font-black text-slate-400">-</button>
                                    <span className="px-2 font-black text-slate-800 text-xs">{item.quantity}</span>
                                    <button onClick={() => addToCart(item)} className="px-3 py-1.5 hover:bg-slate-100 font-black text-blue-600">+</button>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 11-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                <p className="text-sm font-black uppercase tracking-widest">Empty Order</p>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-slate-50/50 border-t border-slate-50 space-y-6">
                        {/* Notes Input */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cooking Instructions</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                                placeholder="e.g. No onions, Medium rare..."
                                rows={2}
                            />
                        </div>

                        <div className="flex justify-between items-center text-slate-800">
                            <span className="text-sm font-black uppercase tracking-widest opacity-40">Estimate Total</span>
                            <span className="text-3xl font-black text-blue-600 tracking-tighter">₱{total.toFixed(2)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => window.print()}
                                className="h-16 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4h10z" /></svg>
                                Receipt
                            </button>
                            <button
                                onClick={handleSendToKitchen}
                                disabled={isProcessing || cart.length === 0}
                                className="h-16 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                {isProcessing ? '...' : 'To Kitchen'}
                            </button>
                        </div>

                        <button
                            onClick={() => setShowCheckoutModal(true)}
                            disabled={cart.length === 0}
                            className="w-full h-20 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-[28px] font-black text-xl transition-all active:scale-[0.98] shadow-2xl shadow-blue-200 flex items-center justify-center space-x-3 group"
                        >
                            <span>Checkout</span>
                            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </button>
                    </div>
                </div>

                {/* Shared Modals (Payment, Success, etc.) */}
                {showCheckoutModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCheckoutModal(false)}></div>
                        <div className="bg-white rounded-[40px] shadow-2xl z-10 w-full max-w-md p-10">
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-6">Settlement</h3>
                            <div className="space-y-6">
                                <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Due</span>
                                    <div className="text-4xl font-black">₱{total.toFixed(2)}</div>
                                </div>
                                <input
                                    className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 font-black text-xl shadow-inner"
                                    placeholder="Cash Received"
                                    value={cashAmount}
                                    onChange={e => setCashAmount(e.target.value)}
                                    autoFocus
                                />
                                {parseFloat(cashAmount) >= total && (
                                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex justify-between">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Change</span>
                                        <span className="text-lg font-black text-emerald-600">₱{change.toFixed(2)}</span>
                                    </div>
                                )}
                                <button onClick={handleCheckout} disabled={isProcessing || !cashAmount || parseFloat(cashAmount) < total} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all disabled:bg-slate-200">
                                    {isProcessing ? 'Processing...' : 'Confirm Paid'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const [retailActiveCategory, setRetailActiveCategory] = useState<string | null>(null)
    const [retailCategories, setRetailCategories] = useState<string[]>([])

    useEffect(() => {
        if (store?.businessType === 'RETAIL') {
            fetchAllProducts()
        }
    }, [store])

    if (store?.businessType === 'RETAIL') {
        const categories = Array.from(new Set(allProducts.map(p => p.category || 'General')))
        const filtered = retailActiveCategory
            ? allProducts.filter(p => (p.category || 'General') === retailActiveCategory)
            : allProducts

        return (
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] overflow-hidden">
                {/* Left: Search, Scan & Grid */}
                <div className="flex-1 flex flex-col space-y-6 min-w-0">
                    {/* Header: Search & Scan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input
                                ref={searchInputRef}
                                className="w-full h-16 pl-14 pr-6 rounded-[24px] bg-white border-none focus:ring-8 focus:ring-blue-500/5 transition-all text-lg font-black text-slate-800 placeholder:text-slate-200 shadow-2xl shadow-slate-200/40"
                                placeholder="Search product..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className={`h-16 bg-white rounded-[24px] border-2 border-dashed flex items-center px-6 gap-3 transition-all ${isScannedPulse ? 'border-blue-400 bg-blue-50' : 'border-slate-100'}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isScannedPulse ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {isScannedPulse ? 'Item Scanned!' : 'Scanner Ready'}
                            </span>
                        </div>
                    </div>

                    {/* Quick Add Grid */}
                    <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-[32px] shadow-sm border border-slate-50">
                        <div className="p-6 border-b border-slate-50 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setRetailActiveCategory(null)}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${!retailActiveCategory ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                All Items
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setRetailActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${retailActiveCategory === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                                {filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        className="p-4 rounded-3xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all text-left group"
                                    >
                                        <h4 className="font-black text-slate-800 text-[12px] uppercase truncate">{p.name}</h4>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-blue-600 font-black text-xs">₱{p.price.toFixed(2)}</span>
                                            <span className="text-[9px] font-bold text-slate-300">{p.stock} in stock</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Cart, Cash & Checkout */}
                <div className="w-full lg:w-[400px] flex flex-col gap-6">
                    <div className="flex-1 bg-white rounded-[40px] shadow-2xl border border-slate-50 flex flex-col overflow-hidden">
                        <div className="p-8 border-b border-slate-50">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Cart List</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{cart.length} unique items</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center justify-between group p-2 hover:bg-slate-50 rounded-2xl transition-all">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-[12px] truncate">{item.name}</h4>
                                        <p className="text-[10px] font-black text-blue-600">₱{item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex items-center bg-white border border-slate-100 rounded-lg shadow-sm">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 text-slate-300 hover:text-slate-600 font-black">-</button>
                                            <span className="px-2 text-[11px] font-black text-slate-800">{item.quantity}</span>
                                            <button onClick={() => addToCart(item)} className="px-2 py-1 text-blue-400 hover:text-blue-600 font-black">+</button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="text-slate-200 hover:text-rose-500 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {cart.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 text-center">
                                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 11-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Cart is Empty</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50/50 border-t border-slate-50 space-y-6">
                            <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                                <span className="text-3xl font-black text-slate-800 tracking-tighter">₱{total.toFixed(2)}</span>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cash Received</label>
                                    <input
                                        className="w-full h-14 px-6 rounded-2xl bg-white border-none focus:ring-4 focus:ring-blue-500/10 font-black text-xl text-slate-800 shadow-sm border border-slate-100"
                                        placeholder="0.00"
                                        value={cashAmount}
                                        onChange={e => setCashAmount(e.target.value)}
                                    />
                                </div>
                                {parseFloat(cashAmount) >= total && total > 0 && (
                                    <div className="bg-emerald-50 p-4 rounded-2xl flex justify-between items-center border border-emerald-100 shadow-sm animate-in slide-in-from-top-2 duration-300">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Change</span>
                                        <span className="text-xl font-black text-emerald-600">₱{change.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isProcessing || cart.length === 0 || !cashAmount || parseFloat(cashAmount) < total}
                                className="w-full h-20 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-[28px] font-black text-xl transition-all active:scale-[0.98] shadow-2xl shadow-blue-200 flex items-center justify-center space-x-3"
                            >
                                <span>{isProcessing ? 'Processing' : 'Checkout'}</span>
                                {!isProcessing && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Success View */}
                {saleSuccess && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={() => setSaleSuccess(null)}></div>
                        <div className="bg-white rounded-[40px] shadow-2xl z-10 w-full max-w-sm p-10 text-center">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Sale Complete!</h3>
                            <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">Transaction recorded</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowReceipt(true)}
                                    className="flex-1 h-14 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 transition flex items-center justify-center gap-2"
                                >
                                    Receipt
                                </button>
                                <button onClick={() => { setSaleSuccess(null); searchInputRef.current?.focus(); }} className="flex-[2] h-14 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition">
                                    Next Sale
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Receipt Modal */}
                {showReceipt && saleSuccess && (
                    <ThermalReceipt
                        sale={saleSuccess}
                        store={store}
                        cashReceived={parseFloat(cashAmount) || 0}
                        onClose={() => setShowReceipt(false)}
                    />
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
            {/* Left: Search & Utilities */}
            <div className="lg:w-[65%] flex flex-col space-y-6">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <svg className="w-6 h-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        ref={searchInputRef}
                        className="w-full h-20 pl-16 pr-6 rounded-[32px] bg-white border-none focus:ring-8 focus:ring-blue-500/5 transition-all text-xl font-black text-slate-800 placeholder:text-slate-200 shadow-2xl shadow-slate-200/40"
                        placeholder={store?.businessType === 'PHARMACY' ? "Search medicine name or scan barcode..." : "Search items..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                {searchResults.length > 0 && (
                    <div className="bg-white rounded-[32px] shadow-2xl border border-slate-50 overflow-hidden z-20">
                        {searchResults.map(p => (
                            <button key={p.id} onClick={() => addToCart(p)} className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                                <div className="flex flex-col items-start translate-y-0.5">
                                    <span className="font-black text-slate-800 uppercase tracking-tight text-[15px]">{p.name}</span>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.barcode || 'NO BARCODE'}</span>
                                        <span className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-6">
                                    {p.isPrescriptionRequired && (
                                        <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-100 italic">Rx Required</span>
                                    )}
                                    <span className="font-black text-blue-600 text-lg">₱{p.price.toFixed(2)}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {store?.businessType === 'PHARMACY' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={handleRxCapture}
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`bg-white rounded-[32px] p-8 border-2 border-dashed flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group ${capturedRx ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100'}`}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${capturedRx ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                {capturedRx ? (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                )}
                            </div>
                            <div>
                                <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">{capturedRx ? 'Image Captured' : 'Prescription Upload'}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {capturedRx ? capturedRx : 'Tap to capture Rx image'}
                                </p>
                            </div>
                        </div>

                        <div className={`bg-white rounded-[32px] p-8 border-2 border-dashed flex flex-col items-center justify-center text-center space-y-4 transition-all cursor-default group ${isScannedPulse ? 'border-blue-400 bg-blue-50 shadow-2xl shadow-blue-100 scale-[1.02]' : 'border-slate-100'}`}>
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${isScannedPulse ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600'}`}>
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </div>
                            <div>
                                <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">Scan Barcode</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{isScannedPulse ? 'Medicine Added!' : 'Ready for medicine scanner'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Cart & Order Summary */}
            <div className="w-full lg:w-[450px] bg-white rounded-[40px] shadow-2xl border border-slate-50 flex flex-col overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Cart List</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{cart.length} items selected</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cart.map(item => (
                        <div key={item.id} className="bg-slate-50/50 p-5 rounded-3xl space-y-4 border border-transparent hover:border-slate-100 transition-all">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0 pr-4">
                                    <h4 className="font-black text-slate-800 uppercase tracking-tight text-[13px] leading-tight truncate">{item.name}</h4>
                                    <p className="text-[11px] font-black text-blue-600 mt-1">₱{item.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1.5 hover:bg-slate-50 font-black text-slate-400">-</button>
                                    <span className="px-2 font-black text-slate-800 text-xs">{item.quantity}</span>
                                    <button onClick={() => addToCart(item)} className="px-3 py-1.5 hover:bg-slate-50 font-black text-blue-600">+</button>
                                </div>
                            </div>

                            {item.isPrescriptionRequired && (
                                <div className={`p-3 rounded-2xl flex items-center justify-between transition-all ${item.verifiedRx ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${item.verifiedRx ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${item.verifiedRx ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {item.verifiedRx ? `Ref: ${item.verifiedRx}` : 'Rx Required'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => openRxModal(item.id)}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${item.verifiedRx ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' : 'bg-rose-600 text-white shadow-lg shadow-rose-200'}`}
                                    >
                                        {item.verifiedRx ? 'Change' : 'Verify Rx'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 11-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            <p className="text-sm font-black uppercase tracking-widest">Empty Cart</p>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50/30 border-t border-slate-50">
                    <div className="space-y-3 mb-8">
                        {cart.some(i => i.isPrescriptionRequired && !i.verifiedRx) && (
                            <div className="flex items-center space-x-3 text-rose-600 animate-bounce">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">Prescription required for some items in cart</p>
                            </div>
                        )}
                        <div className="flex justify-between text-slate-800 text-3xl font-black tracking-tighter">
                            <span>Total</span>
                            <span className="text-blue-600">₱{total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowCheckoutModal(true)}
                        disabled={isCheckoutDisabled()}
                        className="w-full h-20 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-[28px] font-black text-xl transition-all active:scale-[0.98] shadow-2xl shadow-blue-200 flex items-center justify-center space-x-3 group"
                    >
                        <span>Checkout</span>
                        <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>
                </div>
            </div>

            <Modal open={showRxModal !== null} onClose={() => setShowRxModal(null)} title="Prescription Verification">
                <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enter medical reference or reference number</p>
                    <input
                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 font-black text-slate-700 shadow-inner"
                        placeholder="Rx Number (e.g. RX-2026-001)"
                        value={rxRef}
                        onChange={e => setRxRef(e.target.value)}
                        autoFocus
                    />
                    <button onClick={saveRx} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all">
                        Verify & Link Item
                    </button>
                </div>
            </Modal>

            {/* Payment Modal */}
            {showCheckoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCheckoutModal(false)}></div>
                    <div className="bg-white rounded-[40px] shadow-2xl z-10 w-full max-w-md p-10">
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-6">Settlement</h3>
                        <div className="space-y-6">
                            <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Due</span>
                                <div className="text-4xl font-black">₱{total.toFixed(2)}</div>
                            </div>
                            <input
                                className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 font-black text-xl shadow-inner"
                                placeholder="Cash Received"
                                value={cashAmount}
                                onChange={e => setCashAmount(e.target.value)}
                                autoFocus
                            />
                            {parseFloat(cashAmount) >= total && (
                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex justify-between">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Change</span>
                                    <span className="text-lg font-black text-emerald-600">₱{change.toFixed(2)}</span>
                                </div>
                            )}
                            <button onClick={handleCheckout} disabled={isProcessing || !cashAmount || parseFloat(cashAmount) < total} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all disabled:bg-slate-200">
                                {isProcessing ? 'Processing...' : 'Confirm Paid'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success View */}
            {saleSuccess && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={() => { setSaleSuccess(null); if (orderId) router.push('/tables'); }}></div>
                    <div className="bg-white rounded-[40px] shadow-2xl z-10 w-full max-w-sm p-10 text-center">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Success!</h3>
                        <p className="text-sm font-bold text-slate-400 mb-6 lowercase first-letter:uppercase">Transaction finalized successfully</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowReceipt(true)}
                                className="flex-1 h-14 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 transition flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Receipt
                            </button>
                            <button onClick={() => { setSaleSuccess(null); if (orderId) router.push('/tables'); else searchInputRef.current?.focus(); }} className="flex-[2] h-14 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition">
                                {orderId ? 'Back to Tables' : 'Next Sale'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceipt && saleSuccess && (
                <ThermalReceipt
                    sale={saleSuccess}
                    store={store}
                    cashReceived={parseFloat(cashAmount) || 0}
                    onClose={() => setShowReceipt(false)}
                />
            )}
        </div>
    )
}
