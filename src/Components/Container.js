import React from 'react';

import { ContainerSC, SmStarSC, MdStarSC, LgStarSC } from './StyledComponents';

import Ship from './Ship';

const Container = props => {
  const stars = [];
  const random = () => Math.floor(Math.random() * window.innerWidth);
  const rDelay = () => 0 - Math.floor(Math.random() * 1200) / 100;

  for (var i = 0; i < 20; ++i) {
    stars.push(
      <SmStarSC key={'a' + i} x={random()} sp={9} delay={rDelay()} />,
      <MdStarSC key={'b' + i} x={random()} sp={7} delay={rDelay()} />,
      <LgStarSC key={'c' + i} x={random()} sp={5} delay={rDelay()} />
    );
  }

  return (
    <ContainerSC>
      {stars}
      <Ship />
    </ContainerSC>
  );
};

export default Container;
