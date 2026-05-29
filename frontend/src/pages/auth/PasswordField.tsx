import { useState, forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, Props>(function PasswordField(
  { error, className = "", ...rest },
  ref,
) {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <div className="relative">
        <input
          ref={ref}
          {...rest}
          type={shown ? "text" : "password"}
          className={`input pr-10 ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500/15" : ""} ${className}`}
        />
        <button
          type="button"
          aria-label={shown ? "Hide password" : "Show password"}
          onClick={() => setShown((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
        >
          {shown ? <EyeSlash size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
});
