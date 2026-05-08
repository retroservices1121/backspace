// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { createMedia, upsertMedia } from '@src/api2/media';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { CreateMediaBody } from '@src/types/requests/media';

const handler = createHandler();

handler
  .use(requireAuthMiddleware) // must be signed in
  .post(async (req, res) => {
    const { 
      body,
    } = req;
    const bodyTyped = body as CreateMediaBody;
    const media = await createMedia(bodyTyped);
    res.json(media);
  })
  .put(async (req, res) => {
    const { 
      query: { relationId }, //Todo i don't love this
      body,
    } = req;
    const bodyTyped = body as CreateMediaBody;
    const media = await upsertMedia(bodyTyped.type, BigInt(relationId as string), bodyTyped);
    res.json(media);
  });

export default handler;