"use client"
import React, { useState, useEffect } from 'react'

interface ReadingFormProps {
    open: boolean
    onClose: () => void
    onSave: (reading: any) => void
}

export default function ReadingForm({ open, onClose, onSave }: ReadingFormProps) {
    const [consumers, setConsumers] = useState<any[]>([])
    const [loadingConsumers, setLoadingConsumers] = useState(false)

    const [formData, setFormData] = useState({
        consumerId: '',
        billingPeriod: new Date().toISOString().slice(0, 7), // YYYY-MM
        currentReading: '',
        readingDate: new Date().toISOString().split('T')[0],
        environmentalFee: 0,
        serviceCharge: 0
    })

    useEffect(() => {
        if (open) {
            fetchConsumers()
        }
    }, [open])

    const fetchConsumers = async () => {
        try {
            setLoadingConsumers(true)
            const res = await fetch('/api/water/consumers')
            const data = await res.json()
            if (data.success) {
                setConsumers(data.data)
            }
        } catch (err) {
            console.error('Failed to fetch consumers')
        } finally {
            setLoadingConsumers(false)
        }
    }

    if (!open) return null

    const selectedConsumer = consumers.find(c => c.id === parseInt(formData.consumerId))

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Encode Meter Reading</h2>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Search Consumer</label>
                            <select
                                value={formData.consumerId}
                                onChange={e => setFormData({ ...formData, consumerId: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all appearance-none"
                            >
                                <option value="">Select a consumer...</option>
                                {consumers.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.accountNumber} - {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Billing Period</label>
                                <input
                                    type="month"
                                    value={formData.billingPeriod}
                                    onChange={e => setFormData({ ...formData, billingPeriod: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Reading Date</label>
                                <input
                                    type="date"
                                    value={formData.readingDate}
                                    onChange={e => setFormData({ ...formData, readingDate: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Current Meter Reading</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.currentReading}
                                onChange={e => setFormData({ ...formData, currentReading: e.target.value })}
                                placeholder="0.00"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-black text-2xl text-blue-600 placeholder:text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all text-center"
                            />
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-2">
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                                <span>Consumer Details</span>
                            </div>
                            {selectedConsumer ? (
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-800 text-sm">{selectedConsumer.name}</p>
                                    <p className="text-xs text-slate-500 font-medium">Meter No: <span className="text-slate-700 font-bold">{selectedConsumer.meterNumber}</span></p>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">Select a consumer to see details</p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={onClose}
                                className="flex-1 h-12 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all border border-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onSave(formData)}
                                disabled={!formData.consumerId || !formData.currentReading}
                                className="flex-1 h-12 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-30 disabled:pointer-events-none"
                            >
                                Submit Reading
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
