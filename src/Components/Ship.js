import React from 'react';

import { ShipSC, ShipContainerSC, FirePoseSC } from './StyledComponents';
import { withContext } from '../Context';

class Ship extends React.Component {
  constructor(props) {
    super(props);
  }

  // componentDidMount() {
  //   setInterval(() => this.setState({ flame: !this.state.flame }), 200);
  // }

  render() {
    const { shipX, rVelocity, lVelocity } = this.props.context;
    const rotateDeg = (rVelocity + lVelocity) * 2.5;
    return (
      <ShipContainerSC style={{ left: shipX }} rotate={rotateDeg}>
        <ShipSC />
        <FirePoseSC />
      </ShipContainerSC>
    );
  }
}

export default withContext(Ship);
