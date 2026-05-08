// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useTheme } from 'styled-components';

import { AuthAside, AuthMain } from 'components/Auth/styles';
import AppDescription from 'root/public/graphics/app-description.svg';

export default function AuthLayout({ children }) {
  const theme = useTheme();
  return (
    <div className="flex w-full h-full">
      <AuthAside className="flex flex-col w-full">
        <AppDescription width={'100%'} height={'100%'} fill={theme.fontFocus} stroke={theme.backgroundNormal} stroke-width={'0.2'}/>
      </AuthAside>
      <AuthMain className="text-left flex flex-col h-full overflow-y-auto px-10 sm:px-20">
				{children}
			</AuthMain>

    </div>
  );
}

