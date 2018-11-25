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
      shipX: 500,
      rVelocity: 0,
      lVelocity: 0,
      isShipHit: false,
      enemy1: createEnemy(),
      enemy2: createEnemy(),
      enemy3: createEnemy(),
      enemy4: createEnemy(),
      enemy5: createEnemy()
    };
  }

  componentDidMount() {
    setInterval(this.tick, 50);
    window.addEventListener('keydown', this.handleKeys);
  }

  tick = () => this.setState(state => tick(state));

  handleKeys = e => this.setState({ ...handleKeys(this.state, e) });

  render() {
    return (
      <Context.Provider value={this.state}>
        <AppSC>
          <Container />
          <Score />
          <Guide />
        </AppSC>
      </Context.Provider>
    );
  }
}

export default App;
