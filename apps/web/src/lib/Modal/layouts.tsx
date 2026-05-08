// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { ButtonLarge } from '@src/styles/Buttons';

type ClassName = { className?: string };

/** Makes modal fullscreen by default */
export const FullScreen: React.FC<ClassName> = ({ className = '', children }) => (
  <div className={`p-8 h-screen w-screen overflow-auto ${className}`}>
    { children }
  </div >
);

type ConfirmProps = {
  question: string;
  onConfirm: () => void;
  onCancel: () => void;
};
export const Confirm: React.VFC<ConfirmProps> = ({
  question, onCancel, onConfirm,
}) => (
  <div className="p-12">
    <h3>{question}</h3>
    <div className="flex justify-center mt-12 ">
      <ButtonLarge
        className="p-3 mx-3 rounded-xl font-bold"
        onClick={onConfirm}>Yes</ButtonLarge>
      <ButtonLarge
        color="none"
        className="p-6 mx-3 rounded-xl font-bold"
        onClick={onCancel}>Cancel</ButtonLarge>
    </div>
  </div>
);
