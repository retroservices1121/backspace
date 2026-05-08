import ReactLoading from 'react-loading';

import DisplayComment from 'components/Comment';
import { Comment } from 'types/prisma';

type Props = {
  comments: Comment[];
};

export default function CommentsContainer({ comments }: Props) {
  return (
		<>
			{/* Comments Section */}
			<div className='col max-h-[300px] px-5 overflow-auto'>
				{comments && comments.length > 0 ? 
				  comments.map((comment) => {
				    return <DisplayComment comment={comment} />;
				  })
				  :
				  comments === undefined 
				    ?
						<ReactLoading type={'bubbles'} />
				    :
						<p>Be the first to comment!</p>
					
				}
			</div>
		</>
  );
}

