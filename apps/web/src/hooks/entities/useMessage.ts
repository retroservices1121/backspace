// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { actions } from '@src/store/community/slice';
import { useAppDispatch } from '@src/store/store';

export default function useMessage(id: string) {
  const dispatch = useAppDispatch();

  const Delete = () => dispatch(actions.deleteMessage(id));
  const edit = () => dispatch(actions.editMessage(id));

  return { Delete, edit };
}
