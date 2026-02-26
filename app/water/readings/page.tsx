"use client"
import React, { useState, useEffect } from 'react'
import Table from '@/components/Table'
import ReadingForm from '@/components/ReadingForm'

interface Reading {
    id: number
    billingPeriod: string
    previousReading: number
    currentReading: number
    consumption: number
    readingDate: string
    consumer: {
        name: string
        accountNumber: string
    }
}

export default function WaterReadingsPage() {
    const [readings, setReadings] = useState<Reading[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)

    useEffect(() => {
        fetchReadings()
    }, [])

    const fetchReadings = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/water/readings')
            const data = await res.json()
            if (data.success) {
                setReadings(data.data)
            } else {
                setError(data.error)
            }
        } catch (err) {
            setError('Failed to fetch readings')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveReading = async (formData: any) => {
        try {
            const res = await fetch('/api/water/readings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
            const data = await res.json()
            if (data.success) {
                setIsFormOpen(false)
                fetchReadings()
            } else {
                alert(data.error || 'Failed to save reading')
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
                        <span className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">📏</span>
                        Meter Readings
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Encode and track consumption logs</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center space-x-2"
                >
                    <span>+</span>
                    <span>Add New Reading</span>
                </button>
            </div>

            <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-50">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                    </div>
                ) : readings.length === 0 ? (
                    <div className="text-center text-slate-400 py-12 font-bold text-sm">
                        No readings recorded yet.
                    </div>
                ) : (
                    <Table columns={["Consumer", "Period", "Prev Reading", "Curr Reading", "Consumption", "Date"]}>
                        {readings.map(r => (
                            <tr key={r.id} className="group hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-800 text-[14px] uppercase tracking-tight group-hover:text-blue-600">{r.consumer.name}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{r.consumer.accountNumber}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 font-bold text-slate-600">{r.billingPeriod}</td>
                                <td className="px-6 py-5 text-slate-400 font-bold">{r.previousReading.toFixed(2)}</td>
                                <td className="px-6 py-5 text-slate-800 font-black">{r.currentReading.toFixed(2)}</td>
                                <td className="px-6 py-5">
                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest">
                                        {r.consumption.toFixed(2)} m³
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-slate-400 font-bold text-xs">{new Date(r.readingDate).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </Table>
                )}
            </div>

            <ReadingForm
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveReading}
            />
        </div>
    )
}
