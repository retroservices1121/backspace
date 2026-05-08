import { MessageUnion } from 'api/communityAPI';
import { CommentUnion } from 'api/PostAPI';
//import { PostUnion } from 'api/PostAPI';
import MessageList from 'components/MessageList';
import { MessageType } from 'shared/types/documents';
import { Tw } from 'types/utilityTypes';

type Props = Tw & {
  post: MessageUnion;
  comments: CommentUnion[];
};

export default function CommentsContainer({
  post: parentPost,
  comments,
  className = '',
}: Props) {
  return (
		<>
			{/* Comments Section */}
			{parentPost.type == MessageType.Post && !parentPost.disable_comments ?
			  comments.length > 0 ? (
				<MessageList
          className={className}
					messages={comments}
					initialPosition='bottom'
					hasMore={false}
					hideBeginning={true}
					loadMore={function (): Promise<any> {
					  throw new Error('Function not implemented.');
					} }
				/>
			  ) : (
				<p className="ml-12 mt-10">Be the first to comment!</p>
			  )
			  :
				<h3 className="ml-12 mt-10">Comments are disabled for this post.</h3>
			}
		</>
  );
}

