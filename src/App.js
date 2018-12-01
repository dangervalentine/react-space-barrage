import React from 'react';

import Guide from './Components/Guide';
import Container from './Components/Container';

import { Context } from './Context';
import { tick, handleKeys } from './Helpers';
import { AppSC } from './Components/StyledComponents';

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
          <Container />
          <Guide />
        </AppSC>
      </Context.Provider>
    );
  }
}

export default App;
