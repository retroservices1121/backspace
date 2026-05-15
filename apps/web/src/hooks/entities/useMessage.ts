// Hook for actions on a single community channel message. Both
// operations are author-only on the server (PATCH/DELETE
// /api/messages/[id] checks the requester is the message author),
// which is also what the UI guards against in BaseMessage.

import { communityThunks } from '@src/store/community/slice';
import { useAppDispatch } from '@src/store/store';

export default function useMessage(uuid: string) {
  const dispatch = useAppDispatch();

  const Delete = () => dispatch(communityThunks.deleteMessage(uuid));
  const edit = (text: string) =>
    dispatch(communityThunks.editMessage({ uuid, text }));

  return { Delete, edit };
}
