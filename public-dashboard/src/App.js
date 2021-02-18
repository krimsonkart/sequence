import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { connect } from 'react-redux';
import './index.css';
import Home from './Home';
import CreateGame from './CreateGame';
import ChatRoom from './ChatRoom';
import Sequence from './SequenceV2';
import { getStore } from './utils';
import { ActionCreators } from './redux/reducers/user';
import React from 'react';

class App extends React.Component {
    componentDidMount() {
        const user = getStore('user');
        if (user) {
            this.props.dispatch(ActionCreators.login(user));
        }
    }

    render() {
        return (
            <Router>
                <Switch>
                    <Route exact path="/" component={Home} />
                    <Route exact path="/ui/sequencerooms" component={Home} />
                    <Route exact path="/ui/sequence/game/:gameId" component={Sequence} />
                    <Route exact path="/ui/sequence/create" component={CreateGame} />
                    <Route exact path="/ui/chat" component={ChatRoom} />
                </Switch>
            </Router>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        user: state.user
    }
}

export default connect(mapStateToProps)(App);
