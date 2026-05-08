import {  PostUnion } from 'api/PostAPI';
import PostTile from 'components/PostTile';

import { PostList as PostListContainer } from './../styled';

interface OwnProps {
  posts: PostUnion[] | undefined;
}

export default function PostList({ posts }: OwnProps) {

  return (
		<PostListContainer>
			{posts && posts?.map((post, idx) => (
				<PostTile post={post} key={idx}/>
			))}
		</PostListContainer>
  );
}

