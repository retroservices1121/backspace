// Creator account — Stripe Express onboarding for community payouts.
// State machine has three branches: no account, onboarding-incomplete
// (with a time-limited link), and fully onboarded (Go To Dashboard).
// New design tokens; Stripe API wiring unchanged.

import { useEffect, useState } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import ReactLoading from 'react-loading';
import { toast } from 'react-toastify';
import settingsLayout from '@src/layouts/settingsLayout';
import Stripe from 'stripe';

import { createStripeAccount, getStripeCreator } from 'api/billing';
import { openInNewTab } from 'utils/common_utils';

const CreatorSettings: ReactLayoutComponentType = () => {
  const [stripeAccount, setStripeAccount] = useState<Stripe.Account | null>(null);
  const [link, setLink] = useState<Stripe.AccountLink | Stripe.LoginLink | null>(null);
  const [linkType, setLinkType] = useState<'onboarding' | 'dashboard' | null>(null);
  const [linkExpiration, setLinkExpiration] = useState<number | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  const refresh = async () => {
    setFetchLoading(true);
    const state = await getStripeCreator();
    setStripeAccount(state.account);
    setLink(state.link);
    setLinkType(state.linkType);
    setFetchLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  // Onboarding links from Stripe expire fast (a few minutes) — show
  // a countdown so the user knows when to re-request. Dashboard
  // login links don't carry an expires_at, so the countdown only
  // runs in the onboarding case.
  useEffect(() => {
    if (linkType !== 'onboarding' || !link || !('expires_at' in link)) {
      setLinkExpiration(null);
      return;
    }
    const expiresAt = link.expires_at;
    const tick = () => {
      const remaining = Math.round(expiresAt - Date.now() / 1000);
      setLinkExpiration(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [link, linkType]);

  const attemptCreateAccount = async () => {
    setCreateLoading(true);
    toast.info('Redirecting to payment partner. This will open a new tab.');
    const result = await createStripeAccount();
    if (result?.accountLink?.url) {
      openInNewTab(result.accountLink.url);
      await refresh();
    }
    setCreateLoading(false);
  };

  const requestNewLink = async () => {
    await refresh();
    if (link && 'url' in link) openInNewTab(link.url);
  };

  const renderBody = () => {
    if (!stripeAccount) {
      return (
        <Section
          title="Communities and Creators"
          sub="Creator accounts require more information than a user account. Only do this if you intend to collect money from community subscriptions."
        >
          <p className="mt-3 text-[12px] text-ink-3">
            Setup requires SSN, US address, and 5–20 minutes.
          </p>
          <PrimaryButton onClick={attemptCreateAccount}>
            Create creator account
          </PrimaryButton>
        </Section>
      );
    }

    const dueActions = stripeAccount.requirements?.currently_due ?? [];
    const onboarded = stripeAccount.charges_enabled
      && stripeAccount.payouts_enabled
      && dueActions.length === 0;

    if (onboarded) {
      return (
        <Section
          title="Your creator account"
          sub={stripeAccount.email ?? undefined}
        >
          <PrimaryButton onClick={requestNewLink}>Go to dashboard</PrimaryButton>
          <p className="mt-3 text-[12px] text-ink-3">
            Insights and analytics coming soon…
          </p>
        </Section>
      );
    }

    const linkValid = link && 'url' in link
      && (linkExpiration === null || linkExpiration > 0);
    return (
      <Section
        title="Finish setting up your creator account"
        sub={stripeAccount.email ?? undefined}
      >
        <p className="mt-3 text-[13px] text-ink-3">
          Your account has been created but is missing some requirements:
        </p>
        {dueActions.length > 0 && (
          <div className="mt-2 rounded-[10px] border border-line bg-canvas px-3 py-2">
            <code className="text-[12px] font-mono text-ink break-all">
              {dueActions.join(', ')}
            </code>
          </div>
        )}
        {linkValid ? (
          <>
            <PrimaryButton
              onClick={() => link && 'url' in link && openInNewTab(link.url)}
            >
              Continue to setup
            </PrimaryButton>
            {linkExpiration !== null && (
              <p className="mt-2 text-[11px] font-mono text-ink-3">
                Link expires in {Math.max(0, linkExpiration)} seconds
              </p>
            )}
          </>
        ) : (
          <PrimaryButton onClick={requestNewLink}>
            Request new setup link
          </PrimaryButton>
        )}
        <p className="mt-3 text-[12px] text-ink-3">
          You will be redirected to complete your account information in a secure portal.
        </p>
      </Section>
    );
  };

  return (
    <div className="font-display text-ink flex flex-col gap-5">
      {createLoading || fetchLoading ? (
        <div className="flex justify-center py-10">
          <ReactLoading type="bubbles" color="#7B4CFF" height={32} width={32} />
        </div>
      ) : renderBody()}
      <p className="text-center text-[11px] font-mono text-ink-3 px-4">
        Actions on this page open new tabs in your browser. If you click a button and nothing happens, check your pop-up blocker.
      </p>
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

function PrimaryButton({
  children, onClick, disabled,
}: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="
        self-start mt-3 rounded-full bg-brand hover:bg-brand-2
        text-ink text-[14px] font-semibold h-10 px-5
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-150
        shadow-[0_8px_22px_-6px_rgba(88,34,251,0.55)]
      "
    >
      {children}
    </button>
  );
}

CreatorSettings.Layout = settingsLayout;

export default CreatorSettings;
