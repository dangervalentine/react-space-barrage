import React from 'react';

import { ShipSC, ShipContainerSC, FirePoseSC } from './StyledComponents';
import { decayVelocity, handleKeys } from '../Helpers';

class Ship extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			y: 100,
			x: 500,
			leftVelocity: 0,
			rightVelocity: 0,

			isVisible: true,
		};
	}

	handleKeys = e => {
		this.setState({ ...handleKeys(this.state, e) });
	};

	decayVelocity = () => {
		this.setState({ ...decayVelocity(this.state) });
	};

	componentDidMount() {
		setInterval(this.decayVelocity, 100);
		window.addEventListener('keydown', this.handleKeys.bind(this));

		setInterval(() => {
			this.setState({ isVisible: !this.state.isVisible });
		}, 200);
	}

	componentDidUpdate() {
		const ship = document.querySelector('.ship-container');
		ship.style.transform = `rotate(${(this.state.rightVelocity +
			this.state.leftVelocity) *
			2.5}deg)`;
	}

	render() {
		return (
			<ShipContainerSC
				style={{ left: this.state.x, bottom: this.state.y }}
				className="ship-container"
			>
				<ShipSC />
				<FirePoseSC pose={this.state.isVisible ? 'grow' : 'shrink'} />
			</ShipContainerSC>
		);
	}
}

export default Ship;
