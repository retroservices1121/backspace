// Account credentials (email, password, linked wallets, MFA) are managed
// in the Privy account UI — this settings page only exposes the account-
// removal contact path now.
import React from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { useSelector } from 'react-redux';
import settingsLayout from '@src/layouts/settingsLayout';

import { RootState } from 'store/store';
import { EMAIL_DOMAIN, SUPPORT_EMAIL } from 'utils/constants';

const Security: ReactLayoutComponentType = () => {
  const uid = useSelector((state: RootState) => state.user.id);

  return (
    <div className="font-display text-ink flex flex-col gap-5">
      <Section
        title="Sign-in & credentials"
        sub="Email, password, linked wallets, and multi-factor settings are managed in your Privy account. Open the account menu in the top-right of the app to make changes."
      />

      <Section
        title="Account removal"
        sub="Disabling or deleting your account is handled by support."
      >
        <div className="mt-4 rounded-[10px] border border-line bg-canvas px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-ink-3 font-mono">
            Contact
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}@${EMAIL_DOMAIN}?subject=Account%20removal&body=Account%20id:%20${uid ?? ''}`}
            className="mt-1 block text-[14px] font-mono text-brand-2 hover:underline break-all"
          >
            {SUPPORT_EMAIL}@{EMAIL_DOMAIN}
          </a>
        </div>
        {uid != null && (
          <div className="mt-3 rounded-[10px] border border-line bg-canvas px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.08em] text-ink-3 font-mono">
              Account id (paste into the email)
            </div>
            <code className="mt-1 block text-[12px] font-mono text-ink break-all">
              {uid}
            </code>
          </div>
        )}
      </Section>
    </div>
  );
};

function Section({
  title, sub, children,
}: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border border-line bg-surface p-5">
      <h2 className="m-0 text-[18px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      {sub && <p className="mt-1.5 text-[13px] text-ink-3 leading-snug">{sub}</p>}
      {children}
    </section>
  );
}

Security.Layout = settingsLayout;

export default Security;
