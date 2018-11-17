import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from './Context';
import App from './App.js';

ReactDOM.render(
  <Provider>
    <App />
  </Provider>,
  document.getElementById('root')
);
