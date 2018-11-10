import React from 'react';

import { ContainerEl } from '../StyledComponents';

import Ship from './Ship';

class Container extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ContainerEl className="Container">
                <Ship/>
            </ContainerEl>
        );
    }
    
}
export default Container;