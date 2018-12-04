import styled, { keyframes } from 'styled-components';

import { randomUpTo } from '../../Helpers';

import enemy1 from '../../Assets/enemy1.svg';
import enemy2 from '../../Assets/enemy2.svg';
import enemy3 from '../../Assets/enemy3.svg';
import rocket from '../../Assets/rocket.svg';
import fire from '../../Assets/fire.svg';

const enemies = [enemy1, enemy2, enemy3];

export const AppSC = styled.div`
  height: 100%
  width: 100%;
  color: lime;
  margin: 50px 0px;
  display: flex;
  filter: blur(1px);
  position: relative;
  align-items: center;
  flex-direction: column;
`;

export const ScreenSC = styled.div`
  width: 1066px;
  height: 800px;
  overflow: hidden;
  text-align: center;
  border: 5px solid SlateGray;
  background: rgba(124, 252, 0, 0.02);
  border-radius: 120px 123px 123px 123px / 25px 25px 25px 25px;
  animation: ${() => linkShudder} 3s linear infinite;
`;

export const ContainerSC = styled.div`
  height: 100%;
  width: 100%;
  position: relative;
`;

export const GameOverSC = styled.div`
  top: 0;
  left: 0;
  z-index: 10;
  width: 100%;
  height: 100%;
  position: absolute;
  display: flex;
  font-size: 2rem;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  background: rgba(11, 11, 11, 1);
`;

export const EnemySC = styled.div`
  width: 80px;
  height: 80px;
  display: inline-block;
  background: url(${() => enemies[randomUpTo(2)]}) center;
  background-size: cover;
  position: absolute;
  left: 0px;
  top: -100px;
  animation: ${() => moveY};
  animation-duration: ${() => `${randomUpTo(8)}s`};
  animation-timing-function: linear;
  animation-iteration-count: infinite;
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
  background-color: Cyan;
  left: ${props => props.x}px;
  animation: ${() => moveY} ${props => props.sp}s linear
    ${props => `${props.delay}ms`} infinite normal;
`;

export const SmStarSC = styled(StarSC)`
  width: 1px;
  height: 1px;
`;

export const MdStarSC = styled(StarSC)`
  width: 2px;
  height: 2px;
`;

export const LgStarSC = styled(StarSC)`
  width: 3px;
  height: 3px;
`;

export const GuideSC = styled.div`
  z-index: 9;
  opacity: 1;
  bottom: 0;
  color: Cyan;
  width: 100%;
  margin-bottom: 20px;
  font-size: 0.7rem;
  position: absolute;
`;

export const KeycapSC = styled.span`
  padding: 5px;
  margin-left: 4px;
  margin-right: 4px;
  border-radius: 4px;
  line-height: 1.8em;
  color: MediumOrchid;
  background: transparent;
  border: 1px solid MediumOrchid;
`;

export const ScoreSC = styled.div`
  top: 0;
  left: 0;
  width: 50px;
  height: 50px;
  font-size: 2em;
  align-self: start;
  padding: 40px 30px;
  position: absolute;
  text-align: center;
`;

// Stars and Enemies will use this to go from end to end
// of the Container
const moveY = keyframes`
  0%    { transform: translateY(-100px);  }
  100%  { transform: translateY(950px);   }
`;

// A flicker effect for the rocket's flame
const flame = keyframes`
  0%   { transform: scaleY(1);   }
  50%  { transform: scaleY(0.8); }
`;

// The whole screen has this attached. To replicate a CRT TV screen
const linkShudder = keyframes`
  10%  {                                        filter:blur(0.5px); }
  15%  {                                        filter:blur(1px);   }
  20%  {                                        filter:blur(0.5px); }
  27%  { transform: translate(0px,0px);                             }
  28%  { transform: translate(1px,0px);                             }
  29%  { transform: translate(0px,0px);                             }
  35%  { transform: translate(0px,0px);                             }
  36%  { transform: translate(.5px,.5px);                           }
  37%  { transform: translate(0px,0px);                             }
  42%  { transform: translate(0px,0px);         filter:blur(0.5px); }
  43%  { transform: translate(0px,0.5px);       filter:blur(1px);   }
  44%  { transform: translate(0px,0px);         filter:blur(0.5px); }
  100% { transform: translate(0px,0px);                             }
`;
