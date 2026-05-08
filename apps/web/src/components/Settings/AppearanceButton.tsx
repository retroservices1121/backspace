import Icons from 'icons';

import { Themes } from 'styles/theme';

import { CheckContainer, ThemeButton } from './styled';

type Props = {
  text: string;
  theme: Themes;
  mode: Themes;
  themes: any;
  onClick: (mode: Themes) => void;
};

export const AppearanceButton: React.FC<Props> = ({ text, mode, theme, themes, onClick }) => (
  <ThemeButton color='backgroundNormal' onClick={() => onClick(mode)} selected={mode === theme}>
    <div className="flex">
      {mode === themes.Dark ? <Icons.Moon/> : <Icons.Sun/>}
      <p className="mx-12">
      {text}
      </p>
      <CheckContainer className="rounded-full" active={mode === theme}>
        <Icons.Check  className="translate-y-0.5 translate-x-px"/>
      </CheckContainer>
    </div>

    {mode !== theme && <div className="w-10"/> }
  </ThemeButton>
);
