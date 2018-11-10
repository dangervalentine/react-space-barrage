import React from 'react';

import Ship from './Ship';

class Container extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="Container">
                <Ship ship={{...this.props.ship}}/>
            </div>
        );
    }
    
}
export default Container;