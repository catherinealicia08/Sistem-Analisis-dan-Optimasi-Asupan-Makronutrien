import type { ReactNode } from "react";
import { Sparkle } from "@phosphor-icons/react";

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export function PlaceholderPage({ title, subtitle, icon }: Props) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="card max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          {icon ?? <Sparkle size={24} weight="fill" />}
        </div>
        <h2 className="mt-5 text-xl font-bold text-ink-900">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-ink-500">{subtitle}</p>}
        <span className="pill-brand mt-5 inline-flex">Coming Soon</span>
      </div>
    </div>
  );
}
