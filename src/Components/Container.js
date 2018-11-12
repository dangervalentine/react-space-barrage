import React from 'react';

import { ContainerSC } from '../StyledComponents';
import Enemy from './Enemy';

import Ship from './Ship';

class Container extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <ContainerSC>
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Ship />
      </ContainerSC>
    );
  }
}
export default Container;
