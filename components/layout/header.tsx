"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Globe, FileText, Calendar, X } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
<<<<<<< HEAD
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
=======
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date()); // initial render time on client only

>>>>>>> d9299a39947c9a83503269616be33424172b30ba
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
    <header className="bg-background text-foreground border-b border-border">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left section */}
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-[var(--radius-sm)] hover:bg-muted transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Center section */}
        <div className="flex-1"></div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <Link href="/website" className="px-4 py-2 bg-chart-2 hover:bg-chart-2/90 text-white flex items-center gap-2 text-sm font-medium rounded-[var(--radius-lg)]">
            <Globe className="w-4 h-4" />
            <span>Website</span>
          </Link>

          <Link href="/customer-invoice" className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 text-sm font-medium rounded-[var(--radius-lg)]">
            <FileText className="w-4 h-4" />
            <span>Customer Invoice</span>
          </Link>

          <Link href="/booking-report" className="px-4 py-2 bg-muted-foreground hover:bg-muted-foreground/90 text-white flex items-center gap-2 text-sm font-medium rounded-[var(--radius-lg)]">
            <Calendar className="w-4 h-4" />
            <span>Booking Report</span>
          </Link>

          <Link href="/day-close" className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center gap-2 text-sm font-medium rounded-[var(--radius-lg)]">
            <X className="w-4 h-4" />
            <span>Day Close</span>
          </Link>

          <button className="px-3 py-2 hover:bg-muted border border-border h-10 flex items-center justify-center rounded-[var(--radius-lg)]">
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              <div className="w-1.5 h-1.5 bg-muted-foreground"></div>
              <div className="w-1.5 h-1.5 bg-muted-foreground"></div>
              <div className="w-1.5 h-1.5 bg-muted-foreground"></div>
              <div className="w-1.5 h-1.5 bg-muted-foreground"></div>
            </div>
          </button>

          <button className="px-3 py-2 hover:bg-muted border border-border h-10 flex items-center justify-center rounded-[var(--radius-lg)]">
            <div className="w-3 h-3 border-2 border-muted-foreground transform rotate-45"></div>
          </button>

          <button className="px-3 py-2 hover:bg-muted border border-border h-10 flex items-center justify-center rounded-[var(--radius-lg)]">
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground relative">
              <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-muted-foreground rounded-full"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2.5 h-1.5 bg-muted-foreground rounded-t-full"></div>
            </div>
          </button>

          {/* Time Display */}
          <div className="px-4 py-2 border border-border h-10 flex items-center justify-center bg-card rounded-[var(--radius-lg)]">
<<<<<<< HEAD
            <span className="text-sm font-mono text-card-foreground font-bold tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
              {isMounted ? formatTime(currentTime) : '--:--:--'}
=======
            <span
              className="text-sm font-mono text-card-foreground font-bold tracking-wider"
              style={{ fontFamily: 'var(--font-mono)' }}
              suppressHydrationWarning
            >
              {currentTime ? formatTime(currentTime) : '--:--:--'}
>>>>>>> d9299a39947c9a83503269616be33424172b30ba
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
