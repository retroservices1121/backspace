// Flat list of replies. Both the post-detail route and the PostViewer
// modal render this. Loading state: bubbles spinner. Empty state:
// X-style "Be the first to reply" hint. No outer scroll wrapper —
// containers decide their own scrolling (modal scrolls inside, route
// uses page scroll).

import React from 'react';
import ReactLoading from 'react-loading';

import DisplayComment from 'components/Comment';
import { Comment } from 'types/prisma';

type Props = {
  comments: Comment[] | undefined;
};

const CommentsList: React.FC<Props> = ({ comments }) => {
  if (comments === undefined) {
    return (
      <div className="flex justify-center py-8">
        <ReactLoading type={'bubbles'} color="#09A0F1" height={32} width={32} />
      </div>
    );
  }
  if (comments.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-fontTertiary text-sm">
        No replies yet — be the first.
      </div>
    );
  }
  return (
    <div>
      {comments.map((comment) => (
        <DisplayComment key={comment.id.toString()} comment={comment} />
      ))}
    </div>
  );
};

export default CommentsList;
