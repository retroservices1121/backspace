// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useRef } from 'react';
import log from 'loglevel';

import { MessageUnion } from 'api/communityAPI';
import Comment from 'components/Comment';
import MediaPost from 'components/MediaPost';
import Message from 'components/Message';
import PostTile from 'components/PostTile';
import { dateLongString } from 'shared/common_utils';
import { MessageType } from 'shared/types/documents';
import { HorizontalLine } from 'styles/Dividers';

import { TimeCrossOver, TimeText } from './styled';

//Generate String for when dates are different between messages
const getDayTransition = (prevDate : Date, currentDate : Date) => {
  try {
    if (currentDate.getDate() != prevDate.getDate()) {
      return dateLongString(currentDate);
    }
  } catch (error) {log.warn(error);}
  return null;
};

const renderBasedOnType = (message : MessageUnion, index : number, compact: boolean) => {
  switch (message.type) {
    case MessageType.Post:
      if (compact) return <PostTile key={`post-${message.id || index}`} post={message} />;
      return <MediaPost key={`post-${message.id || index}`} post={message}/>;
    case MessageType.Comment:
      return <Comment key={`comment-${message.id || index}`} comment={message}/>;
    case MessageType.Channel:
    case MessageType.Direct:
      return <Message key={`message-${message.id || index}`} message={message}/>;
    default:
      return <Message key={`message-${index}`} message={message}/>;
  }
};

type Props = {
  message : MessageUnion, 
  previousMessage : MessageUnion, 
  index : number,
  showDateChange? : boolean,
  compact? : boolean,
};

const GenerateMessage: React.FC<Props> = ({ message, previousMessage, index, showDateChange = false, compact = false }) => {
  const value = message;
  const prevValue = previousMessage || null; //For date transitions
  const rowRef = useRef<HTMLDivElement>(null);
  
  let dayTransition : string | null = null;
  let lastDate = prevValue?.timestamp ? prevValue.timestamp.toDate() : undefined;
  if (lastDate && value && value.timestamp) {
    dayTransition = getDayTransition(
      value.timestamp.toDate(),
      lastDate);
  }
  
  return (
      <div key={`datewrapper-${value.id || index}`} ref={rowRef}>
        {/* Actual Message */}
        {renderBasedOnType(value, index, compact)}
        {/* Day divider */}
        {showDateChange && dayTransition &&
          <TimeCrossOver key={`timecrossover-${value.id || index}`} show={dayTransition ? true : false} >
            <HorizontalLine />
              <TimeText className="text">{dayTransition}</TimeText>
            <HorizontalLine />
          </TimeCrossOver>
        }
      </div>
  );
};

export default GenerateMessage;
