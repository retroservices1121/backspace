// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { OldCol } from 'styles/Flex';
import { Icon } from 'styles/Globals';

import { Settings, Tabs } from './common';
import { OptionBlock, OptionHeader } from './styled';

type Props = {
  activeTab: Tabs,
  setActive: (value: Tabs) => void,
};

const SettingsList: React.FC<Props> = ({ activeTab, setActive }) => {
  const list = [Tabs.Account, Tabs.Notifications, Tabs.Security,  Tabs.Appearance, Tabs.Billing, Tabs.Creator, Tabs.Wallet];

  const generateSettingsOptions = () => {
    return list.map((value) => {
      const myIcon = Settings[value].icon;
      const myIconFill = Settings[value].iconFill;
      return (
        <OptionBlock as={OldCol} active={activeTab === Tabs[value]} onClick={() => setActive(Tabs[value])}>
          <OptionHeader>
            <Icon $solid={myIconFill} as={myIcon} $color={activeTab === Tabs[value] ? 'white' : 'primary'}/> <h4>{value}</h4>
          </OptionHeader>
          <h5>{Settings[value].description}</h5>
        </OptionBlock>
      );
    });
  };

  return (
    <>
      {generateSettingsOptions()}
    </>
  );
};
export default SettingsList;
