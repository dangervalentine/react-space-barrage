import React from 'react';

import { ContainerSC, ScreenSC } from './StyledComponents';
import { withContext } from '../Context';
import { createStars, createEnemies } from '../Helpers';

import Ship from './Ship';
import Score from './Score';
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
    const stars = createStars(10);
    const enemies = createEnemies(10);

    return (
      <ScreenSC>
        <ContainerSC>
          <Score />
          {this.props.context.isShipHit && <GameOver />}
          {stars}
          {enemies}
          <Ship />
        </ContainerSC>
      </ScreenSC>
    );
  }
}

export default withContext(Container);
