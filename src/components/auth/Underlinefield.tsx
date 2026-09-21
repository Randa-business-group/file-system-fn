"use client";

import { useState } from "react";

interface UnderlineFieldProps {
  id: string;
  label: string;
  type: "text" | "email" | "password" | "tel";
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
  disabled?: boolean;
}

function EyeOpen() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-6.4 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.4 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function UnderlineField({
  id,
  label,
  type,
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  placeholder,
  disabled = false,
}: UnderlineFieldProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const lifted = focused || value.length > 0;
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="relative pt-5 pb-1">
      {/* Floating label */}
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 font-medium transition-all duration-200"
        style={{
          top: lifted ? "0px" : "22px",
          fontSize: lifted ? "10px" : "13px",
          letterSpacing: lifted ? "0.08em" : "0.02em",
          textTransform: lifted ? "uppercase" : "none",
          color: error
            ? "var(--color-error, #ef4444)"
            : focused
            ? "var(--color-primary)"
            : "var(--color-text-muted, #9ca3af)",
        }}
      >
        {label}
      </label>

      <div className="relative flex items-center">
        <input
          id={id}
          type={inputType}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[
            "w-full bg-transparent py-1.5 pb-2 text-sm text-foreground outline-none",
            "transition-all duration-200 placeholder-transparent",
            isPassword ? "pr-8" : "",
          ].join(" ")}
          style={{
            borderBottom: `1.5px solid ${
              error
                ? "var(--color-error, #ef4444)"
                : focused
                ? "var(--color-primary)"
                : "var(--color-border, #d1d5db)"
            }`,
            caretColor: "var(--color-primary)",
          }}
        />

        {/* Show / hide toggle */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()} // prevent blur on click
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-0 bottom-2 flex items-center justify-center transition-opacity duration-150 hover:opacity-100"
            style={{ color: "var(--color-text-muted, #9ca3af)", opacity: 0.6 }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff /> : <EyeOpen />}
          </button>
        )}
      </div>

      {error && (
        <p
          id={`${id}-error`}
          className="mt-1 text-[10px] tracking-wide animate-[fadeUp_0.15s_ease_both]"
          style={{ color: "var(--color-error, #ef4444)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
