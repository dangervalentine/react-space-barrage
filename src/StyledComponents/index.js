import styled from 'styled-components';

import a from '../Assets/a.svg';
import b from '../Assets/b.svg';
import c from '../Assets/c.svg';

const enemies = [a, b, c];

export const AppSC = styled.div`
  margin: 12vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const ContainerSC = styled.div`
  position: relative;
  width: 80vh;
  height: 80vh;
  background: rgba(22, 11, 11, 0.8);
  borderradius: 1vh;
`;

export const EnemySC = styled.div`
  width: 10%;
  height: 10%;
  display: inline-block;
  background: ${props => `url(${enemies[props.color]})`} center;
  background-size: cover;
`;

// background: ${`url(${fire}) center`};
