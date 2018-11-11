import React, { Component } from 'react';

import Container from './Components/Container';
import { AppSC } from './StyledComponents';
import { KEYS } from './Resources';

import "./App.css";

class App extends Component {

    constructor(props) {
        super(props);
    }


    render() {
        return (
            <AppSC>
                <Container/>
            </AppSC>
        );
    }
}

export default App;