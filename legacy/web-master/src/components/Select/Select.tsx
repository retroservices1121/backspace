// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import RSelect, { OptionProps, StylesConfig } from 'react-select';
import { useTheme } from 'styled-components';

import { Input } from 'types/forms';

import { Option } from './types';

type Props = {
  options: Option[];
  placeholder?: string;
};

const Select: Input<Option, Props> = ({
  options,
  field: { name, value },
  form: { setFieldValue, setFieldTouched },
  placeholder,
}) => {
  const theme = useTheme();
  //TODO refactor this since we now had to move the style defs inside to make use of the theme object.
  function getOptionColor(state: OptionProps<Option>) {
    if (state.isFocused || state.isSelected) {
      return theme.primary;
    }
    return 'initial';
  }

  // https://react-select.com/styles#style-object
  const customStyles: StylesConfig<Option> = {
    control: (provided, state) => ({
      ...provided,
      background: theme.backgroundLight,
      border: state.isFocused ? `1px solid ${theme.primary}` : 'none',
      height: '60px',
      width: '100%',
      margin: 'auto',
      borderRadius: '8px',
    }),
    container: (provided) => ({
      ...provided,
      width: 'fit-content',
      minWidth: '150px',
      paddingTop: '18px',
    }),
    placeholder: (provided) => ({
      ...provided,
      padding: '0 15px',
      fontSize: '16px',
      color: theme.fontTertiary,
    }),
    singleValue: (provided) => ({
      ...provided,
      padding: '0 15px',
      fontSize: '16px',
      color: theme.fontPrimary,
    }),
    menuList: (provided) => ({
      ...provided,
      background: theme.backgroundLight,
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    option: (provided, state) => ({
      ...provided,
      background: getOptionColor(state),
    }),
  };
  return (
    <RSelect<Option>
      value={value}
      options={options}
      onChange={(newValue) => {
        setFieldValue(name, newValue || options[0], true);
        setFieldTouched(name);
      }}
      styles={customStyles}
      placeholder={placeholder}
    />
  );
};
export default Select;
