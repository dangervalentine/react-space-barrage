import React from 'react';
import { SizeMe } from 'react-sizeme';

import Container from './Components/Container';
import { AppSC } from './Components/StyledComponents';

import './App.css';

const App = () => (
  <AppSC>
    <SizeMe>{({ size }) => <Container size={size} />}</SizeMe>
  </AppSC>
);

export default App;
