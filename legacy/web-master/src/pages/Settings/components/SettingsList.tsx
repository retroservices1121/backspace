// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Col } from 'styles/Flex';
import { Icon } from 'styles/Globals';

import { Settings, Tabs } from './common';
import { OptionBlock, OptionHeader } from './styled';

type Props = {
  activeTab: Tabs,
  setActive: (value: Tabs) => void,
};

const list = [Tabs.Account, Tabs.Notifications, Tabs.Security,  Tabs.Appearance, Tabs.Billing, Tabs.Creator];

const SettingsList: React.FC<Props> = ({ activeTab, setActive }) => {
  return (
    <>
      {list.map((value) => (
        <OptionBlock as={Col} active={activeTab === Tabs[value]} onClick={() => setActive(Tabs[value])}>
          <OptionHeader>
            <Icon $solid={Settings[value].iconFill} as={Settings[value].icon} $color={activeTab === Tabs[value] ? 'white' : 'primary'} /> <h4>{value}</h4>
          </OptionHeader>
          <h5>{Settings[value].description}</h5>
        </OptionBlock>
      ))}
    </>
  );
};

export default SettingsList;
