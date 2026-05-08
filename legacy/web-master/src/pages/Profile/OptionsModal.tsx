import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import copy from 'copy-to-clipboard';

import { reportUser } from 'api/report';
import Modal from 'components/ModalV2';
import { blockUser } from 'store/networkSlice';
import { RootState } from 'store/store';
import { User } from 'store/userSlice';

import { OptionsButton } from './styled';

interface OwnProps {
  isOpen: boolean;
  onRequestClose: () => void;
  user: User;
}

// TODO: Allow for reporting a post

export default function OptionsModal({ isOpen, onRequestClose, user }: OwnProps) {
  const dispatch = useDispatch();
  const { id: uid }  = useSelector((state: RootState) => state.user);
  const { blockedUsers } = useSelector((state: RootState) => state.network);
  const url = `${window.location.origin}/${user.username}`;

  const copyLink = () => {
    copy(url);
    onRequestClose();
    toast.info('Link copied to clipboard');
  };

  const shareLink = async () => {
    const shareData = {
      title: 'Check out this out on BackSpace',
      text: user.display_name || user.username,
      url: url,
    };
    try {
      await navigator.share(shareData).then(() => onRequestClose);
    } catch {
      copyLink();
    }
  };

  const handleReportUser = () => {
    onRequestClose();
    reportUser(user.id, uid);
    toast.info('Post has been reported');
    toast.info('To hide posts from this user, you can block them.', { autoClose: 8000 });
  };

  const blockAuthor = async () => {
    onRequestClose();
    const isBlocked = blockedUsers.get(user.id);
    dispatch(blockUser({ userId: user.id, value: !isBlocked }));
  };

  return (
    <Modal
      open={isOpen}
      handleClose={onRequestClose}
      closeButton={false}
    >
      <div className="flex flex-col divide-y-[0.5px] w-[300px] 12">
        {uid != user.id && 
          <OptionsButton onClick={blockAuthor} className="text-red-500 font-bold">
            {blockedUsers.get(user.id) ? 'Unblock User' : 'Block User'}
          </OptionsButton>
        }
        {uid != user.id && 
          <OptionsButton onClick={handleReportUser} className="text-red-500 font-bold">Report User</OptionsButton>
        }
        <OptionsButton onClick={shareLink}>Share To...</OptionsButton>
        <OptionsButton onClick={copyLink}>Copy Link</OptionsButton>
        <OptionsButton onClick={onRequestClose}>Cancel</OptionsButton>
      </div>
    </Modal>
  );
}

