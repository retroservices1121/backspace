// Billing — Stripe payment methods + active subscriptions. New
// design tokens; all Stripe wiring through useBilling unchanged.
// Adds-card flow still opens in ModalV2 (now surface/line); the
// Stripe CardElement theme is re-mapped to the new tokens so the
// embedded iframe doesn't look like a leftover from the old theme.

import React, { useEffect, useState } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import Loading from 'react-loading';
import { useSelector } from 'react-redux';
import { toast, UpdateOptions } from 'react-toastify';
import useBilling from '@src/hooks/useBilling';
import settingsLayout from '@src/layouts/settingsLayout';
import { SubscriptionWithCommunity } from '@src/types/billing';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import Stripe from 'stripe';
import { XIcon } from '@heroicons/react/outline';

import { addSourceToCustomer } from 'api/billing';
import Modal from 'components/ModalV2';
import PaymentMethodCard from 'components/Settings/PaymentMethod';
import { RootState } from 'store/store';

// NEXT_PUBLIC_ prefix is required for Next.js to expose env vars
// to the browser. The legacy REACT_APP_ name silently resolved
// to undefined here.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
);

type StripeFormProps = {
  onSubmit: () => void;
  onSuccess: () => void;
};

const StripeForm: React.FC<StripeFormProps> = ({ onSubmit, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();

  // Re-style the Stripe CardElement iframe to read on the new
  // design tokens. Has to run via element.update() because Stripe
  // controls the inner iframe — we can't reach it with CSS.
  useEffect(() => {
    const customCard = elements?.getElement('card');
    customCard?.update({
      style: {
        base: {
          fontSize: '15px',
          fontFamily: 'Poppins, sans-serif',
          color: '#ffffff',
          backgroundColor: 'transparent',
          lineHeight: '24px',
          '::placeholder': { color: 'rgba(255,255,255,0.5)' },
        },
        invalid: { color: '#ff8a9b' },
      },
    });
  }, [elements]);

  const addCard = async () => {
    const cardElement = elements?.getElement('card');
    if (!cardElement) {
      toast.error('Missing Card information, please try again.');
      return;
    }
    const result = await stripe?.createSource(cardElement, { type: 'card' });
    onSubmit();
    const toastId = toast.loading('Attempting to add card');

    if (!result?.source?.id) {
      const update: UpdateOptions = {
        render: 'Missing Card information, please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      };
      toast.update(toastId, update);
      return;
    }

    addSourceToCustomer(result.source.id)
      .then((response) => {
        const update: UpdateOptions = {
          render: 'Success!',
          type: 'success',
          isLoading: false,
          autoClose: 5000,
        };
        toast.update(toastId, update);
        onSuccess();
        return response;
      })
      .catch(() => {
        const update: UpdateOptions = {
          render: 'Failed to add payment!',
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        };
        toast.update(toastId, update);
      });
  };

  return (
    <div className="font-display text-ink w-[360px]">
      <h3 className="m-0 text-[16px] font-semibold text-ink">Add new card</h3>
      <p className="mt-1 text-[12px] text-ink-3">
        Enter your payment details. Only US cards are accepted.
      </p>
      <div className="mt-4 rounded-[10px] border border-line bg-canvas px-3 py-3">
        <CardElement />
      </div>
      <div className="mt-5 flex items-center justify-end gap-2">
        <SecondaryButton onClick={onSubmit}>Cancel</SecondaryButton>
        <PrimaryButton onClick={addCard}>Add card</PrimaryButton>
      </div>
    </div>
  );
};

const Billing: ReactLayoutComponentType = () => {
  const uid = useSelector((state: RootState) => state.user.id);
  const myBilling = useBilling();

  const [addPaymentModel, setAddPaymentModal] = useState(false);
  const options: StripeElementsOptions = {};

  const handleCancelSubscription = async (sub: SubscriptionWithCommunity) => {
    if (sub) {
      await myBilling.cancelSubscription(sub.stripeId);
      toast.info(`Cancelled subscription for ${sub.community.name}`);
    } else {
      toast.error('An error has occurred, contact support.');
    }
  };

  return (
    <div className="font-display text-ink">
      <Modal
        open={addPaymentModel}
        handleClose={() => setAddPaymentModal(false)}
        shouldCloseOnOverlayClick
      >
        <div className="p-6">
          <Elements stripe={stripePromise} options={options}>
            <StripeForm
              onSubmit={() => setAddPaymentModal(false)}
              onSuccess={() => { if (uid) myBilling.fetchAllBillingInfo(); }}
            />
          </Elements>
        </div>
      </Modal>

      {myBilling.isCustomer === undefined ? (
        <div className="flex justify-center py-10">
          <Loading type="bubbles" color="#7B4CFF" height={32} width={32} />
        </div>
      ) : myBilling.isCustomer ? (
        <div className="flex flex-col gap-5">
          <Section
            title="Billing"
            sub="This is the billing information for standard user accounts. If you want to view your creator account, go to the next tab (Creator)."
          />

          <Section
            title="Payment methods"
            sub="This is your current payment method. Adding a new one removes the previous and switches to the new card."
          >
            <div className="mt-4 flex flex-wrap gap-3">
              {myBilling.methods?.map((method, i) => {
                if (!method.card) return null;
                const card = (method.card as unknown) as Stripe.Card;
                return (
                  <PaymentMethodCard
                    key={i}
                    card={card}
                    id={method.id}
                    isDefault={method.id === myBilling.customer?.defaultSource}
                  />
                );
              })}
              <AddCardTile onClick={() => setAddPaymentModal(true)} />
            </div>
          </Section>

          <Section
            title="Subscriptions"
            sub="Your active and past community subscriptions."
            action={
              <button
                type="button"
                onClick={() => myBilling.fetchSubscriptions()}
                className="
                  text-[11px] font-mono uppercase tracking-[0.06em]
                  text-brand-2 hover:text-ink-2 transition-colors
                "
              >
                Refresh
              </button>
            }
          >
            {(!myBilling.subscriptions || myBilling.subscriptions.length === 0) ? (
              <p className="mt-3 text-[13px] text-ink-3">No subscriptions yet.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-1.5">
                {myBilling.subscriptions.map((sub) => (
                  <SubscriptionRow
                    key={sub.stripeId}
                    sub={sub}
                    onCancel={() => handleCancelSubscription(sub)}
                  />
                ))}
              </div>
            )}
          </Section>
        </div>
      ) : (
        <Section
          title="Billing Account is required"
          sub="This is a standard user account, and will take approximately 2 minutes to set up."
        >
          <PrimaryButton onClick={() => myBilling.createCustomer()}>
            Create billing account
          </PrimaryButton>
        </Section>
      )}
    </div>
  );
};

function SubscriptionRow({
  sub,
  onCancel,
}: {
  sub: SubscriptionWithCommunity;
  onCancel: () => void;
}) {
  let stripeValue: Stripe.Subscription | undefined;
  try {
    stripeValue = JSON.parse(sub.stripeValue);
  } catch { /* tolerated */ }
  const communityName = sub.community.name || 'Community';
  const status = stripeValue?.status ?? 'unknown';
  const dateLabel = stripeValue?.canceled_at
    ? `Cancelled ${new Date(stripeValue.canceled_at * 1000).toLocaleDateString()}`
    : stripeValue?.start_date
      ? `Started ${new Date(stripeValue.start_date * 1000).toLocaleDateString()}`
      : '—';
  const amount = (stripeValue as any)?.plan?.amount;

  return (
    <div className="
      flex items-center gap-3 px-4 py-3 rounded-[10px]
      border border-line bg-canvas
    ">
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-ink truncate">{communityName}</div>
        <div className="text-[11px] font-mono text-ink-3 mt-0.5 truncate">
          {dateLabel}
        </div>
      </div>
      <div className="text-right flex-none">
        <div
          className={[
            'text-[11px] font-mono uppercase tracking-[0.06em]',
            status === 'active' ? 'text-green-2' : 'text-ink-3',
          ].join(' ')}
        >
          {status}
        </div>
        {amount && (
          <div className="text-[13px] font-mono font-semibold text-ink mt-0.5">
            ${(amount / 100).toFixed(2)}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="
          flex-none w-9 h-9 rounded-full
          flex items-center justify-center
          text-ink-3 hover:bg-pink-vivid/10 hover:text-pink-2
          transition-colors
        "
        aria-label="Cancel subscription"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

function AddCardTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-[180px] h-[110px] rounded-[12px]
        border border-dashed border-line-2
        flex items-center justify-center gap-2
        text-[13px] font-medium text-ink-2
        hover:bg-hover hover:text-ink hover:border-brand-2
        transition-colors
      "
    >
      + Add card
    </button>
  );
}

function Section({
  title, sub, action, children,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-[14px] border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h2 className="m-0 text-[18px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
          {sub && <p className="mt-1.5 text-[13px] text-ink-3 leading-snug">{sub}</p>}
        </div>
        {action}
      </div>
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

function SecondaryButton({
  children, onClick,
}: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        rounded-full border border-line-2 text-ink text-[14px] font-semibold
        h-10 px-5 hover:bg-hover transition-colors
      "
    >
      {children}
    </button>
  );
}

Billing.Layout = settingsLayout;
export default Billing;
