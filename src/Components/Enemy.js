import React from 'react';

import { EnemySC } from './StyledComponents';

const randomEn = () => Math.floor(Math.random() * 3);

class Enemy extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <EnemySC color={randomEn()} />;
  }
}

export default Enemy;
