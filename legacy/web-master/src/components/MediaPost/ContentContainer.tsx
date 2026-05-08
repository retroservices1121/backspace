import { useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { useDoubleTap } from 'use-double-tap';

import { MessageUnion } from 'api/communityAPI';
import RichRender from 'components/Rich/RichRender';
import { MediaType, MessageType, PostDocument } from 'shared/types/documents';
import { ClickableSpan } from 'styles/Buttons';

import { ReadMoreButton } from './styled';


interface TextContentProps {
  post: MessageUnion;
  openPost: () => void;
}
function TextContent({ post: parentPost, openPost }: TextContentProps) {
  const post = parentPost as PostDocument;
  const ref = useRef(null);

  const showMore = () => {
    if (ref.current) {
      // @ts-ignore
      return ref.current.scrollHeight > ref.current.clientHeight;
    }
  };

  return (
		<>
			<h3 className="my-6">{post.type === MessageType.Post && post.title}</h3>
			<div className="relative">
				<p ref={ref} className="line-clamp-3 mb-5"><RichRender value={post.text} /></p>
				{showMore() && <ReadMoreButton className=""><ClickableSpan onClick={openPost}> ...Read More </ClickableSpan></ReadMoreButton> }
			</div>
		</>

  );
}


interface ContentProps {
  post: MessageUnion;
  openPost: () => void;
  actionLikePost: () => void;
}

export default function ContentContainer({ post: parentPost, openPost, actionLikePost }: ContentProps) {
  const post = parentPost as PostDocument;
  const [isVideo] = useState(post.media_type === MediaType.Video);

  const doubleTap = useDoubleTap(() => {
    actionLikePost();
  });


  return (
		<>
			{parentPost.media ?
			  (
					<div className="flex justify-center items-center">
						<div className="">
							{!isVideo &&
							<div className="select-none" {...doubleTap}>
								<img className="pointer-events-none sm:rounded-2xl" src={parentPost.mediaURL} alt="media" />
							</div>
							}
							{isVideo && <ReactPlayer width="100%" url={parentPost.mediaURL} controls loop />}
						</div>
					</div>
			  )
			  :
			  (
					<div className="mx-4" {...doubleTap}>
						<TextContent post={parentPost} openPost={openPost} />
					</div>
			  )
			}

			{/* Text For Media Post */}
			{parentPost.media &&
				<div className="mx-2">
					<TextContent post={parentPost} openPost={openPost} />
				</div>
			}
		</>
  );
}

