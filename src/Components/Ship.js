import React from 'react';

import { ShipEl } from '../StyledComponents';
import { Consumer } from '../Context';



class Ship extends React.Component {

    render() {
        return (
            <Consumer>
                { ({ship}) => (
                    <ShipEl style={{left: ship.x, bottom: ship.y}} className="Ship"></ShipEl>
                )}
            </Consumer>
        )
    }
}

export default Ship;

// x needs to be its own property
// xVelocity as well
// location is a property of x + xVelocity
// xVelocity needs to peak at a certain point
// xVelocity needs to decrement over time