import React from 'react';

import Container from './Components/Container';
import { AppSC } from './Components/StyledComponents';
import { Context } from './Context';

import { decayVelocity, handleKeys } from './Helpers';

import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      shipX: 500,
      rVelocity: 0,
      lVelocity: 0
    };

    this.update = (key, value) => {
      this.setState({ [key]: value });
    };
  }

  componentDidMount() {
    setInterval(this.decayVelocity, 50);
    window.addEventListener('keydown', this.handleKeys);
  }

  handleKeys = e => this.setState({ ...handleKeys(this.state, e) });

  decayVelocity = () => this.setState({ ...decayVelocity(this.state) });

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
