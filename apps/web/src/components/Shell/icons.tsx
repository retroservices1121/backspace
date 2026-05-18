// Monoline icon set used by the new desktop shell + screens. Ported
// from /webui/app-shell.jsx so the visual stays identical to the
// design reference. All icons inherit currentColor — color/size with
// className on the parent (Tailwind: text-ink-2 w-5 h-5).
//
// Why a fresh icon set instead of reusing apps/web/src/icons: those
// are tied to styled-components ThemeProvider and are bigger /
// differently-styled. Keeping these isolated under Shell/ lets the
// new design language ship without crosstalk.

import React from 'react';

type IconProps = { className?: string };

const base = (className?: string) =>
  ({
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    className,
  });

export const ShellIcons = {
  home: (p: IconProps = {}) => (
    <svg {...base(p.className)}><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9z"/></svg>
  ),
  markets: (p: IconProps = {}) => (
    <svg {...base(p.className)}><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>
  ),
  comm: (p: IconProps = {}) => (
    <svg {...base(p.className)}><circle cx="9" cy="9" r="3"/><circle cx="17" cy="11" r="2.5"/><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5"/><path d="M14 18c0-2 2-3 3-3s3 1 3 3"/></svg>
  ),
  bell: (p: IconProps = {}) => (
    <svg {...base(p.className)}><path d="M6 8a6 6 0 0112 0c0 4 2 5 2 7H4c0-2 2-3 2-7z"/><path d="M10 21h4"/></svg>
  ),
  mail: (p: IconProps = {}) => (
    <svg {...base(p.className)}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
  ),
  bookmark: (p: IconProps = {}) => (
    <svg {...base(p.className)}><path d="M6 4h12v17l-6-4-6 4V4z"/></svg>
  ),
  user: (p: IconProps = {}) => (
    <svg {...base(p.className)}><circle cx="12" cy="9" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
  ),
  dots: (p: IconProps = {}) => (
    <svg {...base(p.className)}><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>
  ),
  search: (p: IconProps = {}) => (
    <svg {...base(p.className)}><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>
  ),
  plus: (p: IconProps = {}) => (
    <svg {...base(p.className)} strokeWidth={2.4}><path d="M12 5v14M5 12h14"/></svg>
  ),
  arrowR: (p: IconProps = {}) => (
    <svg {...base(p.className)} strokeWidth={2}><path d="M5 12h14M13 5l7 7-7 7"/></svg>
  ),
  bag: (p: IconProps = {}) => (
    <svg {...base(p.className)}><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>
  ),
  conv: (p: IconProps = {}) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={p.className}>
      <path d="M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6L4 9l5.5-1.5z"/>
    </svg>
  ),
  // Twitter-style verified badge: scalloped circle with a checkmark.
  // Solid fill so we can color the whole badge via currentColor.
  verified: (p: IconProps = {}) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={p.className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
    </svg>
  ),
};
