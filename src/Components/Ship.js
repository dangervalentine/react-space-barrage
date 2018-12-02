import React from 'react';

import { ShipSC, ShipContainerSC, FireSC } from './StyledComponents';
import { withContext } from '../Context';

const Ship = React.memo(props => {
  const { shipX, rVelocity, lVelocity } = props.context;
  const rotateDeg = (rVelocity + lVelocity) * 2.5;

  return (
    <ShipContainerSC
      style={{ left: shipX }}
      rotate={rotateDeg}
      className="Ship"
    >
      <ShipSC />
      <FireSC />
    </ShipContainerSC>
  );
});

export default withContext(Ship);
