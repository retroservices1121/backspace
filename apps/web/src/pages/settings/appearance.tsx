// Appearance — theme switcher. Wrapped in a surface card so it
// matches the rest of the settings sweep; the inner theme toggle
// keeps the legacy AppearanceButton component until the design
// system commits to a single mode or a real theme picker ships.
import React from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import settingsLayout from 'layouts/settingsLayout';

import { AppearanceSettings } from 'components/Settings/AppearanceSettings';

const Appearance: ReactLayoutComponentType = () => {
  return (
    <div className="font-display text-ink">
      <section className="rounded-[14px] border border-line bg-surface p-5">
        <h2 className="m-0 text-[18px] font-semibold tracking-[-0.01em] text-ink">
          Appearance
        </h2>
        <p className="mt-1.5 text-[13px] text-ink-3 leading-snug">
          Backspace ships in dark mode by default. Light mode is preserved here
          as a legacy option — most surfaces are tuned for the dark palette.
        </p>
        <div className="mt-4">
          <AppearanceSettings />
        </div>
      </section>
    </div>
  );
};

Appearance.Layout = settingsLayout;

export default Appearance;
