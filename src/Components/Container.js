import React from "react";

import { ContainerSC } from "./StyledComponents";
import Enemy from "./Enemy";

import Ship from "./Ship";

class Container extends React.Component {
  constructor(props) {
    super(props);

    this.container = React.createRef();
    this.addStar = this.addStar.bind(this);
  }

  addStar(type) {
    var div = document.createElement("div");
    div.classList.add("star", type);
    div.style.left = Math.floor(Math.random() * window.innerWidth) + "px";

    const container = this.container;
    container.current.appendChild(div);
  }

  componentWillMount() {
    for (var i = 0; i < 20; ++i) {
      var delay = i * 333;
      window.setTimeout(this.addStar, delay, "small");
      window.setTimeout(this.addStar, delay + 333, "medium");
      window.setTimeout(this.addStar, delay + 666, "big");
    }
  }

  render() {
    return (
      <ContainerSC ref={this.container}>
        <div className="star small" />
        <div className="star medium" />
        <div className="star big" />
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Enemy />
        <Ship />
      </ContainerSC>
    );
  }
}
export default Container;
