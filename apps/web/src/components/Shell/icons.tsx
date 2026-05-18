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
  // Verified badge for individuals — Twitter-style scalloped body in
  // currentColor (set brand-purple at the call site) + explicit white
  // check overlay. Two separate paths so the body fills solidly
  // instead of relying on evenodd holes.
  verified: (p: IconProps = {}) => (
    <svg viewBox="0 0 24 24" className={p.className}>
      <path fill="currentColor" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"/>
      <path fill="#fff" d="M10.54 16.2L6.8 12.46l1.41-1.42 2.26 2.26 4.85-5.23 1.46 1.36-6.24 6.77z"/>
    </svg>
  ),
  // Verified badge for organizations — hexagon silhouette + dark
  // check so it reads against the white body (set text-ink at the
  // call site for the white body).
  verifiedOrg: (p: IconProps = {}) => (
    <svg viewBox="0 0 24 24" className={p.className}>
      <path fill="currentColor" d="M20.5 12L16.25 19.4 7.75 19.4 3.5 12 7.75 4.6 16.25 4.6 20.5 12z"/>
      <path fill="#0c0a16" d="M10.54 16.2L6.8 12.46l1.41-1.42 2.26 2.26 4.85-5.23 1.46 1.36-6.24 6.77z"/>
    </svg>
  ),
};
