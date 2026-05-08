// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled from 'styled-components';

import { Transition } from 'components/ListTransition';
import { HorizontalLine } from 'styles/Dividers';
import { OldRow } from 'styles/Flex';
import { dateLongString } from 'utils/common_utils';

export const TimeText = styled.span`
  min-width: fit-content;
  font-weight: normal;
  font-size: 14px;
  line-height: 20px;
  margin: 0px 10px;
  color: ${({ theme }) => theme.fontTertiary};
`;

export const DateEquality = (a: Date, b: Date) => a.getDate() !== b.getDate();

const DateTransition: Transition<Date> = ({ current }) => {
  const transition = dateLongString(current);
  return (
    <OldRow className='w-full my-4 text-center items-center' key={transition}>
      <HorizontalLine />
      <TimeText className="text">{transition}</TimeText>
      <HorizontalLine />
    </OldRow>
  );
};

export default DateTransition;
