// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import prisma from '@src/api2/prisma';
import { Mention, MentionSource, NotificationType, Prisma } from '@prisma/client';
import { findMentions } from '@src/lib/mention';
import { findTokenSymbols } from '@src/lib/tokenMention';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { PostFormState } from '@src/types/post';
import { Post } from '@src/types/prisma';

export type PostBody = PostFormState & {
  id?: bigint, //needed for updates
  mediaId?: bigint
};

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .get(async (req, res) => {
    const {
      query: { id, uuid },
      authId,
    } = req;
    //TODO add 'allowed to access' check
    const post = await prisma.post.findUnique({
      where: {
        id: id ? BigInt(id as string) : undefined,
        uuid: uuid ? uuid as string : undefined,
      },
      include: {
        ...Post.include,
        likes:     { where: { user: { authId } } },
        reposts:   { where: { user: { authId } } },
        bookmarks: { where: { user: { authId } } },
      },
    });
    res.json(post);
  })
  .post(async (req, res) => {
    const {
      authId,
      body,
    } = req;
    const typedBody : PostBody = body;

    // Auto-attach a Token from $SYMBOL mentions in the body when the
    // composer didn't explicitly pick one via TokenPicker. Resolves
    // the FIRST symbol mentioned against the catalog (case-insensitive,
    // active only) — multiple-token embeds aren't supported in the UI
    // and "first mention wins" matches how reading works.
    // marketId still beats tokenId (mutual exclusion in the composer
    // means both shouldn't be set, but be defensive).
    let resolvedTokenId: string | null = typedBody.tokenId ?? null;
    if (!resolvedTokenId && !typedBody.marketId) {
      const symbols = findTokenSymbols(typedBody.text ?? '');
      if (symbols.length > 0) {
        const matches = await prisma.token.findMany({
          where: {
            isActive: true,
            symbol: { in: symbols, mode: 'insensitive' },
          },
          select: { id: true, symbol: true },
        });
        // "First symbol in text wins" — walk symbols in author order
        // and pick the first one that has a catalog hit. Ambiguous
        // symbols (multiple tokens with the same ticker — uncommon
        // in the verified-only catalog but possible) take the first
        // DB row, which is deterministic enough for v1.
        const bySymbol = new Map(
          matches.map((m) => [m.symbol.toUpperCase(), m]),
        );
        for (const s of symbols) {
          const hit = bySymbol.get(s.toUpperCase());
          if (hit) {
            resolvedTokenId = hit.id.toString();
            break;
          }
        }
      }
    }

    //Try to create mentions
    const mentionUsernames = findMentions(typedBody.text);
    const newMentions : Array<{ id: bigint }> = [];
    for (const username of mentionUsernames) {
      const temp : Prisma.MentionCreateInput = {
        type: MentionSource.POST,
        user: {
          connect: {
            username,
          },
        },
        author: {
          connect: {
            authId,
          },
        },
        notification: {
          create: {
            type: NotificationType.MENTION,
            user: {
              connect: {
                username: username,
              },
            },  
          },
        },
      };
      let result : Mention | null = null;
      try { //If one fails to connect, keep going
        result = await prisma.mention.create({ data: temp });
      } catch (error) {
        console.warn(error);
      }
      if (result?.id) {
        newMentions.push({ id: result.id });
      }
    }

    const newPost : Prisma.PostCreateInput = {
      // Posts no longer have a title in the UI (X-style composer);
      // the column is still NOT NULL in the schema, so default it.
      title: typedBody.title ?? '',
      text: typedBody.text,
      enableComments: typedBody.commentsEnabled,
      mentions: {
        connect: newMentions,
      },
      author: {
        connect: {
          authId,
        },
      },
      profile: typedBody.profile ? 
        {
          connect: {
            authId: authId,
          },
        }
        : undefined,
      message: !typedBody.profile ?
        {
          create: {
            text: typedBody.text,
            author: {
              connect: {
                authId: authId,
              },
            },
            community: {
              connect: {
                id: BigInt(typedBody.community.value.id),
              },
            },
            channel: {
              connect: {
                id: BigInt(typedBody.channel.value.id),
              },
            },
          },
        } : undefined, 
      media: typedBody.mediaId ? {
        connect: {
          id: BigInt(typedBody.mediaId),
        },
      } : undefined,
      // Optional Market attachment — set by the CreatePost MarketPicker.
      // When non-null, MediaPost/ContentContainer renders the inline
      // <PostMarketCard /> under the post text in the feed.
      market: typedBody.marketId ? {
        connect: {
          id: BigInt(typedBody.marketId),
        },
      } : undefined,
      // Optional Solana spot Token attachment. Either the composer
      // explicitly picked one (TokenPicker) OR the body text contains
      // a $SYMBOL we resolved against the catalog above. When set,
      // MediaPost/ContentContainer renders <PostTokenCard /> (Dflow
      // swap widget) under the post text. Mutually exclusive with
      // marketId (enforced both in the composer and in the auto-
      // resolver above).
      token: resolvedTokenId ? {
        connect: {
          id: BigInt(resolvedTokenId),
        },
      } : undefined,
    };
    const post = await prisma.post.create({
      data: newPost,
      // Return the full Post payload (author/avatar/message/community/
      // channel/media) so the client can drop the row into the feed
      // without a follow-up GET.
      include: {
        ...Post.include,
        likes:     { where: { user: { authId } } },
        reposts:   { where: { user: { authId } } },
        bookmarks: { where: { user: { authId } } },
      },
    });
    res.json(post);
  })
  .put(async (req, res) => {
    const {
      authId,
      body,
    } = req;
    const typedBody : PostBody = body;
    const update : Prisma.PostUpdateInput = {
      text: typedBody.text,
      enableComments: typedBody.commentsEnabled,
      author: {
        connect: {
          authId: authId,
        },
      },
    };
    const post = await prisma.post.update({
      where: {
        id: BigInt(typedBody.id),
      },
      data: update,
      include: {
        ...Post.include,
        likes:     { where: { user: { authId } } },
        reposts:   { where: { user: { authId } } },
        bookmarks: { where: { user: { authId } } },
      },
    });
    res.json(post);
  })
  .delete(async (req, res) => {
    const {
      query: { id },
      authId,
    } = req;
    const post = await prisma.post.findUnique({
      where: {
        id: BigInt(id as string),
      },
      include: {
        author: true,
      },
    });
    //@ts-ignore idk why authId is showing an error here
    if (authId && post?.author?.authId  === authId) {
      await prisma.post.delete({
        where: {
          id: BigInt(id as string),
        },
      });
      res.end('Post Deleted');
    } else {
      throw new Error('Author does not match authId');
    }
  });

export default handler;