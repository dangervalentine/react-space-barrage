import React from 'react';

import { ContainerSC } from './StyledComponents';
import { createStars, createEnemies } from '../Helpers';

import Ship from './Ship';
import Score from './Score';
import Guide from './Guide';

class Container extends React.Component {
  render() {
    const stars = createStars(10);
    const enemies = createEnemies(10);

    return (
      <ContainerSC>
        <Score />
        {stars}
        {enemies}
        <Ship />
        <Guide />
      </ContainerSC>
    );
  }
}

export default Container;
