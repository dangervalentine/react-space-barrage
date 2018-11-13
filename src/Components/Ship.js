import React from "react";
import posed from "react-pose";

import { decayVelocity, handleKeys } from "../Helpers";

const ShipPose = posed.div({
  grow: {
    scale: 1.05,
    transition: {
      default: { ease: "easeOut", duration: 400 }
    }
  },
  shrink: {
    scale: 1,
    transition: {
      default: { ease: "easeOut", duration: 400 }
    }
  }
});

class Ship extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      y: 100,
      x: 500,
      upVelocity: 0,
      leftVelocity: 0,
      downVelocity: 0,
      rightVelocity: 0,

      isVisible: true
    };

    this.handleKeys = this.handleKeys.bind(this);
    this.decayVelocity = this.decayVelocity.bind(this);
  }

  handleKeys(e) {
    this.setState({ ...handleKeys(this.state, e) });
  }

  decayVelocity() {
    this.setState({ ...decayVelocity(this.state) });
  }

  componentDidMount() {
    setInterval(this.decayVelocity, 100);
    window.addEventListener("keydown", this.handleKeys.bind(this));

    // setInterval(() => {
    //   this.setState({ isVisible: !this.state.isVisible });
    // }, 400);
  }
  componentDidUpdate() {
    const ship = document.querySelector(".ship-container");
    ship.style.transform = `rotate(${(this.state.rightVelocity +
      this.state.leftVelocity) *
      2.5}deg)`;
  }

  render() {
    return (
      <div 
        className="ship-container"
        style={{ left: this.state.x, bottom: this.state.y }}
      >
        <ShipPose
          className="ship"
          />
          <div className="box"></div>
      </div>
    );
  }
}

export default Ship;
