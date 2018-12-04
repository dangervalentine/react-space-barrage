import React from 'react';

import { ContainerSC } from './StyledComponents';
import { addStars, addEnemies } from '../Helpers';

import Ship from './Ship';
import Score from './Score';
import Guide from './Guide';

export default class Container extends React.Component {
  render() {
    const stars = addStars(10);
    const enemies = addEnemies(15);

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
