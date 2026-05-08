import { MessageUnion } from 'api/communityAPI';
import { PostUnion } from 'api/PostAPI';
import RichRender from 'components/Rich/RichRender';
import { MessageType } from 'shared/types/documents';

//import { Text } from './styled';

type Props = {
  post: MessageUnion;
};

export default function PostDetails({ post: parentPost }: Props) {
  const post = parentPost as PostUnion;

  return (
    <div className="">
			<div className="font-bold text-4xl my-2">{post.type === MessageType.Post && post.title}</div>
				<RichRender value={post.text.length === 0 ? 'No Description...' : post.text} />
		</div>
  );
}

