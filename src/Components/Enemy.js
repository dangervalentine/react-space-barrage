import React from 'react';

import { EnemySC } from './StyledComponents';

const randomEn = () => Math.floor(Math.random() * 3);

const Enemy = () => <EnemySC color={randomEn()} />;

export default Enemy;
