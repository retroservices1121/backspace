// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Community, Media, Subscription } from '@prisma/client';
import Stripe from 'stripe';

export type SubscriptionWithCommunity = Subscription & {
  community: Community & { avatar: Media }
};