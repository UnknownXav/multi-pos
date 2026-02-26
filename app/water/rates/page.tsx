"use client"
import React, { useState, useEffect } from 'react'

interface RateTier {
    fromCubicMeters: number
    toCubicMeters: number | null
    rate: number
    isMinimum: boolean
}

interface RateVersion {
    id: number
    name: string | null
    effectiveDate: string
    isActive: boolean
    tiers: RateTier[]
}

export default function WaterRatesPage() {
    const [rateVersions, setRateVersions] = useState<RateVersion[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)

    const [newVersion, setNewVersion] = useState<{
        name: string
        effectiveDate: string
        tiers: RateTier[]
    }>({
        name: 'Standard Rates',
        effectiveDate: new Date().toISOString().split('T')[0],
        tiers: [
            { fromCubicMeters: 0, toCubicMeters: 10, rate: 150, isMinimum: true },
            { fromCubicMeters: 10, toCubicMeters: 20, rate: 18, isMinimum: false },
        ]
    })

    useEffect(() => {
        fetchRates()
    }, [])

    const fetchRates = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/water/rates')
            const data = await res.json()
            if (data.success) {
                setRateVersions(data.data)
            }
        } catch (err) {
            console.error('Failed to fetch rates')
        } finally {
            setLoading(false)
        }
    }

    const handleAddTier = () => {
        const lastTier = newVersion.tiers[newVersion.tiers.length - 1]
        const from = lastTier.toCubicMeters || lastTier.fromCubicMeters + 10
        setNewVersion({
            ...newVersion,
            tiers: [...newVersion.tiers, { fromCubicMeters: from, toCubicMeters: null, rate: 0, isMinimum: false }]
        })
    }

    const handleUpdateTier = (index: number, field: string, value: any) => {
        const updatedTiers = [...newVersion.tiers]
        updatedTiers[index] = { ...updatedTiers[index], [field]: value }
        setNewVersion({ ...newVersion, tiers: updatedTiers })
    }

    const handleSave = async () => {
        try {
            const res = await fetch('/api/water/rates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newVersion),
            })
            const data = await res.json()
            if (data.success) {
                setIsAdding(false)
                fetchRates()
            } else {
                alert(data.error)
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
                        <span className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">📈</span>
                        Rate Configuration
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage tiered pricing versions</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center space-x-2"
                    >
                        <span>+</span>
                        <span>Create New Version</span>
                    </button>
                )}
            </div>

            {isAdding ? (
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-black text-slate-800 tracking-tight">Version Details</h2>
                        <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">Cancel</button>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Version Name</label>
                                <input
                                    type="text"
                                    value={newVersion.name}
                                    onChange={e => setNewVersion({ ...newVersion, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Effective Date</label>
                                <input
                                    type="date"
                                    value={newVersion.effectiveDate}
                                    onChange={e => setNewVersion({ ...newVersion, effectiveDate: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consumption Tiers</label>
                                <button onClick={handleAddTier} className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline">+ Add Tier</button>
                            </div>

                            {newVersion.tiers.map((tier, index) => (
                                <div key={index} className="flex gap-3 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex-1">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">From (m³)</label>
                                        <input
                                            type="number"
                                            value={isNaN(tier.fromCubicMeters) ? '' : tier.fromCubicMeters}
                                            onChange={e => handleUpdateTier(index, 'fromCubicMeters', parseFloat(e.target.value))}
                                            className="w-full px-3 py-2 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-700 focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">To (m³)</label>
                                        <input
                                            type="number"
                                            value={tier.toCubicMeters === null || isNaN(tier.toCubicMeters) ? '' : tier.toCubicMeters}
                                            placeholder="Max"
                                            onChange={e => handleUpdateTier(index, 'toCubicMeters', e.target.value ? parseFloat(e.target.value) : null)}
                                            className="w-full px-3 py-2 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-700 focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Rate (₱)</label>
                                        <input
                                            type="number"
                                            value={isNaN(tier.rate) ? '' : tier.rate}
                                            onChange={e => handleUpdateTier(index, 'rate', parseFloat(e.target.value))}
                                            className="w-full px-3 py-2 bg-white border border-slate-100 rounded-xl font-black text-sm text-blue-600 focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 pb-2">
                                        <input
                                            type="checkbox"
                                            checked={tier.isMinimum}
                                            onChange={e => handleUpdateTier(index, 'isMinimum', e.target.checked)}
                                            className="w-4 h-4 rounded-md border-slate-200 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Minimum</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-base hover:bg-blue-700 transition shadow-lg shadow-blue-100 mt-4"
                        >
                            Activate New Rates
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {rateVersions.map(v => (
                        <div key={v.id} className={`bg-white rounded-[32px] p-8 border transition-all ${v.isActive ? 'border-blue-200 shadow-md ring-1 ring-blue-50' : 'border-slate-100 shadow-sm opacity-60'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{v.name || 'Revision'}</h3>
                                        {v.isActive && (
                                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">Active</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Effective since {new Date(v.effectiveDate).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {v.tiers.map((tier, idx) => (
                                    <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{tier.isMinimum ? 'Minimum Charge' : `Tier ${idx + 1}`}</span>
                                            <span className="text-[10px] font-bold text-slate-300">{tier.fromCubicMeters} - {tier.toCubicMeters || '∞'} m³</span>
                                        </div>
                                        <div className="text-xl font-black text-slate-800">
                                            ₱{tier.rate.toFixed(2)}
                                            {!tier.isMinimum && <span className="text-[10px] font-bold text-slate-400 ml-1">/ m³</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
