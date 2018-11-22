import React from 'react';

import { EnemySC } from './StyledComponents';
import { withContext } from '../Context';

const Enemy = props => {
  const { speed, color, x, y } = props.context[`enemy${props.index}`];
  const position = { left: x, top: y };

  return <EnemySC speed={speed} color={color} style={position} />;
};

export default withContext(Enemy);
