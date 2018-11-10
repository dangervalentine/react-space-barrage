import React, { Component } from 'react';

import Container from './Components/Container';
import { AppEl } from './StyledComponents';
import { Provider } from './Context';
import { KEYS } from './Resources';

import "./App.css";

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            ship: {
                x: 500,
                y: 0
            }
        }
    }

    handleKeys(value, e){

        if (e.keyCode === KEYS.RIGHT  || e.keyCode === KEYS.D) {
            const newShip = {
                ...this.state.ship, 
                x: this.state.ship.x + 5
            };
            this.setState({ship: newShip});
        } 
        if (e.keyCode === KEYS.LEFT  || e.keyCode === KEYS.A) {
            const newShip = {
                ...this.state.ship, 
                x: this.state.ship.x - 5
            };
            this.setState({ship: newShip});
        } 
        if (e.keyCode === KEYS.UP  || e.keyCode === KEYS.W) {
            const newShip = {
                ...this.state.ship, 
                y: this.state.ship.y + 5
            };
            this.setState({ship: newShip});
        } 
        if (e.keyCode === KEYS.DOWN  || e.keyCode === KEYS.S) {
            const newShip = {
                ...this.state.ship, 
                y: this.state.ship.y - 5
            };
            this.setState({ship: newShip});
        } 
    }

    componentDidMount() {
        window.addEventListener('keyup',   this.handleKeys.bind(this, false));
        window.addEventListener('keydown', this.handleKeys.bind(this, true));
    }

    componentWillUnmount() {
        window.removeEventListener('keyup', this.handleKeys);
        window.removeEventListener('keydown', this.handleKeys);
      }
    
    render() {
        return (
            <Provider value={
                {
                    ship: this.state.ship
                }
            }>
                <AppEl>
                    <Container/>
                </AppEl>
            </Provider>
        );
    }
}

export default App;