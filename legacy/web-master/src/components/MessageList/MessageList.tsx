// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Display Messages, newest at bottom

import React, { useEffect, useRef, useState } from 'react';
import ReactLoading from 'react-loading';
import { toast } from 'react-toastify';

import { MessageUnion as MessageUnion } from 'api/communityAPI';
import { ClickableSpan } from 'styles/Buttons';
import { HorizontalLine } from 'styles/Dividers';
import { FlexBreakRow, Row } from 'styles/Flex';
import { Tw } from 'types/utilityTypes';

// import { useVirtual } from 'react-virtual';
import GenerateMessage from './components/GenerateMessage';
import { EndOfMessages, List, LoadMoreNotice } from './styled';


type Props = Tw & {
  messages : Array<MessageUnion>;
  initialPosition: 'top' | 'bottom'; 
  hasMore : boolean;
  loadMore : () => Promise<any>;
  loadMoreMessages?: Array<MessageUnion>;
  showDateChange?: boolean;
  onScrollHandler?: (distance: number) => void;
  disableAutoScroll? : boolean;
  center?: boolean;
  hideBeginning?: boolean;
  grid?: boolean;
};

const MessageList:React.FC<Props> = ({
  messages,
  initialPosition,
  hasMore,
  loadMore,
  loadMoreMessages = [],
  showDateChange = false,
  onScrollHandler = () => null,
  disableAutoScroll = false,
  center = false,
  hideBeginning = false,
  grid = false,
  className = '',
}) => {

  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref used for scrolling
  const [pageNum, setPageNum] = useState(0);
  const [lastElement, setLastElement] = useState<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // https://dev.to/ms_yogii/infinite-scrolling-in-react-with-intersection-observer-22fh
  const observer = useRef(
    new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          setPageNum((no) => no + 1);
        }
      },
    ),
  );
  const reverse = initialPosition === 'bottom';

  useEffect(() => {
    console.log('End of Current Messages');
    if (hasMore && messages && messages.length > 0) {
      setIsLoading(true);
      loadMore().then(() => setIsLoading(false));  
    }
  }, [pageNum]);

  //Observer Logic
  useEffect(() => {
    const currentElement = lastElement;
    const currentObserver = observer.current;

    if (currentElement) {
      currentObserver.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        currentObserver.unobserve(currentElement);
      }
    };
  }, [lastElement]);

  //@ts-ignore
  const handleScroll = (event) =>  {
    const element = event?.target;
    if (element instanceof HTMLDivElement) { //Typescript forwards generic
      onScrollHandler(element.scrollTop);
      if (element.scrollHeight - element.scrollTop === element.clientHeight) {
        setAutoScroll(true);
      } else {
        setAutoScroll(false);
      }
    }
  };

  // Detect changes in messages and scroll to bottom
  useEffect(() => {
    if (autoScroll && !disableAutoScroll){
      messagesEndRef.current?.scrollIntoView();
    }
    scroll();
  }, [messages]);

  // Push off the top slightly when new loadMoreMessages
  useEffect(() => {
  }, [loadMoreMessages]);

  // Rendering
  return (
    <div className={`overflow-auto ${className}`}>
       <List reverse={reverse} onScroll={handleScroll} center={center} grid={grid}>
          <div ref={messagesEndRef} style={{ height: '0px' }} />
          {messages?.length > 0 && messages.map((message, index) => {
            return <GenerateMessage
                key={message.id}
                index={index}
                message={message}
                previousMessage={messages[index - 1]}
                showDateChange={showDateChange}
                compact={grid}
              />;
          })}
          {loadMoreMessages?.length > 0 && loadMoreMessages.map((message, index) => {
            return <GenerateMessage
                    key={message.id}
                    index={index}
                    message={message}
                    previousMessage={messages[index - 1]}
                    showDateChange={showDateChange}
                    compact={grid}
                  />;
          })}
          {/* Sorry that the below is kind of a cluster Fuck */}
          {messages && messages.length > 0 &&
          <>
            {/* Flex Break Row for grid view support */}
            <FlexBreakRow />
            <LoadMoreNotice ref={setLastElement}>
              {hasMore ?
                isLoading && <ReactLoading type='bubbles' /> ||
                <EndOfMessages>
                  <ClickableSpan onClick={() => {toast.info('Fetching More...'); loadMore();}}>Load More</ClickableSpan>
                </EndOfMessages>
                :
                !hideBeginning && <Row $center $full>
                  <HorizontalLine/>
                  <EndOfMessages>Beginning of History</EndOfMessages>
                  <HorizontalLine/>
                </Row>
              }
            </LoadMoreNotice>
          </>
          }
      </List>
    </div>
  );
};

export default MessageList;
