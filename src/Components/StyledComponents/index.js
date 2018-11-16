import styled, { keyframes } from 'styled-components';

import rocket from '../../Assets/rocket.svg';
import fire from '../../Assets/fire.svg';
import a from '../../Assets/a.svg';
import b from '../../Assets/b.svg';
import c from '../../Assets/c.svg';

import { FirePose } from '../Posed';

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
  background: rgba(22, 11, 11, 0.4);
  border-radius: 3vh;
  overflow: hidden;
`;

export const EnemySC = styled.div`
  width: 10%;
  height: 10%;
  display: inline-block;
  background: ${props => `url(${enemies[props.color]})`} center;
  background-size: cover;
`;

export const ShipSC = styled.div`
  height: 100%;
  width: 100%;
  background: url(${rocket});
  background-size: cover;
  z-index: 500;
`;

export const ShipContainerSC = styled.div`
  bottom: 10vh;
  left: 50%;
  width: 10%;
  height: 10%;
  position: absolute;
  transform: translate(-50%, 0%);
  transform: rotate(${props => props.rotate}deg);
`;

export const FirePoseSC = styled(FirePose)`
  height: 100%;
  width: 100%;
  margin-top: -0.15vh;
  background: url(${fire});
  background-size: cover;
  transform: translate(50%);
  transform-origin: top;
`;

const StarSC = styled.div`
  position: absolute;
  left: ${props => props.x}px;
  background-color: white;
  border-radius: 50%;
  z-index: -1;
  opacity: 0.5;
  top: -2vh;
  animation: ${() => moveX} ${props => props.sp}s linear
    ${props => `${props.delay}s`} infinite normal;
`;

export const SmStarSC = styled(StarSC)`
  width: 3px;
  height: 3px;
  background-color: gray;
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
