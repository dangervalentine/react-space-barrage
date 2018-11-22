import React from 'react';

import Container from './Components/Container';
import { AppSC } from './Components/StyledComponents';
import { Context } from './Context';

import { tick, handleKeys, recreateEnemy } from './Helpers';

import './App.css';
import Enemy from './Components/Enemy';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      shipX: 500,
      rVelocity: 0,
      lVelocity: 0,
      enemy1: { ...recreateEnemy() },
      enemy2: { ...recreateEnemy() },
      enemy3: { ...recreateEnemy() },
      enemy4: { ...recreateEnemy() },
      enemy5: { ...recreateEnemy() }
    };

    // for (let i = 1; i <= 10; i++) {
    //   this.state.enemies.push({ ...Enemy.createState() });
    // }

    this.update = (key, value) => {
      this.setState({ [key]: value });
    };
  }

  componentDidMount() {
    setInterval(this.tick, 50);
    window.addEventListener('keydown', this.handleKeys);
  }

  tick = () => this.setState(state => tick(state));

  handleKeys = e => this.setState({ ...handleKeys(this.state, e) });

  render() {
    const { update, state } = this;
    return (
      <Context.Provider value={{ state, update }}>
        <AppSC>
          <Container />}
        </AppSC>
      </Context.Provider>
    );
  }
}

export default App;
