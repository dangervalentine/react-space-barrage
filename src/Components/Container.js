import React from 'react';

import { ContainerSC } from '../StyledComponents';
import { EnemySC } from '../StyledComponents';

import Ship from './Ship';

const randomEn = () => Math.floor(Math.random() * 3);

class Container extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ContainerSC>
                <EnemySC color={randomEn()} />
                <EnemySC color={randomEn()} />
                <EnemySC color={randomEn()} />
                <EnemySC color={randomEn()} />
                <EnemySC color={randomEn()} />
                <EnemySC color={randomEn()} />
                <EnemySC color={randomEn()} />
                <EnemySC color={randomEn()} />
                <EnemySC color={randomEn()} />
                <EnemySC color={randomEn()} />
                <Ship />
            </ContainerSC>
        );
    }
}
export default Container;
