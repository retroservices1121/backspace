import { Post } from '@src/types/prisma';

import PostTile from 'components/PostTile';
import { PostList as PostListContainer } from 'components/Profile/styled';

interface OwnProps {
  posts: Post[] | undefined;
}

export default function PostList({ posts }: OwnProps) {

  return (
		<PostListContainer>
			{posts && posts?.map((post, idx) => (
				<PostTile post={post} key={`post-${post.id}`}/>
			))}
		</PostListContainer>
  );
}

