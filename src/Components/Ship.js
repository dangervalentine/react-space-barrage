import React from 'react';

import { ShipSC, ShipContainerSC, FireSC } from './StyledComponents';
import { withContext } from '../Context';

export default withContext(
  React.memo(props => {
    const { shipX, rVelocity, lVelocity } = props.context;
    const rotate = (rVelocity + lVelocity) * 2.5;

    return (
      <ShipContainerSC style={{ left: shipX }} rotate={rotate} className="Ship">
        <ShipSC />
        <FireSC />
      </ShipContainerSC>
    );
  }),
);
