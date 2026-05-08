// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { Form } from 'formik';

import FormInput, { FormTextarea } from 'components/FormInput';
import { ReactComponent as EditIcon } from 'graphics/commonicons/edit.svg';
import { ReactComponent as Star } from 'graphics/commonicons/star.svg';
import { EditableField, EditableForm } from 'lib/formik';
import { TierDocument, WithId } from 'shared/types/documents';
import { updateTier, updateTierPrice } from 'store/communitySlice';
import { EditButton } from 'styles/Buttons';
import { Col, Flex, FlexSpaceBetween } from 'styles/Flex';
import { Icon } from 'styles/Globals';
import { Space } from 'styles/layout';
import { Price } from 'styles/text';
import { OnSubmit } from 'types/forms';

import { Container, Perks } from './styled';


function perkIcon(name: string): React.FunctionComponent {
  if (name === 'typescript shut up, I\'ll use `name` later.') {}
  // TODO switch
  return Star;
}

enum TiersFields {
  title = 'title',
  price = 'price',
  description = 'description',
}

type TierProps = {
  initialValues: WithId<TierDocument>;
};

const Tier: React.FC<TierProps> = ({ initialValues }) => {
  const dispatch = useDispatch();
  // const [confirmationIsOpen, setConfirmationOpen] = useState(false);
  const handleSubmit: OnSubmit<WithId<TierDocument>> = (formState) => {
    if (formState.price < 1) {
      toast.error('Price must be at least $1.00');
      return;
    }
    if (initialValues.price != formState.price) {
      dispatch(updateTierPrice(formState));
    } else {
      dispatch(updateTier(formState));
    }

  };

  // const handleDelete = () => {
  //   setConfirmationOpen(false);
  //   dispatch(deleteTier(formState));
  //   toast.info('Deleted Tier');
  // };

  // const handleCancel = () => {
  //   setConfirmationOpen(false);
  //   toast.info('Cancelled Tier Delete');
  // };

  // const confirmDelete = () => {
  //   setConfirmationOpen(true);
  // };

  return (
    <>
      {/* <Confirm
        message="Are you sure you want to delete this tier?"
        noMessage="Cancel"
        isOpen={confirmationIsOpen}
        onNo={handleCancel}
        onYes={handleDelete}
      /> */}
      <Container>
        <EditableForm<WithId<TierDocument>>
          onSubmit={handleSubmit}
          initialValues={initialValues}
        >
          {({ setEditable, values }) => (
            <Form>
              <FlexSpaceBetween>
                <EditableField
                  name={TiersFields.title}
                  as={FormInput}
                  displayAs="h2"
                />

                <Flex>
                  <EditableField
                    name={TiersFields.price}
                    as={FormInput}
                    displayAs={Price}
                    styles={{ display: 'inline' }}
                  />
                  <Space size='sm'/>
                  <Col>
                    <EditButton
                      type="button"
                      onClick={() => setEditable(canEdit => !canEdit)}
                      tabIndex={-1}
                    >
                      <Icon $solid as={EditIcon} />
                      <Space size='sm'/>
                      {values._editable ? 'Save' : 'Edit Tier'}
                    </EditButton>
                    {/* <Space direction='column' size='sm' />
                    {values._editable && <SmallTextButton
                      type="button"
                      onClick={confirmDelete}
                      tabIndex={-1}
                      color='error'
                    >
                      Delete Tier
                    </SmallTextButton>} */}
                  </Col>

                </Flex>
              </FlexSpaceBetween>

              <EditableField displayAs="p" name={TiersFields.description} as={FormTextarea}/>

              <Perks>
                {values.perks?.map(perk => (
                  <Flex>
                    <Icon as={perkIcon(perk.icon)}/>
                    {perk.text}
                  </Flex>
                ))}
              </Perks>
            </Form>
          )}
        </EditableForm>
      </Container>
    </>
  );
};
export default Tier;
