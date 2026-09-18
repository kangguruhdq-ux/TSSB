import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
  showText?: boolean;
}

export function TssbLogo({
  className,
  size = "md",
  href = "/dashboard",
  showText = true,
}: LogoProps) {
  const iconSize =
    size === "sm" ? "w-6 h-6" : size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const textSize =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";

  const content = (
    <div className={cn("flex items-center gap-2.5 select-none group", className)}>
      <div className={cn("relative flex items-center justify-center", iconSize)}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-lg group-hover:bg-cyan-500/40 transition-all duration-300" />
        
        {/* Geometric Tech Glyph for TSSB */}
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
        >
          {/* Top crossbar of stylized T */}
          <path
            d="M4 8C4 6.89543 4.89543 6 6 6H30C31.1046 6 32 6.89543 32 8V11C32 11.5523 31.5523 12 31 12H21.5C20.9477 12 20.5 12.4477 20.5 13V29C20.5 30.1046 19.6046 31 18.5 31H17.5C16.3954 31 15.5 30.1046 15.5 29V13C15.5 12.4477 15.0523 12 14.5 12H5C4.44772 12 4 11.5523 4 11V8Z"
            fill="url(#tssb_grad_1)"
          />
          {/* Cyan electric accent wings */}
          <path
            d="M6 14L10 18L6 22"
            stroke="#22D3EE"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-75 group-hover:opacity-100 transition-opacity"
          />
          <path
            d="M30 14L26 18L30 22"
            stroke="#06B6D4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-75 group-hover:opacity-100 transition-opacity"
          />
          <defs>
            <linearGradient
              id="tssb_grad_1"
              x1="4"
              y1="6"
              x2="32"
              y2="31"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#38BDF8" />
              <stop offset="0.5" stopColor="#06B6D4" />
              <stop offset="1" stopColor="#0284C7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-bold tracking-wider text-slate-900 dark:text-white group-hover:text-cyan-400 transition-colors",
              textSize
            )}
          >
            TSSB
          </span>
          <span className="text-[9px] tracking-widest uppercase font-mono text-cyan-500/80 -mt-1 hidden sm:block">
            INFRA OPS
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
