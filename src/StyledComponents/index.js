import styled from 'styled-components';

import rocket from '../Assets/rocket.svg';

export const AppEl = styled.div`
    margin: 12vh;
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const ShipEl = styled.div`
    bottom: 0;
    left: 50%;
    width: 10vh;
    height: 10vh;
    position: absolute;
    transform: translate(-50%, 0%);
    background: url(${rocket});
`;

export const ContainerEl = styled.div`
    position: relative;
    width: 75vw;
    height: 75vh;
    background: black;
    opacity: 0.8;
    borderRadius: 1vh;
`;