import { useRef } from 'react';
import ReactPlayer from 'react-player';
import usePost from '@src/hooks/usePost';
import { Col } from '@src/styles/Flex';
import { Post } from '@src/types/prisma';
import { getMediaType } from '@src/utils/common_utils';
import { useDoubleTap } from 'use-double-tap';

import RichRender from 'components/Rich/RichRender';
import { ClickableSpan } from 'styles/Buttons';

import { ReadMoreButton } from './styled';


interface TextContentProps {
  title: string,
  text: string,
  openPost: () => void;
}
function TextContent({ title, text, openPost }: TextContentProps) {
  const ref = useRef(null);

  const showMore = () => {
    if (ref.current) {
      // @ts-ignore
      return ref.current.scrollHeight > ref.current.clientHeight;
    }
  };

  return (
		<>
			<h3 className="my-6">{title}</h3>
			<div className="relative">
				<p ref={ref} className="line-clamp-3 mb-5"><RichRender value={text} /></p>
				{showMore() && 
				<ReadMoreButton className="absolute right-0 bottom-0 pl-2 pb-0.5">
					<ClickableSpan onClick={openPost}> 
						...Read More 
					</ClickableSpan>
				</ReadMoreButton> }
			</div>
		</>

  );
}


interface ContentProps {
  post: Post;
  openPost: () => void;
  actionLikePost: () => void;
}

export default function ContentContainer({ post, openPost, actionLikePost }: ContentProps) {
  const thisPost = usePost(post, true);
  const doubleTap = useDoubleTap(() => {
    actionLikePost();
  });


  return (
		<Col>
			{post.media && 
			  thisPost.mediaURL?.map((url, index) => {
			    const isVideo: boolean = getMediaType(post.media[index]) === 'video';
			    return ( 					
						<div className="flex justify-center items-center">
							<div className="">
								{!isVideo &&
								<div className="select-none" {...doubleTap}>
									{url && <img 
										className="pointer-events-none sm:rounded-2xl" 
										src={url} alt="image not found" 
									/>}
								</div>
								}
								{isVideo && url && <ReactPlayer width="100%" url={url} controls loop />}
							</div>
						</div>
			    );
			  })
			}

			{/* Text For Media Post */}
			{post.media &&
				<div className="mx-2">
					<TextContent title={post.title} text={post.text} openPost={openPost} />
				</div>
			}
		</Col>
  );
}

