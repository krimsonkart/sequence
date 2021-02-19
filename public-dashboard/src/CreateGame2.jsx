import { useHistory } from 'react-router';
import './Home.css';
import axios from 'axios';
import React from 'react';
import { Button, Form, Container, Row, Col, FormLabel, FormCheck } from 'react-bootstrap';
import useLogin from './useLogin';
import Login from './Login';
const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL;

const Home = () => {
    const { userName, userId } = useLogin();
    let history = useHistory();
    function userSet() {
        return !!userName;
    }

    const handleSubmit1 = event => {
        const form = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();
        console.log(`Posting request`);
        axios
            .post(
                `${SOCKET_SERVER_URL}api/sequence/game`,
                { game: { ...form, adminUser: userId } },
                { headers: { Accept: 'application/json' } }
            )
            .then(response => {
                const { gameId } = response;
                history.push(`/ui/sequence/${gameId}`);
            })
            .catch(error => {});
    };
    function handleSubmit(event) {
        event.preventDefault();
        const data = new FormData(event.target);

        fetch(`${SOCKET_SERVER_URL}api/sequence/game`, {
            method: 'POST',
            body: data,
        })
            .then(resp => resp.json())
            .then(resp => history.push(`/ui/sequence/${resp.gameId}`));
    }

    return userSet() ? (
        <Form onSubmit={handleSubmit}>
            <Container>
                <Row>
                    <Col>
                        <Form.Label htmlFor="numPlayers">Number of players</Form.Label>
                    </Col>
                    <Col>
                        <input id="numPlayers" name="numPlayers" type="text" value="2"/>
                    </Col>
                </Row>
                <Row className="align-items-start">
                    <Col>
                        <label htmlFor="numTeams">Number of teams</label>
                    </Col>
                    <Col>
                        <fieldset id="numTeams">
                            <input type="radio" name="numTeams" value="2" />2
                            <input type="radio" name="numTeams" value="3" />3
                        </fieldset>
                    </Col>
                </Row>
                <Row>
                    <button>Create</button>
                </Row>
            </Container>
        </Form>
    ) : (
        <Login />
    );
};

export default Home;
