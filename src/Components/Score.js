import React from 'react';

import { withContext } from '../Context';
import { ScoreSC } from './StyledComponents';

export default withContext(props => <ScoreSC>{props.context.score}</ScoreSC>);
