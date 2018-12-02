import React from 'react';

import Screen from './Components/Screen';

import { Context } from './Context';
import { tick, handleKeys, initialState } from './Helpers';
import { AppSC } from './Components/StyledComponents';

import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = initialState();
  }

  componentDidMount() {
    this.ship = document.querySelector('.Ship');
    this.enemies = document.querySelectorAll('.Enemy');

    this.isPlaying = setInterval(this.tick, 50);

    window.addEventListener('keydown', this.handleKeys);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeys);
  }

  tick = () => {
    if (!this.state.isShipHit) {
      this.setState(() => tick(this));
    }
  };

  handleKeys = e => this.setState({ ...handleKeys(this.state, e) });

  render() {
    return (
      <Context.Provider value={this.state}>
        <AppSC>
          <Screen isShipHit={this.state.isShipHit} />
        </AppSC>
      </Context.Provider>
    );
  }
}

export default App;
