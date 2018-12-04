import React from 'react';
import { GuideSC, KeycapSC } from './StyledComponents';

export default () => (
  <GuideSC>
    <KeycapSC>A</KeycapSC>
    and
    {<KeycapSC>D</KeycapSC>}
    or
    {<KeycapSC>←</KeycapSC>}
    and
    {<KeycapSC>→</KeycapSC>}
  </GuideSC>
);
