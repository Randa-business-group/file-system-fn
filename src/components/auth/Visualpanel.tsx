// components/login/VisualPanel.tsx

const FOLDER_TAGS = [
  { path: "/projects/q4-reports", delay: "0s", dur: "5.2s", nudge: -9 },
  { path: "/assets/brand", delay: "1.1s", dur: "6.0s", nudge: -6 },
  { path: "/docs/legal/2024", delay: "2.2s", dur: "4.8s", nudge: -11 },
  { path: "/shared/design-team", delay: "0.6s", dur: "5.6s", nudge: -8 },
];

export function VisualPanel() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 70% 20%, color-mix(in srgb, var(--color-primary-subtle) 72%, white) 0%, color-mix(in srgb, var(--color-primary-subtle) 38%, white) 35%, color-mix(in srgb, var(--color-primary-light) 28%, white) 65%, color-mix(in srgb, var(--color-primary) 34%, white) 100%)",
      }}
    >
      <style>{`
        @keyframes fv-floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes fv-floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes fv-floatC { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
        @keyframes fv-floatD { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>

      {/* Top-right ambient glow */}
      <div
        className="absolute -right-20 -top-24 h-[420px] w-[420px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      {/* Bottom-left ambient glow */}
      <div
        className="absolute -bottom-16 left-1/4 h-72 w-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(74,180,120,0.2) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* ── Forest SVG silhouette ───────────────────────────────────────── */}
      <svg
        viewBox="0 0 1000 380"
        preserveAspectRatio="xMidYMax slice"
        className="absolute bottom-0 left-0 right-0 w-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Far mountains */}
        <path
          d="M0 380 L0 230 L80 148 L155 212 L215 118 L300 202 L372 88 L448 178 L520 64 L600 162 L665 90 L745 168 L815 75 L895 148 L1000 108 L1000 380Z"
          fill="#9fc9b4"
          opacity="0.6"
        />
        {/* Mid treeline */}
        <path
          d="M0 380 L0 278 L38 238 L68 262 L92 222 L124 250 L150 208 L182 242 L208 210 L238 244 L268 200 L304 236 L340 207 L372 246 L406 214 L440 250 L475 220 L514 254 L558 212 L598 250 L638 210 L678 247 L720 216 L760 252 L804 220 L842 258 L884 226 L922 262 L962 230 L1000 258 L1000 380Z"
          fill="#78aa92"
          opacity="0.7"
        />
        {/* Front treeline */}
        <path
          d="M0 380 L0 318 L24 288 L42 304 L60 276 L84 296 L104 272 L130 292 L154 274 L178 296 L204 276 L232 300 L264 280 L298 304 L333 282 L368 308 L404 284 L440 310 L477 286 L514 314 L554 288 L594 316 L636 290 L676 318 L718 292 L758 320 L800 294 L842 322 L882 296 L924 324 L968 298 L1000 322 L1000 380Z"
          fill="#5a8e78"
          opacity="0.75"
        />
        {/* Ground / water strip */}
        <rect
          x="0"
          y="346"
          width="1000"
          height="34"
          fill="#4a7a64"
          opacity="0.5"
        />
        {/* Water shimmer */}
        <path
          d="M280 354 Q370 350 460 356 Q550 362 640 354"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M460 362 Q555 357 650 364 Q745 370 840 362"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
          fill="none"
        />
      </svg>

      {/* ── Floating folder path tags ───────────────────────────────────── */}
      <div className="absolute right-[8%] top-[12%] hidden xl:flex flex-col gap-2.5">
        {FOLDER_TAGS.map(({ path, delay, dur }, i) => (
          <div
            key={path}
            className="flex items-center gap-2 rounded-xl border border-white/50 bg-white/60 px-3 py-2 backdrop-blur-sm"
            style={{
              animation: `fv-float${["A", "B", "C", "D"][i % 4]} ${dur} ease-in-out ${delay} infinite`,
              minWidth: "160px",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M1 2.8A1 1 0 0 1 2 1.8h2.25a1 1 0 0 1 .7.3l.4.4a1 1 0 0 0 .7.3H10a1 1 0 0 1 1 1V9.2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2.8Z"
                stroke="var(--color-primary)"
                strokeWidth="1"
              />
            </svg>
            <span className="font-mono text-[10px] text-[color:var(--color-primary)] opacity-80">
              {path}
            </span>
          </div>
        ))}
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className="absolute bottom-28 right-[6%] hidden lg:flex flex-col gap-2">
        {[
          { val: "2.4M+", lbl: "Files managed" },
          { val: "18 TB", lbl: "Total storage" },
          { val: "3.2K", lbl: "Active users" },
        ].map(({ val, lbl }) => (
          <div
            key={lbl}
            className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/55 px-4 py-2 backdrop-blur-sm"
          >
            <span className="text-base font-bold text-[color:var(--color-primary)]">{val}</span>
            <span className="text-[11px] text-[color:var(--color-text-secondary)]">{lbl}</span>
          </div>
        ))}
      </div>

      {/* ── Brand watermark ─────────────────────────────────────────────── */}
      <div className="absolute bottom-5 right-6 flex items-center gap-2 opacity-40">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 5A2 2 0 0 1 5 3h3.6a2 2 0 0 1 1.4.6l.6.6A2 2 0 0 0 12 5h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z"
            stroke="var(--color-primary)"
            strokeWidth="1.2"
          />
        </svg>
        <div className="leading-tight">
          <p className="text-[10px] font-bold tracking-[0.14em] text-[color:var(--color-primary)]">
            BIKA-FILE
          </p>
          <p className="text-[8px] tracking-[0.08em] text-[color:var(--color-text-secondary)]">
            SECURE FILE SYSTEM
          </p>
        </div>
      </div>
    </div>
  );
}
