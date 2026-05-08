// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { Mention, MentionSource, NotificationType, Prisma } from '@prisma/client';
import { Username } from '@src/components/UserHeader/styled';
import { findMentions } from '@src/lib/mention';
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
    const post = await prisma.post.findUnique( {
      where: {
        id: id ? BigInt(id as string) : undefined,
        uuid: uuid ? uuid as string : undefined,
      },
      include: Post.include,
    });
    res.json(post);
  })
  .post(async (req, res) => {
    const {
      authId,
      body,
    } = req;
    const typedBody : PostBody = body;

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
      let result : Mention = null;
      try { //If one fails to connect, keep going
        result = await prisma.mention.create({ data: temp });
      } catch (error) {
        console.warn(error);
      }
      if (result.id) {
        newMentions.push({ id: result.id });
      }
    }

    const newPost : Prisma.PostCreateInput = {
      title: typedBody.title,
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
    };
    const post = await prisma.post.create({
      data: newPost,
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
      title: typedBody.title,
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