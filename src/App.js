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
      enemy1: createEnemy(1),
      // enemy2: createEnemy(2),
      // enemy3: createEnemy(3),
      // enemy4: createEnemy(4),
      // enemy5: createEnemy(5),
    };
  }

  componentDidMount() {
    this.isPlaying = setInterval(this.tick, 50);
    window.addEventListener('keydown', this.handleKeys);
    this.enemies = document.querySelectorAll('.Enemy');
    console.log(this.enemies);
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
