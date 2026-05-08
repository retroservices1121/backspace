// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useRouter } from 'next/router';

import { PostWithUser } from 'api2/post';
import usePost from 'hooks/usePost';
import useUser from 'hooks/useUser';
import { APP } from 'pages';
import { OldRow } from 'styles/Flex';
import { Icon } from 'styles/Globals';
import { Space } from 'styles/layout';
import { NewMessageType as MessageType } from 'types/documents';
import { Post } from 'types/prisma';
import { getMediaType, timeAgoString } from 'utils/common_utils';

import HeartIcon from '../../../public/graphics/commonicons/heart.svg';
import ChatIcon from '../../../public/graphics/commonicons/message.svg';
import VideoIcon from '../../../public/graphics/commonicons/play.svg';
import { Container, Overlay, OverlayIcon, PostTitle } from './styled';

type Props = {
  post: PostWithUser;
};

const PostTile: React.FC<Props> = ({ post }) => {
  const router = useRouter();
  const { user } = useUser();
  const thisPost = usePost(post as Post, true);

  let titleSnippet = post.title;
  if (titleSnippet && titleSnippet.length > 36) {
    titleSnippet = titleSnippet.slice(0, 36) + '...';
  }

  const shortDate = post.createdAt && timeAgoString(post.createdAt);

  return (
    <>
      <Container url={thisPost.mediaURL?.length > 0 && thisPost.mediaURL[0]} onClick={() => {
        if (user.id) thisPost.open();
        else router.push(APP.AUTH.INDEX);
      }}>
        {getMediaType(post.media?.length > 0 && post.media[0]) === 'video' &&
        <div className="flex h-full flex-col justify-center items-center">
          <PostTitle>{titleSnippet}</PostTitle>
          <div className="ml-4 mt-2">
          <Icon $solid $color='fontFocus' as={VideoIcon} width={50} height={50}/>
          </div>
        </div>
        }
        {thisPost.mediaURL?.length === 0 &&
          <div className="flex flex-col h-full justify-center items-center">
            <PostTitle>{titleSnippet}</PostTitle>
            <h5 className="text-center">{shortDate}</h5>
            <br/>
            <div className="flex justify-center">
              <OverlayIcon as={HeartIcon} />
              {post._count.likes || 0}
              <Space />
              <OverlayIcon $solid as={ChatIcon} />
              {post._count.comments || 0}
            </div>
          </div>
        }
        <br/>
        {post.media.length > 0 &&
        <Overlay $center $full>
          <>
            <PostTitle>{titleSnippet}</PostTitle>
            <h5>{shortDate}</h5>
          </>
          <br/>
          <OldRow $center>
            <OverlayIcon as={HeartIcon} />
            {post._count.likes || 0}
            <Space />
            <OverlayIcon $solid as={ChatIcon} />
            {post._count.comments || 0}
          </OldRow>
        </Overlay>
        }
      </Container>
    </>

  );
};

export default PostTile;
