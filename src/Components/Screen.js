import React from 'react';

import { ScreenSC } from './StyledComponents';

import Container from './Container';
import GameOver from './GameOver';

class Screen extends React.Component {
  shouldComponentUpdate(nextProps) {
    if (nextProps.isShipHit && !this.props.isShipHit) {
      return true;
    }
    return false;
  }

  render() {
    return (
      <ScreenSC>
        {this.props.isShipHit && <GameOver />}
        <Container />
      </ScreenSC>
    );
  }
}

export default Screen;
