"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Menu,
    Globe,
    FileText,
    BarChart3,
    XCircle,
    Grid3X3,
    Compass,
    Users
} from "lucide-react"

interface AdminNavbarProps {
    onToggleSidebar?: () => void
    className?: string
}

export function AdminNavbar({ onToggleSidebar, className }: AdminNavbarProps) {
    const [currentTime, setCurrentTime] = useState<string>("")

    // Update clock every second
    useEffect(() => {
        const updateClock = () => {
            const now = new Date()
            const timeString = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
            setCurrentTime(timeString)
        }

        // Update immediately
        updateClock()

        // Set up interval
        const interval = setInterval(updateClock, 1000)

        // Cleanup
        return () => clearInterval(interval)
    }, [])

    return (
        <nav className={`bg-white border-b border-gray-200 px-4 py-3 ${className}`}>
            <div className="flex items-center justify-between">
                {/* Left: Hamburger Menu */}
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleSidebar}
                        className="p-2 hover:bg-gray-100"
                    >
                        <div className="flex flex-col space-y-1">
                            <div className="w-5 h-0.5 bg-green-600 rounded"></div>
                            <div className="w-5 h-0.5 bg-green-600 rounded"></div>
                            <div className="w-5 h-0.5 bg-green-600 rounded"></div>
                        </div>
                    </Button>
                </div>

                {/* Center: Main Navigation Buttons */}
                <div className="flex items-center gap-3">
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
                        onClick={() => window.open('/', '_blank')}
                    >
                        <Globe className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Website</span>
                    </Button>

                    <Button
                        className="bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
                        onClick={() => console.log('Customer Invoice clicked')}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Customer Invoice</span>
                    </Button>

                    <Button
                        className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
                        onClick={() => console.log('Booking Report clicked')}
                    >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Booking Report</span>
                    </Button>

                    <Button
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
                        onClick={() => console.log('Day Close clicked')}
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Day Close</span>
                    </Button>
                </div>

                {/* Right: Icon Buttons and Clock */}
                <div className="flex items-center gap-3">
                    {/* Icon Buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            onClick={() => console.log('Grid clicked')}
                        >
                            <Grid3X3 className="h-4 w-4 text-gray-600" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            onClick={() => console.log('Compass clicked')}
                        >
                            <Compass className="h-4 w-4 text-gray-600" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            onClick={() => console.log('Users clicked')}
                        >
                            <Users className="h-4 w-4 text-gray-600" />
                        </Button>
                    </div>

                    {/* Digital Clock */}
                    <div className="bg-gray-100 px-3 py-1 rounded-lg">
                        <span className="font-mono text-lg font-semibold text-gray-800">
                            {currentTime}
                        </span>
                    </div>
                </div>
            </div>
        </nav>
    )
}