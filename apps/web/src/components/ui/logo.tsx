'use client';

import React from 'react';

interface LogoProps {
  variant?: 'dark' | 'light' | 'full-dark' | 'full-light';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function GaselaLogo({
  variant = 'full-dark',
  size = 'md',
  className = '',
  showText = true,
}: LogoProps) {
  const iconSizes = {
    sm: 'size-7',
    md: 'size-9',
    lg: 'size-12',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  const subtextSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  };

  const isLight = variant === 'light' || variant === 'full-light';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Icon Emblem */}
      <div
        className={`relative flex ${iconSizes[size]} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-2 shadow-lg ring-1 ring-white/10`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-full"
        >
          {/* Outer Stylized 'G' Ring */}
          <path
            d="M26 12C23.5 9.5 19.5 9 15.5 10.5C11.5 12 9 16 9 20.5C9 25 11.5 29 15.5 30.5C19.5 32 24 31 27 28C29 26 30 23.5 30 21H20"
            stroke="url(#g_gradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner Dynamic Pulse Peak */}
          <path
            d="M10 20H15L18 14L22 26L25 20H30"
            stroke="#10B981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
          <defs>
            <linearGradient
              id="g_gradient"
              x1="9"
              y1="9"
              x2="30"
              y2="31"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FFFFFF" />
              <stop offset="0.5" stopColor="#E4E4E7" />
              <stop offset="1" stopColor="#71717A" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-black tracking-tight ${textSizes[size]} ${isLight ? 'text-white' : 'text-zinc-950'}`}>
            Gasela<span className="text-emerald-500 font-bold">Pulse</span>
          </div>
          <div className={`mt-0.5 font-medium tracking-widest uppercase ${subtextSizes[size]} ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
            GASELA MOTOR · HRIS
          </div>
        </div>
      )}
    </div>
  );
}
