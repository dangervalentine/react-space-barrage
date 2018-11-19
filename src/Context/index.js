import React from 'react';

export const Context = React.createContext();

export const withContext = Component => {
  return props => (
    <Context.Consumer>
      {context => <Component {...props} context={context} />}
    </Context.Consumer>
  );
};
