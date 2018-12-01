import React from 'react';

import { EnemySC } from './StyledComponents';
import { withContext } from '../Context';

class Enemy extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <EnemySC onAnimationEnd={() => console.log('fffff')} className="Enemy" />
    );
  }
}

export default withContext(Enemy);
