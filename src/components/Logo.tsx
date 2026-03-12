import React from 'react';

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-baseline font-['Ubuntu'] font-bold tracking-tight ${className}`}>
      <span>Vist</span>
      <span className="flex items-center">
        <svg width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block relative top-[0.1em]">
          {/* The 'o' / Eye */}
          <circle cx="12" cy="14" r="6" />
          {/* The pupil */}
          <circle cx="12" cy="14" r="2" fill="currentColor" />
          {/* Eyelashes */}
          <path d="M12 6v-3M6.5 8L4 5M17.5 8l2.5-3" />
        </svg>
        <svg width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block relative top-[0.1em] -ml-[0.05em]">
          <circle cx="12" cy="14" r="6" />
          <circle cx="12" cy="14" r="2" fill="currentColor" />
          <path d="M12 6v-3M6.5 8L4 5M17.5 8l2.5-3" />
        </svg>
      </span>
      <span className="text-blue-600">.</span>
    </div>
  );
}
