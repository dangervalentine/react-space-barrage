import React from 'react';

import { ContainerSC } from './StyledComponents';
import { withContext } from '../Context';
import { createStars } from '../Helpers';

import Ship from './Ship';
import Enemy from './Enemy';
import GameOver from './GameOver';

class Container extends React.Component {
  shouldComponentUpdate() {
    if (this.props.context.isShipHit) {
      return true;
    }
    return false;
  }

  render() {
    const stars = createStars();
    return (
      <ContainerSC>
        {this.props.context.isShipHit && <GameOver />}
        <React.Fragment>
          {stars}
          <Enemy index={1} />
          <Enemy index={2} />
          <Enemy index={3} />
          <Enemy index={4} />
          <Enemy index={5} />
          <Ship />
        </React.Fragment>
      </ContainerSC>
    );
  }
}

export default withContext(Container);
