// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { MessageUnion } from 'api/communityAPI';
import { ReactComponent as HeartIcon } from 'graphics/commonicons/heart.svg';
import { ReactComponent as ChatIcon } from 'graphics/commonicons/message.svg';
import { ReactComponent as VideoIcon } from 'graphics/commonicons/play.svg';
import useRouting from 'hooks/useRouting';
import { APP } from 'pages';
import PostPreview from 'pages/modals/PostPreview';
import { timeAgoString } from 'shared/common_utils';
import { MediaType, MessageType } from 'shared/types/documents';
import { RootState } from 'store/store';
import { Col, Row } from 'styles/Flex';
import { Icon } from 'styles/Globals';
import { Space } from 'styles/layout';

import { BlockedOverlay, Container, Overlay, OverlayIcon, PostTitle } from './styled';

type Props = {
  post: MessageUnion;
};

const PostTile: React.FC<Props> = ({ post }) => {
  const history = useRouting();
  const [ postPreviewOpen, setPostPreviewOpen ] = useState(false);
  const user = useSelector((state: RootState) => state.user);
  const { blockedUsers } = useSelector((state: RootState) => state.network);
  const [blocked, setBlocked] = useState<boolean>(false);
  
  useEffect(() => {
    if (post.author.id) {
      if (blockedUsers.get(post.author.id) != blocked) {
        setBlocked(blockedUsers.get(post.author.id) || false);
      }
    }
  }, [blockedUsers, post.author.id]);

  const toggleOpenPostPreview = (value?: boolean) => {
    setPostPreviewOpen(state => value || !state);
    
  };
  if (post.type != MessageType.Post) return (<div>Error</div>);
  let titleSnippet = post.title;
  if (titleSnippet && titleSnippet.length > 36) {
    titleSnippet = titleSnippet.slice(0, 36) + '...';
  }

  const shortDate = post.timestamp && timeAgoString(post.timestamp.toDate());

  return (
    <>
      <PostPreview
        isOpen={postPreviewOpen}
        onRequestClose={() => toggleOpenPostPreview(false)}
        post={post}
      />
      <Container url={post.mediaURL} onClick={() => {
        if (user.id) toggleOpenPostPreview(true);
        else history.navigate(APP.AUTH.INDEX);
      }}>
        
        {post.media_type === MediaType.Video &&  
          <Col $center $full>
            <PostTitle>{titleSnippet}</PostTitle>
            <Icon $solid $color='fontFocus' as={VideoIcon} width={50} height={50}/>
          </Col>
        }
        {!post.media && 
          <Col $full $center>
            <PostTitle>{titleSnippet}</PostTitle>
            <h5>{shortDate}</h5>
          </Col>
        }
        {blocked 
          ? <BlockedOverlay $center $full>
              <h5>{`${post.author.display_name || post.author.username} is blocked`}</h5>
              <br /> 
              <h6>Visit their profile to unblock content</h6>

            </BlockedOverlay>
          : <Overlay $center $full>
              {post.media && 
                <>
                  <PostTitle>{titleSnippet}</PostTitle>
                  <h5>{shortDate}</h5>
                </>
              }
              <br/>
              <Row $center>
                <OverlayIcon as={HeartIcon} />
                {post.likes || 0}
                <Space />
                <OverlayIcon $solid as={ChatIcon} />
                {post.comments || 0}
              </Row>
          </Overlay>
        }
        
      </Container>
    </>
    
  );
};

export default PostTile;
