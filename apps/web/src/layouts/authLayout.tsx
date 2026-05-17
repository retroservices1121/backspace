// Shared shell for /auth/register, /forgot, /logout, /onboarding.
// /auth/login owns its full split-screen layout and bypasses this
// shell with a bare passthrough.
//
// Wraps page content in a centered surface card on a canvas-tinted
// full-bleed background — matches the login page's right panel so
// the whole auth surface reads as one design. Pages render their
// own headline + body inside the card; this layout owns the
// background wash + brand mark + card chrome only.

import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        relative min-h-screen w-full
        font-display text-ink
        flex items-center justify-center px-5 py-10
      "
      style={{
        background:
          'linear-gradient(180deg, #0c0a16 0%, #08070d 100%)',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(circle at 15% 20%, rgba(88,34,251,0.30), transparent 50%)',
            'radial-gradient(circle at 85% 80%, rgba(255,136,0,0.18), transparent 55%)',
          ].join(','),
        }}
      />

      <div className="relative w-full max-w-[440px]">
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/webui/backspace-icon.png"
            alt=""
            className="w-9 h-9 rounded-lg shadow-[0_20px_40px_-10px_rgba(88,34,251,0.45)]"
          />
        </div>

        <div className="rounded-[16px] border border-line bg-surface/80 backdrop-blur-md p-6 sm:p-7 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)]">
          {children}
        </div>
      </div>
    </div>
  );
}
