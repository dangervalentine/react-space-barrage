import React from 'react';

import { ContainerSC } from './StyledComponents';
import { withContext } from '../Context';
import { createStars } from '../Helpers';

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
        <Enemy index={1} />
        <Enemy index={2} />
        <Enemy index={3} />
        <Enemy index={4} />
        <Enemy index={5} />
        <Ship />
      </ContainerSC>
    );
  }
}

export default withContext(Container);
