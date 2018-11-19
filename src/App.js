import React from 'react';
import { SizeMe } from 'react-sizeme';

import Container from './Components/Container';
import { AppSC } from './Components/StyledComponents';
import { Context } from './Context';

import { decayVelocity, handleKeys } from './Helpers';

import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      containerWidth: 0,
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
          <SizeMe>{({ size }) => <Container size={size} />}</SizeMe>
        </AppSC>
      </Context.Provider>
    );
  }
}

export default App;
