"use client"
import React, { useState, useEffect } from 'react'

interface PaymentFormProps {
    open: boolean
    onClose: () => void
    onSave: (payment: any) => void
    bill: any
}

export default function PaymentForm({ open, onClose, onSave, bill }: PaymentFormProps) {
    const [formData, setFormData] = useState({
        amount: '',
        paymentMethod: 'Cash',
        referenceNumber: ''
    })

    useEffect(() => {
        if (bill) {
            setFormData({
                amount: bill.balance.toString(),
                paymentMethod: 'Cash',
                referenceNumber: ''
            })
        }
    }, [bill, open])

    if (!open || !bill) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Process Payment</h2>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50 mb-6 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Total</p>
                            <p className="text-xl font-black text-slate-800">₱{bill.totalAmount.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding</p>
                            <p className="text-xl font-black text-blue-600">₱{bill.balance.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Payment Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Payment Method</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Cash', 'GCash', 'Bank Transfer', 'Other'].map(method => (
                                    <button
                                        key={method}
                                        onClick={() => setFormData({ ...formData, paymentMethod: method })}
                                        className={`h-11 rounded-xl font-bold text-sm transition-all border ${formData.paymentMethod === method
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                                                : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                                            }`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Reference No. (Optional)</label>
                            <input
                                type="text"
                                value={formData.referenceNumber}
                                onChange={e => setFormData({ ...formData, referenceNumber: e.target.value })}
                                placeholder="e.g. TRN-123456"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={onClose}
                                className="flex-1 h-12 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all border border-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onSave({ ...formData, billId: bill.id })}
                                disabled={!formData.amount || parseFloat(formData.amount) <= 0}
                                className="flex-1 h-12 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-30 disabled:pointer-events-none"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
