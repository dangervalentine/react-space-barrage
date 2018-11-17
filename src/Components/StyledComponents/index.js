import styled, { keyframes } from 'styled-components';

import rocket from '../../Assets/rocket.svg';
import fire from '../../Assets/fire.svg';
import a from '../../Assets/a.svg';
import b from '../../Assets/b.svg';
import c from '../../Assets/c.svg';
import { FirePose } from '../Posed';

const enemies = [a, b, c];

export const AppSC = styled.div`
  margin: 10vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ContainerSC = styled.div`
  width: 80vh;
  height: 80vh;
  overflow: hidden;
  position: relative;
  border-radius: 3vh;
  background: rgba(22, 11, 11, 0.4);
`;

export const EnemySC = styled.div`
  width: 10%;
  height: 10%;
  display: inline-block;
  background-size: cover;
  background: ${props => `url(${enemies[props.color]})`} center;
`;

export const ShipContainerSC = styled.div`
  left: 50%;
  width: 10%;
  height: 10%;
  bottom: 10vh;
  position: absolute;
  transform: translate(-50%, 0%);
  transform: rotate(${props => props.rotate}deg);
`;

export const ShipSC = styled.div`
  z-index: 5;
  width: 100%;
  height: 100%;
  background: url(${rocket});
  background-size: cover;
`;

export const FirePoseSC = styled(FirePose)`
  width: 100%;
  height: 100%;
  margin-top: -0.15vh;
  transform-origin: top;
  background-size: cover;
  transform: translate(50%);
  background-image: url(${fire});
`;

const StarSC = styled.div`
  top: -2vh;
  z-index: -1;
  position: absolute;
  border-radius: 50%;
  background-color: white;
  left: ${props => props.x}px;
  animation: ${() => moveX} ${props => props.sp}s linear
    ${props => `${props.delay}ms`} infinite normal;
`;

export const SmStarSC = styled(StarSC)`
  width: 3px;
  height: 3px;
`;

export const MdStarSC = styled(StarSC)`
  width: 4px;
  height: 4px;
`;

export const LgStarSC = styled(StarSC)`
  width: 5px;
  height: 5px;
`;

export const moveX = keyframes`
  0% {
    transform: translateY(0vh);
  }
  100% {
    transform: translateY(80vh);
  }
`;
