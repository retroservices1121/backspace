// 3-column desktop chrome from /webui: LeftNav (280) | Center | RightRail (360).
// Drops in as the desktop branch of the top-level Navigation. Mobile
// still routes through MobileNavigation + AccountDrawer (unchanged).
//
// Center column scrolls independently; left and right rails are
// sticky via `position: sticky` + `h-screen` inside their own
// components. The overall layout is page-wide (no max-width)
// because the rails handle the edges; the design specifies 1440px
// reference but the proportions hold at larger widths too.

import React from 'react';

import LeftNav from './LeftNav';
import RightRail from './RightRail';

const DesktopShell: React.FC = ({ children }) => {
  return (
    <div
      className="
        relative isolate
        grid grid-cols-[280px_minmax(0,1fr)_360px]
        min-h-screen
        bg-canvas text-ink
        font-display
      "
    >
      {/* Subtle radial brand wash behind the center column (matches
          .screen::before from the prototype). Pointer-events none so
          it doesn't intercept clicks. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-[15%] -translate-x-1/2 -z-10 w-[900px] h-[600px]"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(88,34,251,0.18) 0%, transparent 65%)',
        }}
      />
      <LeftNav />
      <main className="min-w-0">{children}</main>
      <RightRail />
    </div>
  );
};

export default DesktopShell;
