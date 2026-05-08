// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Select, { OptionProps, SelectInstance, StylesConfig } from 'react-select';
import { useTheme } from 'styled-components';

import { SimpleDate } from 'shared/types/documents';
import { Input } from 'types/forms';

type Option = {
  value: number;
  label: string;
};



const MONTHS_OPTIONS: Option[] = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

function getDays(month: number, year: number) {
  const dayCount = new Date(year, month, 0).getDate();
  const days: Option[] = [];
  for (let i = 1; i < dayCount + 1; i++) {
    days.push({
      value: i, label: i.toString(),
    });
  }
  return days;
}

const YEARS_TO_SHOW = 122; // based on oldest person alive
const THIS_YEAR = new Date().getFullYear();

function getYears(currentYear: number = THIS_YEAR) {
  const years: Option[] = [];
  for (let i = currentYear; i > currentYear - YEARS_TO_SHOW; i--) {
    years.push({
      value: i, label: i.toString(),
    });
  }
  return years;
}


type Props = {
  label?: string;
  value?: SimpleDate;
  onChange: (date: SimpleDate) => void;
};

const DatePicker: React.FC<Props> = ({
  value,
  onChange,
}) => {
  const theme = useTheme();
  const [year, setYear] = useState(value?.year);
  const [month, setMonth] = useState(value?.month);
  const [day, setDay] = useState(value?.day);

  // Years needs to be computed once, so useRef is used since i never gets
  // recalculated and doesn't have the same overhead as useMemo and useState
  const { current: yearOptions } = useRef(getYears(year));

  // useMemo is a really cool thing, here ya go Dylan https://reactjs.org/docs/hooks-reference.html#usememo
  const dayOptions = useMemo(() => getDays(month || 1, year || THIS_YEAR), [month, year]);

  // The day needs to be a controlled field in case the user picks a day
  // that would then become out of range when a different year is picked.
  const daysRef = useRef<SelectInstance<Option>>(null);
  useEffect(() => {
    if (day && day > dayOptions.length) {
      daysRef?.current?.clearValue();
    }
  }, [dayOptions]);

  //Get defaults, and keep them updated
  useEffect(() => {
    if (value?.day) setDay(value.day);
    if (value?.month) setMonth(value.month);
    if (value?.year) setYear(value.year);
  }, [value]);

  useEffect(() => {
    if (year && month && day) {
      let temp : SimpleDate = {
        month: month,
        day: day,
        year: year,
      };
      onChange(temp);
    }
  }, [year, month, day]);

  function getOptionColor(state: OptionProps<Option>) {
    if (state.isFocused || state.isSelected) {
      return theme.primary;
    }
    return 'initial';
  }

  // TODO Find a way to easily reuse the Select component with these styles by
  // means of a Proxy component with the same type information and these injected as new defaults

  // https://react-select.com/styles#style-object
  const customStyles: StylesConfig<Option> = {
    control: (provided, state) => ({
      ...provided,
      background: theme.backgroundLight,
      border: state.isFocused ? `1px solid ${theme.primary}` : 'none',
      height: '60px',
      borderRadius: '8px',
    }),
    container: (provided) => ({
      ...provided,
      width: '100%',
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
    <div className="grid sm:grid-cols-3 sm:gap-12 ">
      <Select<Option>
        options={MONTHS_OPTIONS}
        value={month && MONTHS_OPTIONS[month - 1] || undefined}
        onChange={(newValue) => setMonth(newValue?.value || 1)}
        styles={customStyles}
        placeholder='Month'
      />


      <Select<Option>
        options={dayOptions}
        value={day && dayOptions[day - 1] || undefined}
        onChange={(newValue) => setDay(newValue?.value || 1)}
        ref={daysRef}
        styles={customStyles}
        placeholder='Day'
      />

      <Select<Option>
        options={yearOptions}
        value={year && yearOptions[yearOptions.findIndex((e) => e.value === year) || 0] || undefined}
        onChange={(newValue) => setYear(newValue?.value || THIS_YEAR)}
        styles={customStyles}
        placeholder='Year'
      />
    </div>
  );
};


export const FormDatePicker:Input<SimpleDate, Props> = ({
  label,
  field: { name, value },
  form: { setFieldValue },
}) => {
  return (
    <>
      <label htmlFor={name}>{label}</label>
      <div id={name}>
        <DatePicker value={value} onChange={date => setFieldValue(name, date)} />
      </div>
    </>
  );
};

export default DatePicker;

