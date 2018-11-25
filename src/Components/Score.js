import React from 'react';

import { withContext } from '../Context';
import { ScoreSC } from './StyledComponents';

const Score = props => <ScoreSC>{props.context.score}</ScoreSC>;

export default withContext(Score);
