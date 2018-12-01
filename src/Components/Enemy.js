import React from 'react';

import { EnemySC } from './StyledComponents';
import { withContext } from '../Context';

class Enemy extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    return <EnemySC className="Enemy" />;
  }
}

export default withContext(Enemy);
