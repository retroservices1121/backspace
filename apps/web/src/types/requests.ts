// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { DocumentId } from './documents';

export type FollowUpdate = {
  follow_uid: DocumentId,
  follow: Boolean
};