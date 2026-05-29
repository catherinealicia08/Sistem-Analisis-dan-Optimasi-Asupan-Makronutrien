import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { List, Sparkle, X } from "@phosphor-icons/react";

const LINKS: { label: string; href: string; external?: boolean }[] = [
  { label: "Features",          href: "#features" },
  { label: "How It Works",      href: "#how-it-works" },
  { label: "Scientific Basis",  href: "/science",        external: true },
  { label: "Documentation",     href: "/docs",           external: true },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled
          ? "border-b border-ink-200 bg-surface/80 backdrop-blur-md"
          : "border-b border-transparent bg-surface"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Sparkle size={18} weight="fill" />
          </div>
          <span className="text-lg font-bold tracking-tight text-ink-900">MacroPlus</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) =>
            l.external ? (
              <Link
                key={l.href}
                to={l.href}
                className="text-sm font-medium text-ink-700 transition-colors hover:text-ink-900"
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-ink-700 transition-colors hover:text-ink-900"
              >
                {l.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="text-sm font-semibold text-ink-700 hover:text-ink-900">
            Log in
          </Link>
          <Link to="/register" className="btn-primary">
            Get Started
          </Link>
        </div>

        <button
          aria-label="Menu"
          className="rounded-md p-2 text-ink-700 hover:bg-ink-100 md:hidden"
          onClick={() => setOpen((s) => !s)}
        >
          {open ? <X size={20} /> : <List size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-200 bg-surface md:hidden">
          <div className="space-y-2 px-4 py-4">
            {LINKS.map((l) =>
              l.external ? (
                <Link
                  key={l.href}
                  to={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100"
                >
                  {l.label}
                </a>
              ),
            )}
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="btn-ghost flex-1">Log in</Link>
              <Link to="/register" className="btn-primary flex-1">Get Started</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
