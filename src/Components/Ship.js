import React from 'react';

import { ShipSC, ShipContainerSC, FireSC } from './StyledComponents';
import { withContext } from '../Context';

const Ship = props => {
  const { shipX, rVelocity, lVelocity } = props.context;
  const rotateDeg = (rVelocity + lVelocity) * 2.5;

  return (
    <ShipContainerSC style={{ left: shipX }} rotate={rotateDeg}>
      <ShipSC />
      <FireSC />
    </ShipContainerSC>
  );
};

export default withContext(Ship);
