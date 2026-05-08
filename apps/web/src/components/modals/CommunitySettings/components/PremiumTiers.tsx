// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useState } from 'react';
import { toast } from 'react-toastify';
import { Field, Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import * as Yup from 'yup';

import {
  createTier as apiCreateTier,
  deleteTier as apiDeleteTier,
  TierPayload,
  updateTier as apiUpdateTier,
} from 'api/billing';
import FormInput, { FormTextarea } from 'components/FormInput';
import { useCommunityBilling } from '@src/hooks/useCommunityBilling';
import useCommunity from 'hooks/entities/useCommunities';
import { APP } from 'pages';
import { Button, ButtonLarge, LargeTextButton } from 'styles/Buttons';
import { OldCol, OldRow } from 'styles/Flex';
import { FieldError } from 'styles/form';
import { Space } from 'styles/layout';

import { Layout } from '../components';
import { CommunitySettingsTabs } from '../components';

type TierFormValues = {
  title: string;
  description: string;
  perks: string;
  priceUsd: number;
};

const tierSchema = Yup.object().shape({
  title: Yup.string().min(1).max(60).required(),
  description: Yup.string().max(500),
  perks: Yup.string().max(500),
  priceUsd: Yup.number().min(1, 'Must be at least $1').max(999).required(),
});

function payloadToFormValues(t: TierPayload): TierFormValues {
  return {
    title: t.title,
    description: t.description ?? '',
    perks: (t.perks ?? []).join(', '),
    priceUsd: t.price,
  };
}

function newTierFormValues(): TierFormValues {
  return { title: '', description: '', perks: '', priceUsd: 4.99 };
}

function parsePerks(s: string): string[] {
  return s.split(',').map((p) => p.trim()).filter(Boolean);
}

type EditState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; tier: TierPayload };

const PremiumTiers: React.FC<any> = () => {
  const { current: { community } } = useCommunity();
  const router = useRouter();
  const billing = useCommunityBilling(community?.id);
  const [editState, setEditState] = useState<EditState>({ mode: 'closed' });
  const [busy, setBusy] = useState(false);

  const ownerAccountId = billing.data?.ownerAccountId ?? null;
  const tiers = billing.data?.tiers ?? [];

  const closeEditor = () => setEditState({ mode: 'closed' });

  const handleSubmit = async (values: TierFormValues) => {
    if (editState.mode === 'closed') return;
    setBusy(true);
    try {
      if (editState.mode === 'create') {
        const created = await apiCreateTier(community.id.toString(), {
          title: values.title,
          description: values.description,
          perks: parsePerks(values.perks),
          priceUsd: Number(values.priceUsd),
        });
        if (created) {
          toast.success('Tier created');
          billing.refresh();
          closeEditor();
        }
      } else {
        const updated = await apiUpdateTier(
          community.id.toString(),
          editState.tier.id,
          {
            title: values.title,
            description: values.description,
            perks: parsePerks(values.perks),
            priceUsd: Number(values.priceUsd),
          },
        );
        if (updated) {
          toast.success('Tier updated');
          billing.refresh();
          closeEditor();
        }
      }
    } finally {
      setBusy(false);
    }
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

  // Republish a tier whose Stripe price was nulled (after a delete).
  // PATCH with the existing price triggers the "no stripePriceId" branch
  // server-side which mints a fresh Product+Price.
  const onRepublish = async (tier: TierPayload) => {
    setBusy(true);
    const updated = await apiUpdateTier(community.id.toString(), tier.id, {
      title: tier.title,
      priceUsd: tier.price,
    });
    if (updated?.stripePriceId) {
      toast.success('Tier republished');
      billing.refresh();
    } else if (updated) {
      toast.error('Tier republish failed — try deleting the row and creating a fresh one.');
    }
    setBusy(false);
  };

  const initialValues = editState.mode === 'edit'
    ? payloadToFormValues(editState.tier)
    : newTierFormValues();

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

      {!billing.loading && ownerAccountId && tiers.length === 0 && editState.mode === 'closed' && (
        <p>No tiers yet — create your first one below.</p>
      )}

      {editState.mode === 'closed' && tiers.map((tier) => (
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
            {tier.description && <p style={{ opacity: 0.7 }}>{tier.description}</p>}
            {tier.perks?.length > 0 && (
              <p style={{ fontSize: '0.85em', opacity: 0.7 }}>
                {tier.perks.join(' · ')}
              </p>
            )}
            {tier.stripePriceId === null && (
              <p style={{ color: 'orange' }}>Stripe price missing — click Republish to re-publish.</p>
            )}
          </OldCol>
          <OldRow>
            {tier.stripePriceId === null ? (
              <Button color="primary" onClick={() => onRepublish(tier)} disabled={busy}>
                Republish
              </Button>
            ) : (
              <Button
                color="none"
                onClick={() => setEditState({ mode: 'edit', tier })}
                disabled={busy}
              >
                Edit
              </Button>
            )}
            <Space size="sm" />
            <Button color="error" onClick={() => onDelete(tier)} disabled={busy}>
              Delete
            </Button>
          </OldRow>
        </OldRow>
      ))}

      {editState.mode !== 'closed' && (
        <Formik<TierFormValues>
          initialValues={initialValues}
          validationSchema={tierSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ errors, touched, isValid, dirty }) => (
            <Form>
              <h3>{editState.mode === 'create' ? 'New Tier' : `Edit ${editState.tier.title}`}</h3>
              <Space direction="column" size="sm" />

              <label>
                Name
                <Field name="title" as={FormInput} placeholder="Premium" />
              </label>
              {touched.title && errors.title && <FieldError>{errors.title}</FieldError>}
              <Space direction="column" size="sm" />

              <label>
                Description
                <Field
                  name="description"
                  as={FormTextarea}
                  placeholder="What subscribers get"
                  rows={3}
                />
              </label>
              {touched.description && errors.description && <FieldError>{errors.description}</FieldError>}
              <Space direction="column" size="sm" />

              <label>
                Perks (comma-separated)
                <Field
                  name="perks"
                  as={FormInput}
                  placeholder="Members-only chat, Early access, Custom emoji"
                />
              </label>
              {touched.perks && errors.perks && <FieldError>{errors.perks}</FieldError>}
              <Space direction="column" size="sm" />

              <label>
                Monthly price (USD)
                <Field name="priceUsd" as={FormInput} type="number" min="1" step="0.01" />
              </label>
              {touched.priceUsd && errors.priceUsd && <FieldError>{errors.priceUsd}</FieldError>}
              <Space direction="column" />

              {editState.mode === 'edit' && Number(initialValues.priceUsd) !== 0 && (
                <p style={{ fontSize: '0.85em', opacity: 0.7 }}>
                  Changing the price mints a new Stripe price. Existing subscribers keep paying the old price until they cancel.
                </p>
              )}

              <Space direction="column" size="sm" />

              <OldRow>
                <Button color="none" type="button" onClick={closeEditor} disabled={busy}>
                  Cancel
                </Button>
                <Space size="sm" />
                <ButtonLarge
                  color="primary"
                  type="submit"
                  disabled={busy || !isValid || (editState.mode === 'edit' && !dirty)}
                >
                  {busy ? 'Working…' : editState.mode === 'create' ? 'Create Tier' : 'Save'}
                </ButtonLarge>
              </OldRow>
            </Form>
          )}
        </Formik>
      )}

      <Space direction="column" />

      {editState.mode === 'closed' && ownerAccountId && (
        <ButtonLarge color="primary" onClick={() => setEditState({ mode: 'create' })} disabled={busy}>
          Create New Tier
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
