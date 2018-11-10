import React from 'react';

import { ContainerEl } from '../StyledComponents';
import { EnemyEl } from '../StyledComponents';

import Ship from './Ship';

class Container extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <ContainerEl className="Container">
        <EnemyEl color={0} />
        <EnemyEl color={1} />
        <EnemyEl color={2} />
        <EnemyEl color={0} />
        <EnemyEl color={1} />
        <EnemyEl color={2} />
        <EnemyEl color={0} />
        <EnemyEl color={1} />
        <EnemyEl color={2} />
        <EnemyEl color={0} />
        <Ship />
      </ContainerEl>
    );
  }
}
export default Container;
