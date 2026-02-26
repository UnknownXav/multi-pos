"use client"
import React, { useState, useEffect } from 'react'

interface ConsumerFormProps {
    open: boolean
    onClose: () => void
    onSave: (consumer: any) => void
    consumer?: any
}

export default function ConsumerForm({ open, onClose, onSave, consumer }: ConsumerFormProps) {
    const [formData, setFormData] = useState({
        accountNumber: '',
        name: '',
        address: '',
        contactNumber: '',
        meterNumber: '',
        connectionType: 'Residential',
        initialReading: 0
    })

    useEffect(() => {
        if (consumer) {
            setFormData({
                accountNumber: consumer.accountNumber || '',
                name: consumer.name || '',
                address: consumer.address || '',
                contactNumber: consumer.contactNumber || '',
                meterNumber: consumer.meterNumber || '',
                connectionType: consumer.connectionType || 'Residential',
                initialReading: consumer.initialReading || 0
            })
        } else {
            setFormData({
                accountNumber: '',
                name: '',
                address: '',
                contactNumber: '',
                meterNumber: '',
                connectionType: 'Residential',
                initialReading: 0
            })
        }
    }, [consumer, open])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                            {consumer ? 'Edit Consumer' : 'Register New Consumer'}
                        </h2>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Account Number</label>
                                <input
                                    type="text"
                                    value={formData.accountNumber}
                                    onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                                    placeholder="e.g. 2026-001"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Meter Number</label>
                                <input
                                    type="text"
                                    value={formData.meterNumber}
                                    onChange={e => setFormData({ ...formData, meterNumber: e.target.value })}
                                    placeholder="e.g. SN-99212"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Consumer Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Juan Dela Cruz"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Address</label>
                            <textarea
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Brgy. Poblacion, Zone 1..."
                                rows={2}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Connection Type</label>
                                <select
                                    value={formData.connectionType}
                                    onChange={e => setFormData({ ...formData, connectionType: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all appearance-none"
                                >
                                    <option value="Residential">🏠 Residential</option>
                                    <option value="Commercial">🏢 Commercial</option>
                                    <option value="Industrial">🏭 Industrial</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Initial Reading</label>
                                <input
                                    type="number"
                                    value={isNaN(formData.initialReading) ? '' : formData.initialReading}
                                    onChange={e => setFormData({ ...formData, initialReading: e.target.value ? parseFloat(e.target.value) : NaN })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Contact Number (Optional)</label>
                            <input
                                type="text"
                                value={formData.contactNumber}
                                onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                                placeholder="09123456789"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
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
                                onClick={() => onSave(formData)}
                                className="flex-1 h-12 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                            >
                                {consumer ? 'Update Data' : 'Save Consumer'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
