import React from 'react';

import { ShipSC, ShipContainerSC, FirePoseSC } from './StyledComponents';
import { decayVelocity, handleKeys } from '../Helpers';

class Ship extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      x: 500,
      lVelocity: 0,
      rVelocity: 0,
      flame: true
    };
  }

  handleKeys = e => this.setState(state => ({ ...handleKeys(state, e) }));

  decayVelocity = () => this.setState(state => ({ ...decayVelocity(state) }));

  componentDidMount() {
    setInterval(this.decayVelocity, 50);
    window.addEventListener('keydown', this.handleKeys);
    setInterval(() => this.setState({ flame: !this.state.flame }), 200);
  }

  render() {
    const rotateDeg = this.state.rVelocity + this.state.lVelocity * 2.5;

    return (
      <ShipContainerSC style={{ left: this.state.x }} rotate={rotateDeg}>
        <ShipSC />
        <FirePoseSC pose={this.state.flame ? 'grow' : 'shrink'} />
      </ShipContainerSC>
    );
  }
}

export default Ship;
