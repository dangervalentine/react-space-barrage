import React from 'react';

import { randomUpTo } from '../Helpers';
import { EnemySC } from './StyledComponents';

class Enemy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      y: 0,
      x: randomUpTo(10) * 100 - 100,
      color: randomUpTo(3),
      speed: randomUpTo(3) + 1
    };
  }

  componentDidMount() {
    setInterval(() => {
      const newY = this.state.y + this.state.speed * 10;
      this.setState({ y: newY });
    }, 50);
  }

  componentDidUpdate() {
    if (this.state.y > 1000) {
      const newX = randomUpTo(10) * 100;
      const newY = 0;
      const newColor = randomUpTo(3);
      const newSpeed = randomUpTo(3) + 1;
      this.setState({ x: newX, y: newY, color: newColor, speed: newSpeed });
    }
  }

  render() {
    const { state } = this;
    return (
      <EnemySC
        speed={state.sp}
        color={state.color}
        style={{ left: state.x, top: state.y }}
      />
    );
  }
}

export default Enemy;
