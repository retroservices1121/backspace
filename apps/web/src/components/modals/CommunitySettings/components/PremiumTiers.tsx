// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

import {
  createTier as apiCreateTier,
  deleteTier as apiDeleteTier,
  TierPayload,
  updateTier as apiUpdateTier,
} from 'api/billing';
import { useCommunityBilling } from '@src/hooks/useCommunityBilling';
import useCommunity from 'hooks/entities/useCommunities';
import { APP } from 'pages';
import { Button, ButtonLarge, LargeTextButton } from 'styles/Buttons';
import { OldCol, OldRow } from 'styles/Flex';
import { Space } from 'styles/layout';

import { Layout } from '../components';
import { CommunitySettingsTabs } from '../components';

const PremiumTiers: React.FC<any> = () => {
  const { current: { community } } = useCommunity();
  const router = useRouter();
  const billing = useCommunityBilling(community?.id);
  const [busy, setBusy] = useState(false);

  // Owner-only feature. Until creator-side onboarding is finished
  // (ownerAccountId !== null) the create button is disabled — Stripe
  // will reject the price create otherwise.
  const ownerAccountId = billing.data?.ownerAccountId ?? null;
  const tiers = billing.data?.tiers ?? [];

  const onCreate = async () => {
    setBusy(true);
    const created = await apiCreateTier(community.id.toString(), {
      title: 'New Tier',
      description: '',
      perks: [],
      priceUsd: 4.99,
    });
    if (created) {
      toast.success('Tier created');
      billing.refresh();
    }
    setBusy(false);
  };

  const onEdit = async (tier: TierPayload) => {
    const nextTitle = window.prompt('Tier name', tier.title);
    if (nextTitle === null) return;
    const nextPriceStr = window.prompt('Monthly price (USD)', String(tier.price));
    if (nextPriceStr === null) return;
    const nextPrice = Number(nextPriceStr);
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      toast.error('Price must be a positive number');
      return;
    }
    setBusy(true);
    const updated = await apiUpdateTier(community.id.toString(), tier.id, {
      title: nextTitle,
      priceUsd: nextPrice,
    });
    if (updated) {
      toast.success('Tier updated');
      billing.refresh();
    }
    setBusy(false);
  };

  const onDelete = async (tier: TierPayload) => {
    if (!window.confirm(`Delete "${tier.title}"? Existing subscribers will keep paying until they cancel.`)) {
      return;
    }
    setBusy(true);
    const ok = await apiDeleteTier(community.id.toString(), tier.id);
    if (ok) {
      toast.info('Tier deleted');
      billing.refresh();
    }
    setBusy(false);
  };

  return (
    <Layout title={CommunitySettingsTabs.PremiumTier}>
      {billing.loading && <p>Loading…</p>}

      {!billing.loading && !ownerAccountId && (
        <OldCol>
          <p>You need a creator account before publishing premium tiers.</p>
          <Space direction="column" size="sm" />
          <LargeTextButton onClick={() => router.push(APP.SETTINGS.CREATOR ?? '/settings/creator')}>
            Set up creator account
          </LargeTextButton>
        </OldCol>
      )}

      {!billing.loading && ownerAccountId && tiers.length === 0 && (
        <p>No tiers yet — create your first one below.</p>
      )}

      {tiers.map((tier) => (
        <OldRow
          key={tier.uuid}
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <OldCol>
            <h3>{tier.title}</h3>
            <p>${tier.price.toFixed(2)} / month</p>
            {tier.stripePriceId === null && (
              <p style={{ color: 'orange' }}>Stripe price missing — re-create to publish.</p>
            )}
          </OldCol>
          <OldRow>
            <Button color="none" onClick={() => onEdit(tier)} disabled={busy}>
              Edit
            </Button>
            <Space size="sm" />
            <Button color="error" onClick={() => onDelete(tier)} disabled={busy}>
              Delete
            </Button>
          </OldRow>
        </OldRow>
      ))}

      <Space direction="column" />

      {ownerAccountId && (
        <ButtonLarge color="primary" onClick={onCreate} disabled={busy}>
          {busy ? 'Working…' : 'Create New Tier'}
        </ButtonLarge>
      )}

      <Space direction="column" />
      <p style={{ fontSize: '0.85em', opacity: 0.7 }}>
        Platform fee is 10%. New prices apply to new subscribers only — existing subscribers keep their current price until they cancel.
      </p>
    </Layout>
  );
};

export default PremiumTiers;
