import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { MessageUnion } from 'api/communityAPI';
import { getMyLike, likePost } from 'api/PostAPI';
import { useBlocked } from 'hooks/useBlocked';
import PostPreview from 'pages/modals/PostPreview';
import { PostDocument } from 'shared/types/documents';
import { RootState } from 'store/store';

import ActionsToolBar from './ActionsToolBar';
import ContentContainer from './ContentContainer';
import MediaPostHeader from './MediaPostHeader';
import PostOptionsModal from './PostOptionsModal';
import { Card } from './styled';

type PostProps = {
  post: MessageUnion;
};

export default function MediaPost({ post: parentPost }: PostProps) {
  const featuredPost = useSelector((state: RootState) => state.feed.featuredPost);
  const post = parentPost as PostDocument;
  const uid = useSelector((state: RootState) => state.user.id);
  const [ postPreviewOpen, setPostPreviewOpen ] = useState(false);
  const [ postOptionsOpen, setPostOptionsOpen ] = useState(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(post.likes);

  const { blocked } = useBlocked(post.sender);

  const toggleOpenPostPreview = () => { setPostPreviewOpen(state => !state); };
  const toggleOptionsModal = () => { setPostOptionsOpen(state => !state); };

  const actionLikePost = () => {
    const newLike = !isLiked;
    if (likePost(uid, post, newLike)) {
      setIsLiked(newLike);
      //TODO This count is not accurate, but gives the user the illusion their like is immediately showing
      setLikesCount(likesCount + (newLike ? 1 : -1));
    }
  };

  useEffect(() => {
    if (post) {
      getMyLike(uid, post).then((result : boolean) => {
        return setIsLiked(result);
      });
    }
  }, [post.likes]);


  useEffect(() => {
    if (featuredPost === post.id) {
      setPostPreviewOpen(true);
    }
  }, [featuredPost]);


  return (
    <>
      <Card isFeatured={featuredPost === post.id}>
        <div className="sm:mx-2">
          <MediaPostHeader post={parentPost} options={toggleOptionsModal} />
          {blocked
            ? <div className='p-5'>
                <span className='text-primary'>Content hidden because user is blocked.</span>
                <br/><span className='text-primary'>Visit their profile to unblock their content.</span>
              </div>
            : <ContentContainer
                post={parentPost}
                openPost={toggleOpenPostPreview}
                actionLikePost={actionLikePost}
              />
          }
          
        </div>
        {!blocked &&
        <ActionsToolBar
          post={parentPost}
          preview={toggleOpenPostPreview}
          isLiked={isLiked}
          likesCount={likesCount}
          actionLikePost={actionLikePost} />
        }
        
      </Card>

      {/* Modals */}
      <PostOptionsModal
        isOpen={postOptionsOpen}
        onRequestClose={() => toggleOptionsModal()}
        post={parentPost}
      />
      <PostPreview
        isOpen={postPreviewOpen}
        onRequestClose={() => toggleOpenPostPreview()}
        post={parentPost}
      />
    </>
  );
}

