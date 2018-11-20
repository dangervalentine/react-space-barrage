import React from 'react';

import { randomUpTo } from '../Helpers';
import { EnemySC } from './StyledComponents';

class Enemy extends React.Component {
  constructor(props) {
    super(props);
    this.state = { ...this.createState() };
  }

  createState = () => ({
    y: 0,
    color: randomUpTo(3),
    speed: randomUpTo(3) + 1,
    x: randomUpTo(10) * 100 - 100
  });

  componentDidMount() {
    setInterval(() => {
      const newY = this.state.y + this.state.speed * 10;
      this.setState({ y: newY });
    }, 50);
  }

  componentDidUpdate() {
    if (this.state.y > 1000) {
      this.setState({ ...this.createState() });
    }
  }

  render() {
    const { state } = this;
    const { sp, color, x, y } = state;
    const position = { left: x, top: y };

    return <EnemySC speed={sp} color={color} style={position} />;
  }
}

export default Enemy;
