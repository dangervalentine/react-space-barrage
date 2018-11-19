import React from 'react';

import { ContainerSC } from './StyledComponents';
import { withContext } from '../Context';
import { createStars, createEnemies } from '../Helpers';

import Ship from './Ship';

class Container extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    const stars = createStars();
    const enemies = createEnemies();
    return (
      <ContainerSC>
        {stars}
        {enemies}
        <Ship />
      </ContainerSC>
    );
  }
}

export default withContext(Container);
