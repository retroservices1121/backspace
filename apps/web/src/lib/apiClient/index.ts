// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import Channels from './channels';
import Communities from './communities';
import Conversation from './conversation';
import Member from './member';
import Messages from './messages';


// Due to axios handling baseurl('/api'), for now, we'll set this to just '';
const BASE_URL = '';

const ApiClient = {
  Channels: Channels(BASE_URL + '/channels'),
  Communities: Communities(BASE_URL + '/communities'),
  Conversation: Conversation(BASE_URL + '/conversation'),
  Member: Member(BASE_URL + '/member'),
  Messages: Messages(BASE_URL + '/messages'),
};

export default ApiClient;