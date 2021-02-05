import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import "./index.css";
import Home from "./Home";
import Login from "./Login";
import ChatRoom from "./ChatRoom";
import Sequence from "./SequenceV2";

function App() {
    return (
        <Router>
            <Switch>
                <Route exact path="/" component={Home} />
                <Route exact path="/rooms" component={Home} />
                <Route exact path="/:playerId/:gameId" component={Sequence} />
                <Route exact path="/chat/:playerId/:gameId" component={ChatRoom} />
            </Switch>
        </Router>
    );
}

export default App;