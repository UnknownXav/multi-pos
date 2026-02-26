"use client"
import React, { useState, useEffect } from 'react'
import Table from '@/components/Table'
import PaymentForm from '@/components/PaymentForm'

interface Bill {
    id: number
    consumer: {
        name: string
        accountNumber: string
    }
    reading: {
        billingPeriod: string
        consumption: number
    }
    totalAmount: number
    paidAmount: number
    balance: number
    dueDate: string
    status: string
}

export default function WaterBillingPage() {
    const [bills, setBills] = useState<Bill[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('Unpaid') // Unpaid, Overdue, Paid, All
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)

    useEffect(() => {
        fetchBills()
    }, [filter])

    const fetchBills = async () => {
        try {
            setLoading(true)
            // Use the reports endpoint to get bills or create a dedicated Bills GET endpoint
            // For now, we'll fetch via the readings endpoint which includes bills
            const res = await fetch(`/api/water/readings`)
            const data = await res.json()
            if (data.success) {
                // Flatten and filter for UI
                const flattened = data.data
                    .filter((r: any) => r.bill)
                    .map((r: any) => ({
                        ...r.bill,
                        consumer: r.consumer,
                        reading: { billingPeriod: r.billingPeriod, consumption: r.consumption }
                    }))
                    .filter((b: any) => filter === 'All' ? true : (filter === 'Overdue' ? b.status === 'Overdue' : (filter === 'Paid' ? b.status === 'Paid' : (b.status === 'Unpaid' || b.status === 'Partially Overdue' || b.status === 'Partially Paid'))))

                setBills(flattened)
            }
        } catch (err) {
            console.error('Failed to fetch bills')
        } finally {
            setLoading(false)
        }
    }

    const handleProcessPayment = async (paymentData: any) => {
        try {
            const res = await fetch('/api/water/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData),
            })
            const data = await res.json()
            if (data.success) {
                setIsPaymentOpen(false)
                setSelectedBill(null)
                fetchBills()
            } else {
                alert(data.error)
            }
        } catch (err) {
            alert('Network error')
        }
    }

    const handleApplyPenalties = async () => {
        if (!confirm('Are you sure you want to apply penalties to all overdue accounts today?')) return
        try {
            const res = await fetch('/api/water/maintenance/penalties', { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                alert(data.message)
                fetchBills()
            }
        } catch (err) {
            alert('Network error')
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <span className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">💵</span>
                        Billing & Collection
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Process payments and manage receivables</p>
                </div>
                <button
                    onClick={handleApplyPenalties}
                    className="bg-rose-50 text-rose-600 px-6 py-3 rounded-xl font-bold hover:bg-rose-100 transition border border-rose-100 flex items-center space-x-2"
                >
                    <span>⚖️</span>
                    <span>Apply Daily Penalties</span>
                </button>
            </div>

            <div className="flex items-center space-x-4">
                {['Unpaid', 'Overdue', 'Paid', 'All'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition ${filter === f ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-50">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                    </div>
                ) : bills.length === 0 ? (
                    <div className="text-center text-slate-400 py-12 font-bold text-sm">
                        No bills found for this filter.
                    </div>
                ) : (
                    <Table columns={["Consumer", "Period", "Due Date", "Amount", "Balance", "Status", "Actions"]}>
                        {bills.map(b => {
                            const overdue = new Date(b.dueDate) < new Date() && b.status !== 'Paid'
                            return (
                                <tr key={b.id} className={`group hover:bg-slate-50 transition-colors ${overdue ? 'bg-rose-50/20' : ''}`}>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800 text-[14px] uppercase tracking-tight group-hover:text-blue-600">{b.consumer.name}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{b.consumer.accountNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-bold text-slate-600">{b.reading.billingPeriod}</td>
                                    <td className="px-6 py-5">
                                        <span className={`text-xs font-bold ${overdue ? 'text-rose-500' : 'text-slate-400'}`}>
                                            {new Date(b.dueDate).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 font-black text-slate-800 text-sm text-right">₱{b.totalAmount.toFixed(2)}</td>
                                    <td className="px-6 py-5 text-right">
                                        <span className={`font-black text-sm ${b.balance > 0 ? 'text-blue-600' : 'text-emerald-500'}`}>
                                            ₱{b.balance.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${b.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            b.status === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        {b.status !== 'Paid' && (
                                            <button
                                                onClick={() => { setSelectedBill(b); setIsPaymentOpen(true); }}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-md shadow-blue-100"
                                            >
                                                Pay
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </Table>
                )}
            </div>

            <PaymentForm
                open={isPaymentOpen}
                onClose={() => { setIsPaymentOpen(false); setSelectedBill(null); }}
                onSave={handleProcessPayment}
                bill={selectedBill}
            />
        </div>
    )
}
