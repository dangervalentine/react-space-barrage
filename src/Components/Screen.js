import React from 'react';

import { ScreenSC } from './StyledComponents';

import Container from './Container';
import GameOver from './GameOver';

export default class Screen extends React.Component {
  shouldComponentUpdate({ isShipHit }) {
    if (isShipHit && !this.props.isShipHit) {
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
