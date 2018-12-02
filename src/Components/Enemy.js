import React from 'react';

import { EnemySC } from './StyledComponents';

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

export default Enemy;
