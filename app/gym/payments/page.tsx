"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ThermalReceipt from '../../../components/ThermalReceipt'

export default function GymPaymentsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [store, setStore] = useState<any>(null)

    const [searchTerm, setSearchTerm] = useState('')
    const [members, setMembers] = useState<any[]>([])
    const [plans, setPlans] = useState<any[]>([])

    const [selectedMember, setSelectedMember] = useState<any>(null)
    const [selectedPlanId, setSelectedPlanId] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('cash')

    const [processing, setProcessing] = useState(false)
    const [lastSale, setLastSale] = useState<any>(null)
    const [showReceipt, setShowReceipt] = useState(false)

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
            const [mRes, pRes] = await Promise.all([
                fetch(`/api/members?storeId=${storeId}`),
                fetch(`/api/membership-plans?storeId=${storeId}`)
            ])
            const [mData, pData] = await Promise.all([mRes.json(), pRes.json()])
            if (mData.success) setMembers(mData.data)
            if (pData.success) setPlans(pData.data)
        } catch (err) {
            console.error("Fetch data error:", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.barcode && m.barcode.includes(searchTerm))
    )

    const processRenewal = async () => {
        if (!selectedMember || !selectedPlanId) return
        setProcessing(true)
        try {
            const plan = plans.find(p => p.id === parseInt(selectedPlanId))

            // We'll use the existing /api/sales endpoint but specially formatted for gym renewal
            // since the database structure uses Sale -> SaleItem(Service/Product)
            // and we also need to update the subscription. 
            // For simplicity in this POS flow, we'll create a renewal API or use a transaction.

            const res = await fetch('/api/gym/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: store.id,
                    memberId: selectedMember.id,
                    planId: plan.id,
                    paymentMethod,
                    amount: plan.price
                })
            })

            const data = await res.json()
            if (data.success) {
                setLastSale(data.data)
                setShowReceipt(true)
                setSelectedMember(null)
                setSelectedPlanId('')
                fetchData(store.id)
            } else {
                alert(data.error || "Payment failed")
            }
        } catch (err) {
            alert("Network error")
        } finally {
            setProcessing(false)
        }
    }

    if (loading || !store) return <div className="p-8">Loading Payment System...</div>

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gym POS & Payments</h1>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Membership Renewals & Billing</p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-2xl flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Active Store: {store.name}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Search & Select Member */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 space-y-4">
                        <div className="relative">
                            <input
                                placeholder="Search Member or Scan Card..."
                                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 focus:ring-2 ring-blue-100 transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <svg className="w-5 h-5 absolute left-4 top-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>

                        <div className="h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {filteredMembers.map(m => {
                                const sub = m.subscriptions[0]
                                const isExpired = sub ? new Date(sub.endDate) < new Date() : true
                                return (
                                    <div
                                        key={m.id}
                                        onClick={() => setSelectedMember(m)}
                                        className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${selectedMember?.id === m.id ? 'border-blue-600 bg-blue-50/30' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-black text-slate-800 uppercase tracking-tight text-sm">{m.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400">{sub?.plan.name || 'No Plan'}</div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${isExpired ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'}`}>
                                                {isExpired ? 'Expired' : 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Payment Details */}
                <div className="lg:col-span-7">
                    {selectedMember ? (
                        <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-50 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center space-x-4 border-b border-slate-50 pb-6">
                                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                                    {selectedMember.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{selectedMember.name}</h2>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Selected for Renewal</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Renewal Plan</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {plans.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedPlanId(p.id.toString())}
                                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-start ${selectedPlanId === p.id.toString() ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-100' : 'border-slate-100 hover:border-blue-200'}`}
                                            >
                                                <span className="font-black text-slate-800 uppercase text-xs tracking-tight">{p.name}</span>
                                                <span className="text-blue-600 font-black text-lg">₱{p.price}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{p.durationDays} Days</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                                    <div className="flex space-x-2">
                                        {['cash', 'card', 'gcash', 'transfer'].map(method => (
                                            <button
                                                key={method}
                                                onClick={() => setPaymentMethod(method)}
                                                className={`flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${paymentMethod === method ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-50">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                                        <span className="text-4xl font-black text-slate-900">₱{plans.find(p => p.id === parseInt(selectedPlanId))?.price.toLocaleString() || '0.00'}</span>
                                    </div>
                                    <button
                                        onClick={processRenewal}
                                        disabled={!selectedPlanId || processing}
                                        className={`w-full h-20 rounded-[24px] font-black text-xl tracking-tight shadow-xl transition-all flex items-center justify-center space-x-4
                                    ${!selectedPlanId ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 active:scale-[0.98]'}
                                `}
                                    >
                                        {processing ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white"></div>
                                        ) : (
                                            <>
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                <span>Confirm & Activate</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-[40px] border-4 border-dashed border-slate-100 min-h-[500px]">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            </div>
                            <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Select a member to start</h3>
                            <p className="text-sm font-bold text-slate-300">Renewals are instant and secure</p>
                        </div>
                    )}
                </div>
            </div>

            {showReceipt && lastSale && (
                <ThermalReceipt
                    sale={lastSale}
                    store={store}
                    onClose={() => setShowReceipt(false)}
                />
            )}
        </div>
    )
}
