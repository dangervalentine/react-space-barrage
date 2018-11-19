import React from 'react';

import { ContainerSC } from './StyledComponents';
import { withContext } from '../Context';
import { createStars } from '../Helpers';

import Ship from './Ship';

class Container extends React.Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.size.width === this.props.size.width ? false : true;
  }

  componentDidUpdate() {
    this.props.context.update('containerWidth', this.props.size.width);
  }

  render() {
    const thisWidth = this.props.size.width;
    const stars = createStars(thisWidth);
    return (
      <ContainerSC>
        {stars}
        <Ship maxX={thisWidth} />
      </ContainerSC>
    );
  }
}

export default withContext(Container);
