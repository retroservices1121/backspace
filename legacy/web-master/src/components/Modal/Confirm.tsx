// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Row } from 'styles/Flex';
import { Button } from 'styles/form';
import { Space } from 'styles/layout';

import Modal from '../ModalV2';

type Props = {
  isOpen: boolean;
  onYes: () => void;
  onNo: () => void;
  message?: string;
  yesMessage?: string;
  noMessage?: string;
};

const Confirm: React.FC<Props> = ({
  isOpen, onYes, onNo,
  message = 'Are you sure?',
  yesMessage = 'Yes',
  noMessage = 'No',
}) => (
  <Modal
    open={isOpen}
    handleClose={onNo}
    shouldCloseOnOverlayClick={false}
  >
    <div className="px-12 pt-14">
      <Row $center>
        {message}
      </Row>
      <Row>
        <Button onClick={onYes}>{yesMessage}</Button>
        <Space/>
        <Button onClick={onNo}>{noMessage}</Button>
      </Row>
    </div>
  </Modal>
);
export default Confirm;
