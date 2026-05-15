import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PostPreview from '@src/components/modals/PostViewer';
import usePost from '@src/hooks/usePost';

import { RootState } from 'store/store';
import { Post } from 'types/prisma';

import ActionsToolBar from './ActionsToolBar';
import ContentContainer from './ContentContainer';
import MediaPostHeader from './MediaPostHeader';
import PostOptionsModal from './PostOptionsModal';
import { Card } from './styled';

type PostProps = {
  post: Post;
};

export default function MediaPost({ post }: PostProps) {
  const thisPost = usePost(post);
  const featuredPost = useSelector((state: RootState) => state.feed.featuredPost);
  const [ postPreviewOpen, setPostPreviewOpen ] = useState(false);

  const toggleOpenPostPreview = () => { setPostPreviewOpen(state => !state); };

  const handleDelete = async () => {
    await thisPost.delete();
  };

  // Fire an impression once per session per post when the row mounts.
  // (A proper viewport-gated IntersectionObserver would be tighter,
  // but mount-fire matches X's behavior closely enough — the feed
  // virtualizer mounts a post when it scrolls into the buffer zone.)
  useEffect(() => {
    thisPost.trackView();
  }, [post.id]);

  //TODO put featured post back together
  // useEffect(() => {
  //   if (featuredPost === post.id) {
  //     setPostPreviewOpen(true);
  //   }
  // }, [featuredPost]);


  return (
    <>
      <Card
        className="w-screen md:w-media px-4 py-3"
        isFeatured={false}>
        <div>
          <MediaPostHeader
            post={post}
            followAction={thisPost.setFollow}
            onEdit={thisPost.edit}
            onDelete={handleDelete}
          />
          <ContentContainer
            post={post}
            openPost={thisPost.open}
            actionLikePost={() => thisPost.setLike(!thisPost.isLiked)}
          />
        </div>

        <ActionsToolBar
          post={post}
          open={thisPost.open}
          isLiked={thisPost.isLiked}
          actionLikePost={() => thisPost.setLike(!thisPost.isLiked)} />
      </Card>

      {/* Modals */}
      {/* <PostOptionsModal
        isOpen={postOptionsOpen}
        onRequestClose={() => toggleOptionsModal()}
        post={post}
      />
      <PostPreview
        isOpen={postPreviewOpen}
        onRequestClose={() => toggleOpenPostPreview()}
        post={PostOptionsModal}
      /> */}
    </>
  );
}

