import React from 'react';

import { ContainerSC } from './StyledComponents';
import { withContext } from '../Context';
import { createStars } from '../Helpers';

import Ship from './Ship';
import Enemy from './Enemy';
import GameOver from './GameOver';

class Container extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      gameOver: false,
    };
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.context.isShipHit && !this.state.gameOver) {
      this.setState({ gameOver: true });
      return true;
    }

    return false;
  }

  render() {
    const stars = createStars();

    return (
      <ContainerSC>
        {this.props.context.isShipHit && <GameOver />}
        {stars}
        <Enemy index={0} />
        <Enemy index={1} />
        <Enemy index={2} />
        <Enemy index={3} />
        <Enemy index={4} />
        <Enemy index={5} />
        <Enemy index={6} />
        <Enemy index={7} />
        <Ship />
      </ContainerSC>
    );
  }
}

export default withContext(Container);
