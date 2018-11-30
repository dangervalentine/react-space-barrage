import styled, { keyframes } from 'styled-components';

import rocket from '../../Assets/rocket.svg';
import fire from '../../Assets/fire.svg';
import a from '../../Assets/a.svg';
import b from '../../Assets/b.svg';
import c from '../../Assets/c.svg';

const enemies = [a, b, c];

export const AppSC = styled.div`
  margin: 50px;
  display: flex;
  align-items: center;
  flex-direction: column;
`;

export const ContainerSC = styled.div`
  width: 800px;
  height: 800px;
  overflow: hidden;
  position: relative;
  border-radius: 8px;
  background: rgba(11, 11, 11, 0.4);
`;

export const EnemySC = styled.div`
  width: 80px;
  height: 80px;
  display: inline-block;
  background: ${props => `url(${enemies[props.color]})`} center;
  background-size: cover;
  position: absolute;
  left: 0px;
  animation: ${() => moveY} ${props => props.speed}s linear infinite;
`;

export const ShipContainerSC = styled.div`
  left: 50%;
  width: 80px;
  height: 80px;
  bottom: 80px;
  position: absolute;
  transform: translate(-50%, 0%);
  transform: rotate(${props => props.rotate}deg);
`;

export const ShipSC = styled.div`
  z-index: 5;
  width: 80px;
  height: 80px;
  background: url(${rocket});
  background-size: cover;
`;

export const FireSC = styled.div`
  width: 80px;
  height: 80px;
  margin-top: -3px;
  transform-origin: top;
  background-size: cover;
  background-image: url(${fire});
  animation: ${() => flame} 400ms linear 0ms infinite normal;
`;

const StarSC = styled.div`
  top: -10px;
  z-index: -1;
  position: absolute;
  background-color: white;
  left: ${props => props.x}px;
  animation: ${() => moveY} ${props => props.sp}s linear
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

export const GuideSC = styled.div`
  opacity: 0.5;
  position: absolute;
  bottom: 10px;
  font-size: 0.7rem;
`;

export const KeycapSC = styled.span`
  border: 1px solid mediumorchid;
  border-radius: 4px;
  padding: 5px;
  line-height: 1.8em;
  background: transparent;
  color: mediumorchid;
  margin-right: 4px;
  margin-left: 4px;
`;

export const ScoreSC = styled.div`
  height: 50px;
  width: 100px;
  background: rgba(11, 11, 11, 0.4);
  font-size: 2em;
  text-align: center;
  align-self: start;
`;

export const GameOverSC = styled.div`
  top: 0;
  left: 0;
  z-index: 10;
  width: 100%;
  height: 100%;
  position: absolute;
  background: rgba(11, 11, 11, 1);
`;

const moveY = keyframes`
  0% {
    transform: translateY(0px);
  }
  100% {
    transform: translateY(820px);
  }
`;

const flame = keyframes`
0% {
  transform: scaleY(1);
}
50% {
  transform: scaleY(0.8);
}
`;
