import React from 'react';

import { Context } from './Context';
import Score from './Components/Score';
import Guide from './Components/Guide';
import Container from './Components/Container';
import { AppSC } from './Components/StyledComponents';

import { tick, handleKeys, createEnemy } from './Helpers';

import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      score: 0,
      shipX: 400,
      rVelocity: 0,
      lVelocity: 0,
      isShipHit: false,
      enemy0: createEnemy(1),
      enemy1: createEnemy(2),
      enemy2: createEnemy(3),
      enemy3: createEnemy(4),
      enemy4: createEnemy(5),
      enemy5: createEnemy(6),
      enemy6: createEnemy(7),
      enemy7: createEnemy(8),
    };
  }

  componentDidMount() {
    this.ship = document.querySelector('.Ship');
    this.isPlaying = setInterval(this.tick, 50);
    this.enemies = document.querySelectorAll('.Enemy');
    window.addEventListener('keydown', this.handleKeys);
  }

  tick = () => {
    if (!this.state.isShipHit) {
      this.setState(() => tick(this));
    } else {
      clearInterval(this.isPlaying);
      window.removeEventListener('keydown', this.handleKeys);
    }
  };

  handleKeys = e => this.setState({ ...handleKeys(this.state, e) });

  render() {
    return (
      <Context.Provider value={this.state}>
        <AppSC>
          <Score />
          <Container />
          <Guide />
        </AppSC>
      </Context.Provider>
    );
  }
}

export default App;
