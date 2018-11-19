import React from 'react';

import { ContainerSC } from './StyledComponents';
import { withContext } from '../Context';
import { createStars } from '../Helpers';

import Ship from './Ship';

class Container extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    const stars = createStars();
    return (
      <ContainerSC>
        {stars}
        <Ship />
      </ContainerSC>
    );
  }
}

export default withContext(Container);
