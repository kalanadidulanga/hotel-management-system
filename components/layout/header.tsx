"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Globe, FileText, Calendar, X } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <header className="bg-white text-gray-800 shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left section - Menu Toggle only */}
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Center section - Empty for spacing */}
        <div className="flex-1"></div>

        {/* Right section - All Action Items and Time */}
        <div className="flex items-center gap-2">
          {/* Action Buttons */}
          <Link
            href="/website"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
          >
            <Globe className="w-4 h-4" />
            <span>Website</span>
          </Link>

          <Link
            href="/customer-invoice"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            <span>Customer Invoice</span>
          </Link>

          <Link
            href="/booking-report"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
          >
            <Calendar className="w-4 h-4" />
            <span>Booking Report</span>
          </Link>

          <Link
            href="/day-close"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
          >
            <X className="w-4 h-4" />
            <span>Day Close</span>
          </Link>

          {/* Additional Action Icons */}
          <button className="px-3 py-2 hover:bg-gray-100 transition-colors duration-200 border border-gray-300 h-10 flex items-center justify-center">
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              <div className="w-1.5 h-1.5 bg-gray-600"></div>
              <div className="w-1.5 h-1.5 bg-gray-600"></div>
              <div className="w-1.5 h-1.5 bg-gray-600"></div>
              <div className="w-1.5 h-1.5 bg-gray-600"></div>
            </div>
          </button>
          
          <button className="px-3 py-2 hover:bg-gray-100 transition-colors duration-200 border border-gray-300 h-10 flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-gray-600 transform rotate-45"></div>
          </button>
          
          <button className="px-3 py-2 hover:bg-gray-100 transition-colors duration-200 border border-gray-300 h-10 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border-2 border-gray-600 relative">
              <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2.5 h-1.5 bg-gray-600 rounded-t-full"></div>
            </div>
          </button>

          {/* Time Display - Right corner */}
          <div className="px-4 py-2 border border-gray-300 h-10 flex items-center justify-center bg-white">
            <span className="text-sm font-mono text-gray-800 font-bold tracking-wider" style={{ fontFamily: 'monospace' }}>
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}