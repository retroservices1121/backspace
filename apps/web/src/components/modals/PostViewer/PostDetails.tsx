// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import RichRender from 'components/Rich/RichRender';

type Props = {
  title: string,
  text: string,
};

export default function PostDetails({ title, text }: Props) {

  return (
    <div className="">
			<div className="font-bold text-4xl my-2">{title}</div>
				<RichRender value={text || ''} />
		</div>
  );
}

