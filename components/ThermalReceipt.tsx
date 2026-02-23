"use client"
import React, { useRef, useState } from 'react'

interface ReceiptProps {
    sale: any
    store: any
    cashReceived?: number
    onClose: () => void
}

export default function ThermalReceipt({ sale, store, cashReceived, onClose }: ReceiptProps) {
    const receiptRef = useRef<HTMLDivElement>(null)
    const [downloading, setDownloading] = useState(false)

    if (!sale) return null

    const change = cashReceived ? cashReceived - sale.total : 0

    const handlePrint = () => {
        const printContent = receiptRef.current?.innerHTML || ''
        const printWindow = window.open('', '', 'width=400,height=700')
        if (!printWindow) return
        printWindow.document.write(`
      <html>
        <head>
          <title>Receipt #${sale.id?.toString().padStart(6, '0')}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 10px; margin: 0; padding: 16px; color: #000; }
            * { box-sizing: border-box; }
            .separator { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 2px 0; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .big { font-size: 14px; }
            .small { font-size: 8px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => { printWindow.print(); printWindow.close() }, 300)
    }

    const handleDownloadPDF = async () => {
        setDownloading(true)
        try {
            const { default: jsPDF } = await import('jspdf')
            const { default: html2canvas } = await import('html2canvas')
            if (!receiptRef.current) return
            const canvas = await html2canvas(receiptRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' })
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({ unit: 'mm', format: [80, canvas.height * 80 / canvas.width], orientation: 'portrait' })
            pdf.addImage(imgData, 'PNG', 0, 0, 80, canvas.height * 80 / canvas.width)
            pdf.save(`Receipt-${sale.id?.toString().padStart(6, '0')}.pdf`)
        } catch (err) {
            console.error('PDF error:', err)
        } finally {
            setDownloading(false)
        }
    }

    // Render receipt content both for display and print
    const ReceiptContent = () => (
        <div ref={receiptRef} className="bg-white p-5 font-mono text-[10px] leading-tight text-black w-full max-w-[280px] mx-auto">
            {/* Store Header */}
            <div className="text-center mb-3">
                <p className="text-[15px] font-extrabold uppercase tracking-tight">{store?.name}</p>
                <p className="text-[9px] uppercase tracking-widest opacity-60">{store?.businessType}</p>
                <div className="border-t border-dashed border-black mt-2 mb-1 opacity-40" />
            </div>

            {/* Meta Info */}
            <div className="space-y-0.5 mb-3">
                <div className="flex justify-between">
                    <span className="opacity-60">Receipt #</span>
                    <span className="font-bold">{sale.id?.toString().padStart(6, '0')}</span>
                </div>
                <div className="flex justify-between">
                    <span className="opacity-60">Date</span>
                    <span className="font-bold">{new Date(sale.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="opacity-60">Time</span>
                    <span className="font-bold">{new Date(sale.createdAt).toLocaleTimeString()}</span>
                </div>
                {sale.cashier?.name && (
                    <div className="flex justify-between">
                        <span className="opacity-60">Cashier</span>
                        <span className="font-bold">{sale.cashier.name}</span>
                    </div>
                )}
                {sale.table?.tableNumber && (
                    <div className="flex justify-between">
                        <span className="opacity-60">Table</span>
                        <span className="font-bold">#{sale.table.tableNumber}</span>
                    </div>
                )}
            </div>

            <div className="border-t border-dashed border-black opacity-40 mb-2" />

            {/* Items */}
            <table className="w-full mb-2">
                <thead>
                    <tr className="border-b border-black border-opacity-20">
                        <th className="text-left py-1 font-extrabold">Item</th>
                        <th className="text-right py-1 font-extrabold">Qty</th>
                        <th className="text-right py-1 font-extrabold">Amt</th>
                    </tr>
                </thead>
                <tbody>
                    {(sale.items || []).map((item: any, i: number) => (
                        <tr key={i}>
                            <td className="py-0.5 uppercase max-w-[120px] truncate">{item.product?.name || item.name}</td>
                            <td className="text-right py-0.5">×{item.quantity}</td>
                            <td className="text-right py-0.5">₱{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-t border-dashed border-black opacity-40 mb-2" />

            {/* Totals */}
            <div className="space-y-0.5 mb-2">
                <div className="flex justify-between font-extrabold text-xs mt-1">
                    <span>TOTAL</span>
                    <span>₱{sale.total.toFixed(2)}</span>
                </div>
                {cashReceived && cashReceived > 0 && (
                    <>
                        <div className="flex justify-between">
                            <span className="opacity-60">Cash</span>
                            <span className="font-bold">₱{cashReceived.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="opacity-60">Change</span>
                            <span className="font-bold">₱{change.toFixed(2)}</span>
                        </div>
                    </>
                )}
                <div className="flex justify-between">
                    <span className="opacity-60">Payment</span>
                    <span className="font-bold uppercase">{sale.paymentMethod || 'Cash'}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-4 space-y-1">
                <div className="border-t border-dashed border-black opacity-40 mb-2" />
                <p className="font-extrabold text-[9px] uppercase tracking-widest">Thank you for your patronage!</p>
                <p className="opacity-40 text-[8px]">Powered by Antigravity POS</p>
            </div>
        </div>
    )

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl" onClick={onClose} />
            <div className="relative bg-slate-50 rounded-[32px] shadow-2xl z-10 w-full max-w-sm overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Receipt</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Complete</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Receipt Preview */}
                <div className="mx-4 mb-4 bg-white rounded-2xl border border-slate-100 shadow-inner overflow-auto max-h-[50vh]">
                    <ReceiptContent />
                </div>

                {/* Action Buttons */}
                <div className="p-4 grid grid-cols-2 gap-3">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-800 text-white font-black text-sm hover:bg-slate-900 transition disabled:opacity-50 shadow-lg"
                    >
                        {downloading ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                        ) : (
                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>Save PDF</>
                        )}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center justify-center gap-2 h-12 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                    </button>
                </div>
            </div>
        </div>
    )
}
