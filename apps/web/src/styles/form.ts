// Some of these imports are used in jsdoc comments
// eslint-disable-next-line
import { Checkbox as NewCheckbox } from 'components/FormInput/styles';
// eslint-disable-next-line
import { ErrorMessage } from 'components/FormInput';
import styled from 'styled-components';
import { mediaQuery } from './Globals';

// TODO Refactor, this now lives in components/FormInput/styles.ts
// We need to make a pr where we delete this forms.ts and fix all the imports to use that other styles.ts file
export const Input = styled.input`
  padding: 18px 24px;

  width: 100%;
  height: 60px;
  font-size: 16px;
  line-height: 24px;

  background: ${({ theme }) => theme.backgroundLight};
  border-radius: 8px;
  margin: 20px auto;

  border: 1px solid transparent;
  color: ${({ theme }) => theme.fontPrimary};

  ::placeholder {
    color: ${({ theme }) => theme.fontTertiary};
  }

  &:focus {
    border: 1px solid ${({ theme }) => theme.primary};
  }
`;


/** @deprecated use {@link NewCheckbox} */
export const Checkbox = styled.input`
  cursor: pointer;
  background-color: ${({ theme }) => theme.backgroundLight};
  border-radius: 2px;
  // TODO Once we remove the sass file, this important shouldn't be needed anymore
  margin: 0px 10px !important;
  width: 20px;
  height: 20px;
`;


const ButtonBase = styled.button`
  height: 60px;
  width: 100%;

  margin: 30px 0px;
  Flex
  ${mediaQuery.sm} {
    margin: 10px 0px;
  }

  background: ${({ theme }) => theme.primary};
  border-radius: 8px;
  border: none;


  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  font-weight: bold;
  font-size: 16px;
  line-height: 40px;

  color: ${({ theme }) => theme.fontFocus};
  cursor: pointer;

  &:hover {
    border: ${({ theme }) => theme.secondary};
    filter: brightness(1.1);
  }
`;

// TODO make these and move them over to buttons.ts

/**
 * @deprecated please use buttons defined in src/styles/Buttons.ts
 */
export const Button = styled(ButtonBase)`

`;

/** @deprecated use {@link ErrorMessage} */
export const FieldError = styled.div`
  font-size: 12px;
  line-height: 18px;
  color: red;
  margin: -5px auto 10px auto;
`;