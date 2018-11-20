import React from 'react';

import { ContainerSC } from './StyledComponents';
import { withContext } from '../Context';
import { createStars, createEnemies } from '../Helpers';

import Ship from './Ship';
import Enemy from './Enemy';

class Container extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    const stars = createStars();
    return (
      <ContainerSC>
        {stars}
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Ship />
      </ContainerSC>
    );
  }
}

export default withContext(Container);
