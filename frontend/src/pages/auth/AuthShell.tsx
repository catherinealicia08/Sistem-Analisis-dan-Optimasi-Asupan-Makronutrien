import { Link } from "react-router-dom";
import { Sparkle } from "@phosphor-icons/react";
import type { ReactNode } from "react";

interface Props {
  topRight: ReactNode;
  hero: ReactNode;        // left side visual
  children: ReactNode;    // right side form
  reverse?: boolean;      // swap hero side (register vs login mirror)
}

export function AuthShell({ topRight, hero, children, reverse }: Props) {
  return (
    <div className="min-h-[100dvh] bg-canvas">
      <header className="mx-auto flex max-w-[1320px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Sparkle size={18} weight="fill" />
          </div>
          <span className="text-lg font-bold tracking-tight text-ink-900">MacroPlus</span>
        </Link>
        <div className="text-sm text-ink-500">{topRight}</div>
      </header>

      <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
        <div className={reverse ? "order-1 lg:order-1" : "order-2 lg:order-1"}>
          {hero}
        </div>
        <div className={reverse ? "order-2 lg:order-2" : "order-1 lg:order-2"}>
          <div className="mx-auto w-full max-w-md rounded-2xl border border-ink-200 bg-surface p-6 shadow-card sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Apple logo (monochrome, inline SVG — no extra dep). */
export function AppleGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.46 2.23-1.21 3.03-.81.88-2.07 1.55-3.31 1.45-.13-1.1.43-2.27 1.18-3.04.84-.86 2.23-1.49 3.34-1.44ZM20.5 17.41c-.6 1.38-.88 1.99-1.65 3.21-1.07 1.7-2.58 3.82-4.45 3.84-1.66.02-2.09-1.08-4.34-1.07-2.25.01-2.72 1.09-4.39 1.07-1.87-.02-3.3-1.94-4.37-3.64C-1.6 16.38-1.93 9.99 1.48 6.61 2.7 5.4 4.36 4.66 6.04 4.66c1.69 0 2.75 1.07 4.16 1.07 1.36 0 2.19-1.07 4.14-1.07 1.49 0 3.07.81 4.2 2.2-3.69 2.02-3.09 7.3 1.96 7.55Z"/>
    </svg>
  );
}

/** Google "G" mark, inline SVG. */
export function GoogleGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.2-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.3-.1-2.3-.4-3.5Z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5 16.3 4.5 9.6 8.6 6.3 14.7Z"/>
      <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13-5l-6-5.1c-1.9 1.4-4.3 2.2-7 2.2-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.4 39.4 16.2 43.5 24 43.5Z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.4-2.4 4.4-4.3 5.9l6 5.1c-.4.3 6.5-4.7 6.5-15 0-1.3-.1-2.3-.4-3.5Z"/>
    </svg>
  );
}
