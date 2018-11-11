import React, { Component } from 'react';

import Container from './Components/Container';
import { AppSC } from './StyledComponents';
import { Provider } from './Context';
import { KEYS } from './Resources';

import "./App.css";

class App extends Component {

    constructor(props) {
        super(props);
    }


    render() {
        return (
            <Provider>
                <AppSC>
                    <Container/>
                </AppSC>
            </Provider>
        );
    }
}

export default App;