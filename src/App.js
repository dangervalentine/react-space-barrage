import React from 'react';

import Screen from './Components/Screen';

import { Provider } from './Context';
import { AppSC } from './Components/StyledComponents';
import { tick, handleKeys, initialState } from './Helpers';

import './App.css';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = initialState();
  }

  componentDidMount() {
    this.isPlaying = setInterval(this.tick, 50);
    this.enemies = document.querySelectorAll('.Enemy');
    window.addEventListener('keydown', this.handleKeys);
  }

  componentDidUpdate(a, { isShipHit }) {
    if (isShipHit) clearInterval(this.isPlaying);
  }

  tick = () => this.setState(() => tick(this));

  handleKeys = e => this.setState(() => handleKeys(this.state, e));

  render() {
    return (
      <Provider value={this.state}>
        <AppSC>
          <Screen isShipHit={this.state.isShipHit} />
        </AppSC>
      </Provider>
    );
  }
}
