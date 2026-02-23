"use client"
import React from 'react'

export default function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children?: React.ReactNode }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Enhanced Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="bg-white rounded-[24px] shadow-2xl shadow-slate-900/20 z-10 w-full max-w-[480px] overflow-hidden transform transition-all duration-300 scale-100 opacity-100 animate-in fade-in zoom-in slide-in-from-bottom-4">
        {/* Modal Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-slate-50">
          {title && <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>}
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
