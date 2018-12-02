import React from 'react';

const Context = React.createContext();

export const Provider = Context.Provider;

export const withContext = Component => {
  return props => (
    <Context.Consumer>
      {context => <Component {...props} context={context} />}
    </Context.Consumer>
  );
};
