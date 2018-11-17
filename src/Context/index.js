import React from 'react';

const Context = React.createContext();

export class Provider extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    containerWidth: 0
  };

  updateValue = (key, value) => {
    this.setState({ [key]: value });
  };

  render() {
    return (
      <Context.Provider
        value={{
          state: { containerWidth: this.state.containerWidth },
          actions: { updateValue: this.updateValue }
        }}
      >
        {this.props.children}
      </Context.Provider>
    );
  }
}
export const Consumer = Context.Consumer;
