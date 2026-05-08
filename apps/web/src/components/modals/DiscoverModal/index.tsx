// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

export {};

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import Modal from 'components/ModalV2';
import { toggleDiscoverModal } from 'store/feedSlice';
import { RootState } from 'store/store';
import { ButtonLarge } from 'styles/Buttons';
import { FlexBreakRow, OldCol } from 'styles/Flex';
import { Categories, Subcategories } from 'types/feed';

import { FeedOptions, OptionTitle } from '../../Feed/styles';
import { InterestButton } from './styles';

type Props = {};

type Selection = {
  category: string,
  subcategory: string,
  selected: boolean
};

const DiscoverModal: React.FC<Props> = ({}) => {
  const dispatch = useDispatch();
  const [options, setOptions] = useState<Selection[]>([]);
  const { id } = useSelector((state : RootState) => state.user);
  const isOpen = useSelector((state : RootState) => state.feed.discoverModalOpen);

  // Build the list of options
  useEffect(() => {
    const tempArray : Selection[] = [];
    Object.values(Categories).map((category) => {
      Subcategories[category].map((sub) => {
        tempArray.push({
          category: category,
          subcategory: sub, 
          selected: false,
        });
      });
    });
    setOptions(tempArray);
  }, []);


  const handleOnClick = (index : number) => {
    let temp = [...options]; //Clone array so it rerenders
    console.log(temp[index]);
    temp[index].selected = !temp[index].selected;
    console.log(temp[index]);
    setOptions(temp);
  };

  const generateOptions = (list : Selection[]) => {

    let lastCategory : string = '';
    const newCategory = (current : string) => {
      if (current != lastCategory) {
        lastCategory = current;
        return (
          <>  
            <FlexBreakRow />
            <br />
            <OptionTitle key={current}>{current}</OptionTitle>
            <FlexBreakRow />
          </>

        );
      }
    };

    return list.map((element : Selection, index : number) => {
      return (
        <div key={`option-${index}-${element.subcategory}`}>
          {newCategory(element.category)}
          <InterestButton
            className="m-2 p-3 sm:p-4"
            color='backgroundLight'
            selected={element.selected}
            selectedColor='primary'
            onClick={() => handleOnClick(index)}>
            {element.subcategory}
          </InterestButton>
        </div>
      );
    });
  };

  const onSubmit = () => {
    const chosenOptions = options.filter((each) => each.selected);
    const stringList = chosenOptions.map((each) => each.subcategory);
    // FIXME https://linear.app/newsocial/issue/BS-613/discover-interests
    // if (stringList.length > 0) {
    //   updateUserInfo(id, { interests: stringList });
    // } else {
    //   toast.warn('You must select at least 1 interest');
    // }
    
    dispatch(toggleDiscoverModal(false));
  };

  return (
    <Modal 
      open={isOpen} 
      handleClose={() => dispatch(toggleDiscoverModal(false))}    
      // onRequestClose={() => dispatch(toggleDiscoverModal(false))}
      // shouldCloseOnOverlayClick={true}
      // style={{
      //   content:{
      //     display: 'flex',
      //     justifyContent:'center',
      //     alignItems:'center',
      //     margin: 'auto',
      //     height: 'fit-content',
      //     width: 'fit-content',
      //     padding: '20px',
      //   },
      // }}
      >
        <OldCol $center className="p-5">
          <h2>Your Interests</h2>
          <h4>What do you want to see more of?</h4>
          <br/>
          <FeedOptions $wrap>
            {generateOptions(options)}
          </FeedOptions>
          <br />
          <OldCol $center>
            <ButtonLarge color='primary' onClick={() => onSubmit()}>Submit Interests</ButtonLarge>
            <br />
            <ButtonLarge 
              color='none'
              onClick={() => dispatch(toggleDiscoverModal(false))}>
                Skip for now
            </ButtonLarge>
            <br />
          </OldCol>
          
        </OldCol>
      </Modal>
  );
};

export default DiscoverModal;


