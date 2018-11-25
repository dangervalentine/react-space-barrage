import styled, { keyframes } from 'styled-components';

import rocket from '../../Assets/rocket.svg';
import fire from '../../Assets/fire.svg';
import a from '../../Assets/a.svg';
import b from '../../Assets/b.svg';
import c from '../../Assets/c.svg';
import { FirePose } from '../Posed';

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
  background: rgba(22, 11, 11, 0.4);
`;

export const EnemySC = styled.div`
  width: 80px;
  height: 80px;
  display: inline-block;
  background: ${props => `url(${enemies[props.color]})`} center;
  background-size: cover;
  position: absolute;
  left: 0px;
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

export const FirePoseSC = styled(FirePose)`
  width: 80px;
  height: 80px;
  margin-top: -3px;
  transform-origin: top;
  background-size: cover;
  transform: translate(50%);
  background-image: url(${fire});
`;

const StarSC = styled.div`
  top: -10px;
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

export const GuideSC = styled.div`
  opacity: 0.5;
  font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
  position: absolute;
  bottom: 10px;
  color: #cddcfe;
`;

export const KeycapSC = styled.span`
  border: 1px solid mediumorchid;
  border-radius: 4px;
  padding: 0px 3px 1px 3px;
  line-height: 1.8em;
  background: transparent;
  color: mediumorchid;
  margin-right: 4px;
  margin-left: 4px;
`;

export const ScoreSC = styled.div`
  height: 50px;
  width: 100px;
  background: rgba(22, 11, 11, 0.4);
  color: white;
  font-size: 2em;
  font-family: sans-serif;
  text-align: center;
  align-self: start;
`;

const moveX = keyframes`
  0% {
    transform: translateY(0px);
  }
  100% {
    transform: translateY(800px);
  }
`;
