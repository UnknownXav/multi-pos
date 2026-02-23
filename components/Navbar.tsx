"use client"
import React, { useState, useEffect } from 'react'

interface NavbarProps {
  onMenuClick: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const data = JSON.parse(userStr)
      setUserName(data.name || 'User')
    }
  }, [])

  return (
    <header className="bg-transparent px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Hamburger Menu for Mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-blue-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        <div className="flex flex-col">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Welcome back,</p>
          <h1 className="text-lg font-black text-slate-800 tracking-tight leading-tight">{userName}</h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xs ring-4 ring-blue-50 shadow-sm">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
