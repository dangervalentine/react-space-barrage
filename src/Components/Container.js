import React from 'react';

import { createStars } from '../Helpers';
import { ContainerSC } from './StyledComponents';

import Ship from './Ship';

const Container = props => {
  const thisWidth = props.size.width;
  return (
    <ContainerSC>
      {createStars(thisWidth)}
      <Ship maxX={thisWidth} />
    </ContainerSC>
  );
};

export default Container;
