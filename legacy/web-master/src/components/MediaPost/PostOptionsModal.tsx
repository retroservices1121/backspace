import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import copy from 'copy-to-clipboard';

import { MessageUnion } from 'api/communityAPI';
import { FireDB } from 'api/firebase';
import { PostUnion } from 'api/PostAPI';
import { reportPost } from 'api/report';
import Modal from 'components/ModalV2';
import { isAdmin } from 'shared/common_utils';
import { Collections, PermissionsType, PostDocument } from 'shared/types/documents';
import { deletePost } from 'store/feedSlice';
import { blockUser } from 'store/networkSlice';
import { RootState } from 'store/store';
import { ColoredSpan } from 'styles/Globals';

import { OptionsButton } from './styled';

interface OwnProps {
  isOpen: boolean;
  onRequestClose: () => void;
  post: MessageUnion;
}

// TODO: Allow for reporting a post

export default function PostOptionsModal({ isOpen, onRequestClose, post: parentPost }: OwnProps) {
  const post = parentPost as PostUnion;
  const dispatch = useDispatch();
  const { id: uid, memberships }  = useSelector((state: RootState) => state.user);
  const { blockedUsers } = useSelector((state: RootState) => state.network);
  const url = `${window.location.origin}/?post=${post.id}`;

  const handleDeletePost = async () => {
    const myRole = memberships?.find((mem) => mem.id === post.community)?.role;
    if (uid === post?.author?.id) {
      dispatch(deletePost(post));
    } else if (myRole && myRole >= PermissionsType.Moderators) {
      dispatch(deletePost(post));
    } else {
      toast.warn('You must be a moderator or the post owner to delete this post');
    }
    
    onRequestClose();
  };

  const copyLink = () => {
    copy(url);
    onRequestClose();
    toast.info('Link copied to clipboard');
  };

  const shareLink = async () => {
    const shareData = {
      title: 'Check out this post on BackSpace',
      text: post.title,
      url: url,
    };
    try {
      await navigator.share(shareData).then(() => onRequestClose);
    } catch {
      copyLink();
    }
  };

  const handleReportPost = () => {
    onRequestClose();
    reportPost(post.author.id, uid, post.id || '[Missing ID]');
    toast.info('Post has been reported');
    toast.info('To hide posts from this user, you can block them.', { autoClose: 8000 });
  };

  const blockAuthor = async () => {
    onRequestClose();
    const isBlocked = blockedUsers.get(post.author.id);
    dispatch(blockUser({ userId: post.author.id, value: !isBlocked }));
  };


  const hidePost = async () => {
    onRequestClose();
    const postCol = new FireDB<PostDocument>(`${Collections.Communities}/${post.community}/${Collections.Channels}/${post.channel}/${Collections.Posts}/`);
    if (post.id) {
      postCol.updateDoc(post.id, { hidden: true });
      toast.info('Post has been hidden from feed.');
    } else {
      toast.error('Post ID not available to update post');
    }
  };

  const adminDeletePost = async () => {
    onRequestClose();
    const postCol = new FireDB<PostDocument>(`${Collections.Communities}/${post.community}/${Collections.Channels}/${post.channel}/${Collections.Posts}/`);
    if (post.id) {
      postCol.deleteDoc(post.id);
      toast.info('Post has been deleted.');
    } else {
      toast.error('Post ID not available to delete post');
    }
    
  };

  return (
    <Modal
      open={isOpen}
      handleClose={onRequestClose}
      closeButton={false}
    >
      <div className="flex flex-col divide-y-[0.5px] w-[300px] 12">
        {isAdmin(uid) && (
          <>
            <OptionsButton onClick={hidePost}><ColoredSpan>Admin:</ColoredSpan> Hide Post from Discover</OptionsButton>
            <OptionsButton onClick={adminDeletePost}><ColoredSpan>Admin:</ColoredSpan> Delete Post</OptionsButton>
          </>
        )}
        {uid != post?.author?.id && 
          <OptionsButton onClick={blockAuthor} className="text-red-500 font-bold">
            {blockedUsers.get(post.author.id) ? 'Unblock Author' : 'Block Author'}
          </OptionsButton>
        }
        <OptionsButton onClick={handleReportPost} className="text-red-500 font-bold">Report Post</OptionsButton>
        <OptionsButton onClick={handleDeletePost} className="text-red-500 font-bold">Delete Post</OptionsButton>
        <OptionsButton onClick={shareLink}>Share To...</OptionsButton>
        <OptionsButton onClick={copyLink}>Copy Link</OptionsButton>
        <OptionsButton onClick={onRequestClose}>Cancel</OptionsButton>
      </div>
    </Modal>
  );
}

