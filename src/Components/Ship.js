import React from 'react';

class Ship extends React.Component {

    render() {
        return (
            <div style={{left: this.props.ship.x, bottom: this.props.ship.y}} className="Ship"></div>
        )
    }
}

export default Ship;