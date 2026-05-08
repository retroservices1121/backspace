import { toast } from 'react-toastify';
import copy from 'copy-to-clipboard';

import { MessageUnion } from 'api/communityAPI';
import { PostUnion } from 'api/PostAPI';
import Modal from 'components/ModalV2';

import { OptionsButton } from './styled';

interface OwnProps {
  isOpen: boolean;
  onRequestClose: () => void;
  post: MessageUnion;
}

// TODO: Allow for reporting a post

export default function PostOptionsModal({ isOpen, onRequestClose, post: parentPost }: OwnProps) {
  const post = parentPost as PostUnion;
  const url = `${window.location.origin}/?post=${post.id}`;

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

  const reportPost = () => {
    onRequestClose();
    toast.info('Post has been reported');
  };

  return (
    <Modal
      open={isOpen}
      handleClose={onRequestClose}
      closeButton={false}
    >
      <div className="flex flex-col divide-y-[0.5px] w-[300px] 12">
        <OptionsButton className="py-6 text-center cursor-pointer text-red-500 font-bold" onClick={reportPost}>Report Post</OptionsButton>
        <OptionsButton className="py-6 text-center cursor-pointer" onClick={shareLink}>Share To...</OptionsButton>
        <OptionsButton className="py-6 text-center cursor-pointer" onClick={copyLink}>Copy Link</OptionsButton>
        <OptionsButton className="py-6 text-center cursor-pointer" onClick={onRequestClose}>Cancel</OptionsButton>
      </div>
    </Modal>
  );
}

