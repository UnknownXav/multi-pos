"use client"
import React from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = React.useState(false)
    const isAuthPage = pathname === '/login' || pathname === '/register'

    if (isAuthPage) {
        return <main className="min-h-screen w-full bg-slate-50">{children}</main>
    }

    return (
        <div className="min-h-screen flex bg-slate-50">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-4 md:p-8 lg:p-10 pt-4 max-w-[1600px] w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
