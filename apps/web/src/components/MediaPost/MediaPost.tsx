import { useState } from 'react';
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
  const [ postOptionsOpen, setPostOptionsOpen ] = useState(false);

  const toggleOpenPostPreview = () => { setPostPreviewOpen(state => !state); };
  const toggleOptionsModal = () => { setPostOptionsOpen(state => !state); };
  
  //TODO put featured post back together
  // useEffect(() => {
  //   if (featuredPost === post.id) {
  //     setPostPreviewOpen(true);
  //   }
  // }, [featuredPost]);


  return (
    <>
      <Card 
        className="my-3 sm:my-6 sm:mx-2 sm:px-6 pt-2 pb-4 w-screen md:w-media md:max-h-media sm:rounded-3xl" 
        isFeatured={false}>
        <div className="sm:mx-2">
          <MediaPostHeader post={post} followAction={thisPost.setFollow} options={toggleOptionsModal} />
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

