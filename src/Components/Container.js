import React from 'react';
import { withSize } from 'react-sizeme';

import { ContainerSC, SmStarSC, MdStarSC, LgStarSC } from './StyledComponents';

import Ship from './Ship';

const withSizeHOC = withSize();

const Container = props => {
  const rX = () => Math.floor(Math.random() * props.size.width);
  const rDelay = () => 0 - Math.floor(Math.random() * 1200) / 100;

  const stars = [];
  for (var i = 0; i < 10; ++i) {
    stars.push(
      <SmStarSC key={'a' + i} x={rX()} sp={9} delay={rDelay()} />,
      <MdStarSC key={'b' + i} x={rX()} sp={7} delay={rDelay()} />,
      <LgStarSC key={'c' + i} x={rX()} sp={5} delay={rDelay()} />
    );
  }

  return (
    <ContainerSC>
      {stars}
      <Ship />
    </ContainerSC>
  );
};

export default withSizeHOC(Container);
