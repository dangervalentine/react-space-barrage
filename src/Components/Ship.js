import React from 'react';

import { ShipSC } from '../StyledComponents';
import { KEYS } from '../Resources';

class Ship extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            x: 0,
            y: 0
        };
    }

    handleKeys(value, e) {
        if (e.keyCode === KEYS.RIGHT || e.keyCode === KEYS.D) {
            const newX = this.state.x + 5;
            this.setState({ x: newX });
        }
        if (e.keyCode === KEYS.LEFT || e.keyCode === KEYS.A) {
            const newX = this.state.x - 5;
            this.setState({ x: newX });
        }
        if (e.keyCode === KEYS.UP || e.keyCode === KEYS.W) {
            const newY = this.state.y + 5;
            this.setState({ y: newY });
        }
        if (e.keyCode === KEYS.DOWN || e.keyCode === KEYS.S) {
            const newY = this.state.y - 5;
            this.setState({ y: newY });
        }
    }

    componentDidMount() {
        window.addEventListener('keyup', this.handleKeys.bind(this, false));
        window.addEventListener('keydown', this.handleKeys.bind(this, true));
    }

    componentWillUnmount() {
        window.removeEventListener('keyup', this.handleKeys);
        window.removeEventListener('keydown', this.handleKeys);
    }

    render() {
        return (
            <ShipSC
                style={{ left: this.state.x, bottom: this.state.y }}
                className="Ship"
            />
        );
    }
}

export default Ship;

// x needs to be its own property
// xVelocity as well
// location is a property of x + xVelocity
// xVelocity needs to peak at a certain point
// xVelocity needs to decrement over time
