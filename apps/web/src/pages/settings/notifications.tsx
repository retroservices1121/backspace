// Notifications — placeholder until the granular toggle list ships.
// Real notification preferences (post replies, follows, market
// resolutions, community channel pings) will land per-category
// alongside the email/push delivery worker.
import React from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import settingsLayout from '@src/layouts/settingsLayout';

const Notifications: ReactLayoutComponentType = () => (
  <div className="font-display text-ink">
    <section className="rounded-[14px] border border-line bg-surface p-5">
      <h2 className="m-0 text-[18px] font-semibold tracking-[-0.01em] text-ink">
        Notifications
      </h2>
      <p className="mt-1.5 text-[13px] text-ink-3 leading-snug">
        Per-category notification preferences are coming soon. Email + push
        delivery currently runs at default frequency.
      </p>
    </section>
  </div>
);

Notifications.Layout = settingsLayout;

export default Notifications;
