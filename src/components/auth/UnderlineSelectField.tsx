"use client";

import type { OrganizationType } from "@/types/enum";
import { OrganizationType as OrgType } from "@/types/enum";

interface UnderlineSelectFieldProps {
  id: string;
  label: string;
  value: OrganizationType;
  onChange: (value: OrganizationType) => void;
  onBlur?: () => void;
  error?: string;
}

export function UnderlineSelectField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
}: UnderlineSelectFieldProps) {
  return (
    <div className="relative pt-5 pb-1">
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 text-[10px] font-medium uppercase tracking-[0.08em]"
        style={{
          top: "0px",
          color: error
            ? "var(--color-error, #ef4444)"
            : "var(--color-text-muted, #9ca3af)",
        }}
      >
        {label}
      </label>

      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value as OrganizationType)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full appearance-none bg-transparent py-1.5 pb-2 pr-7 text-sm text-foreground outline-none transition-all duration-200"
          style={{
            borderBottom: `1.5px solid ${
              error
                ? "var(--color-error, #ef4444)"
                : "var(--color-border, #d1d5db)"
            }`,
          }}
        >
          <option value={OrgType.COMPANY}>Company</option>
          <option value={OrgType.INDIVIDUAL}>Individual</option>
        </select>

        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1 text-[10px] tracking-wide animate-[fadeUp_0.15s_ease_both]"
          style={{ color: "var(--color-error, #ef4444)" }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
