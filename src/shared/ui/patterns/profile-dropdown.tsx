'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/shared/ui/cn';

export interface ProfileDropdownProps {
  userName: string;
  userInitials: string;
  userEmail: string;
  signOutAction: (payload: FormData) => void;
}

export function ProfileDropdown({
  userName,
  userInitials,
  userEmail,
  signOutAction,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 pl-1 pr-1 cursor-pointer group"
        aria-expanded={isOpen}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#9333EA] to-[#A855F7] text-white font-bold text-[13px] shadow-md shadow-brand-primary/30 ring-1 ring-border-strong/10 transition-all">
          {userInitials}
        </div>
        <div className="hidden md:flex flex-col items-start leading-none">
          <span className="text-[14px] font-bold text-text-primary group-hover:text-brand-primary transition-colors tracking-tight">
            {userName}
          </span>
        </div>
        <svg
          className={cn(
            "hidden md:block ml-1 h-4 w-4 text-text-tertiary transition-transform duration-200",
            isOpen ? "rotate-180" : ""
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <div
        className={cn(
          "absolute right-0 mt-3 w-64 origin-top-right rounded-[1.25rem] bg-surface-1 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-border-strong/40 focus:outline-none z-50 overflow-hidden transition-all duration-200 ease-out",
          isOpen
            ? "opacity-100 scale-100 translate-y-0 visible pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none"
        )}
      >
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4F46E5] text-white font-bold text-[14px] shadow-sm">
              {userInitials}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[14px] font-bold text-text-primary truncate">
                {userName}
              </span>
              <span className="text-[12px] text-text-secondary truncate mt-0.5">
                {userEmail}
              </span>
            </div>
          </div>
        </div>
        
        <div className="h-px bg-border-subtle/60 w-[85%] mx-auto" />
        
        <div className="px-2 py-2">
          <Link
            href="/settings/security"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
          >
            <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Security Settings
          </Link>
          
          <Link
            href="/settings/preferences"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
          >
            <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Account Preferences
          </Link>
          
          <Link
            href="/vault"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
          >
            <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Documentation Vault
          </Link>
        </div>
        
        <div className="px-2 pb-2">
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#ef4444] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
