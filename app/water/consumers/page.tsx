"use client"
import React, { useState, useEffect } from 'react'
import Table from '@/components/Table'
import ConsumerForm from '@/components/ConsumerForm'

interface Consumer {
    id: number
    accountNumber: string
    name: string
    address: string
    contactNumber: string | null
    meterNumber: string | null
    connectionType: string
    status: string
    initialReading: number
}

export default function WaterConsumersPage() {
    const [consumers, setConsumers] = useState<Consumer[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingConsumer, setEditingConsumer] = useState<Consumer | undefined>(undefined)

    useEffect(() => {
        fetchConsumers()
    }, [])

    const fetchConsumers = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/water/consumers')
            const data = await res.json()
            if (data.success) {
                setConsumers(data.data)
            } else {
                setError(data.error)
            }
        } catch (err) {
            setError('Failed to fetch consumers')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveConsumer = async (formData: any) => {
        try {
            const url = editingConsumer ? `/api/water/consumers/${editingConsumer.id}` : '/api/water/consumers'
            const res = await fetch(url, {
                method: editingConsumer ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
            const data = await res.json()
            if (data.success) {
                setIsFormOpen(false)
                setEditingConsumer(undefined)
                fetchConsumers()
            } else {
                alert(data.error || 'Failed to save consumer')
            }
        } catch (err) {
            alert('Network error')
        }
    }

    const handleEdit = (consumer: Consumer) => {
        setEditingConsumer(consumer)
        setIsFormOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this consumer? This will also remove all their readings and bills history.')) return
        try {
            const res = await fetch(`/api/water/consumers/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                fetchConsumers()
            } else {
                alert(data.error || 'Failed to delete consumer')
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
                        <span className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">👥</span>
                        Consumer Accounts
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage water utility subscribers</p>
                </div>
                <button
                    onClick={() => { setEditingConsumer(undefined); setIsFormOpen(true); }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center space-x-2"
                >
                    <span>+</span>
                    <span>Register Consumer</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold flex items-center space-x-3">
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-50">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                    </div>
                ) : consumers.length === 0 ? (
                    <div className="text-center text-slate-400 py-12 font-bold text-sm">
                        No consumers registered yet.
                    </div>
                ) : (
                    <Table columns={["Account No.", "Consumer Name", "Meter No.", "Type", "Status", "Actions"]}>
                        {consumers.map(c => (
                            <tr key={c.id} className="group hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-5">
                                    <span className="font-mono text-[11px] font-black text-slate-400 tracking-widest bg-slate-50 px-2 py-1 rounded">
                                        {c.accountNumber}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-800 text-[14px] uppercase tracking-tight group-hover:text-blue-600">{c.name}</span>
                                        <span className="text-[10px] text-slate-400 font-bold truncate max-w-[200px]">{c.address}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="font-bold text-slate-600 text-sm">{c.meterNumber || '---'}</span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${c.connectionType === 'Residential' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        c.connectionType === 'Commercial' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            'bg-slate-50 text-slate-600 border-slate-100'
                                        }`}>
                                        {c.connectionType}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${c.status === 'Active' ? 'text-emerald-500' : 'text-slate-300'
                                        }`}>
                                        ● {c.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right flex justify-end gap-2">
                                    <button
                                        onClick={() => handleEdit(c)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                        title="Edit Consumer"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                        title="Delete Consumer"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </Table>
                )}
            </div>

            <ConsumerForm
                open={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingConsumer(undefined); }}
                onSave={handleSaveConsumer}
                consumer={editingConsumer}
            />
        </div>
    )
}
