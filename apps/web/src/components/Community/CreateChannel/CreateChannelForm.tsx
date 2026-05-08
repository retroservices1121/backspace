// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useState } from 'react';
import { toast } from 'react-toastify';
import { ChannelType, Permissions } from '@prisma/client';
import { CreateChannelBody } from '@src/types/requests/community';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import FormInput, { ErrorMessage } from 'components/FormInput';
import Modal from 'components/ModalV2';
import Icons from 'icons';
import { ButtonLarge } from 'styles/Buttons';
import { FlexSpaceEvenly, OldCol } from 'styles/Flex';
import { Space } from 'styles/layout';
import { ChannelTypeProperties, NewChannelFields, NewChannelState } from 'types/channel';
import { FormType, Input } from 'types/forms';
import { FormDebug } from 'utils/FormDebug';

import { getChannelIcon } from '../ChannelItem/ChannelItem';
import PermissionsButton from './PermissionsButton';
import { ChannelOption } from './styled';

const NewChannelSchema = Yup.object().shape({
  [NewChannelFields.Name]: Yup.string()
    .min(1, 'is too short')
    .max(50, 'is too long')
    .required('is required'),
  [NewChannelFields.Description]: Yup.string()
    .max(500, 'is too long'),
  [NewChannelFields.Read]: Yup.string()
    .required(),
  [NewChannelFields.Write]: Yup.string()
    .required('is required'),
  //FIXME put this back in later
  // .test({
  //   name: 'Ensure posters are higher value than viewers',
  //   message: 'Post level must be equal or higher than viewer level.',
  //   test: (value, context) => {
  //     const access = context.parent[NewChannelFields.Read];
  //     return (value !== undefined && access <= value) || false;
  //   },
  // }),
});

const SelectChannelType: Input<ChannelType> = ({
  field: { name, value },
  form: { setFieldValue },
}) => {
  const clickHandler = (key : ChannelType) => {
    if (ChannelTypeProperties[key]?.active) {
      setFieldValue(name, key);
    } else {
      toast.info('That Room Type is not currently available');
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 w-full mx-auto">
      {Object.values(ChannelType).map((key) => (
        <div className="w-80 sm:w-64 mx-auto">
        <OldCol as={ChannelOption} selected={value === key} onClick={() => clickHandler(key)}>
        <div className="flex">
          {getChannelIcon(key)}
          <div className="w-6" />
          {ChannelTypeProperties[key]?.name}
          <div className="ml-auto" />
          {value === key && (
            <Icons.Plus color='primary' />
          )}
        </div>
        <h6>{ChannelTypeProperties[key]?.description}</h6>
      </OldCol>
    </div>
      ))}
    </div>
  );
};

const INITIAL_STATE: CreateChannelBody = {
  [NewChannelFields.Type]: ChannelType.CHAT,
  [NewChannelFields.Name]: '',
  [NewChannelFields.Description]: '',
  [NewChannelFields.Read]: Permissions.EVERYONE,
  [NewChannelFields.Write]: Permissions.MEMBER,
};

type Props = {
  onCancel: () => void;
  onDelete?: () => void;
  state?: NewChannelState;
  canChangeType?: boolean;
  isEdit?: boolean;
};

const CreateChannelForm: FormType<NewChannelState, Props> = ({
  onSubmit,
  onCancel,
  onDelete,
  state,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isEdit : boolean = state?.id ? true : false;
  return (
    <Formik<NewChannelState>
      onSubmit={onSubmit}
      initialValues={{
        ...INITIAL_STATE,
        ...state,
      }}
      enableReinitialize
      validationSchema={NewChannelSchema}
    >
      {({ values }) => (
        <Form>
        {onDelete && (
          <Modal
            /*
            message={`Are you sure you want to delete ${values.name}?`}
            isOpen={confirmOpen}
            yesMessage='Delete'
            noMessage='Cancel'
            onYes={() => {
              onDelete();
              setConfirmOpen(false);
            }}
            onNo={() => setConfirmOpen(false)}
            */
            open={confirmOpen}
            handleClose={() => setConfirmOpen(false)}
          >
            <>
              <p>Are you sure you want to delete {values.name}?</p>
              <p>FIXME: Ceate a delete button here</p>
            </>
          </Modal>
        )}
        <FormDebug name="CreateChannelForm" />
        <h3 className="text-center">Personalize your room</h3>
        <Field
          name={NewChannelFields.Name}
          placeholder='Name your Room'
          as={FormInput}
        />
        <ErrorMessage
          name={NewChannelFields.Name}
          render={msg => `Room name ${msg}`}
        />

        <Field
          name={NewChannelFields.Description}
          placeholder="Add a description"
          as={FormInput}
        />
        <ErrorMessage
          name={NewChannelFields.Description}
          render={msg => `Room description ${msg}`}
        />

        {/* https://linear.app/newsocial/issue/BS-602 */}
        {!state?.id && (
          <>
            <h3 className="text-center">Choose a room type</h3>
            <div className="flex">
              <Field
                name={NewChannelFields.Type}
                component={SelectChannelType}
              />
            </div>
          </>
        )}

        <br />

        <div className='row w-full flex-wrap sm:flex-nowrap justify-between'>
          <div className='col'>
            <h3>Who can view?</h3>
            <Field
              name={NewChannelFields.Read}
              component={PermissionsButton}
            />
          </div>
          <Space direction='column'/>
          <div className='col'>
            <h3>Who can post?</h3>
            <Field
              name={NewChannelFields.Write}
              component={PermissionsButton}
            />
            <ErrorMessage
              name={NewChannelFields.Write}
            />
          </div>
        </div>

        <Space size="lg" direction="column" />
        <FlexSpaceEvenly>
          {isEdit && (
            <ButtonLarge color='error' type='button' onClick={() => setConfirmOpen(true)}>Delete Room</ButtonLarge>
          )}
          <ButtonLarge color='none' type='button' onClick={onCancel} >Cancel</ButtonLarge>
          <ButtonLarge color='primary' type='submit' >Submit</ButtonLarge>
        </FlexSpaceEvenly>
        <Space size="sm" direction="column" />
      </Form>
      )}
    </Formik>
  );
};

export default CreateChannelForm;
