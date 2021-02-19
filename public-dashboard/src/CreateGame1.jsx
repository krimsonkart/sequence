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
        <Form>
            <Form.Group controlId="numPlayers">
                <Form.Label>Number of Players</Form.Label>
                <Form.Control type="number" placeholder="2" />
            </Form.Group>
            <fieldset>
                <Form.Group as={Row}>
                    <Form.Label as="legend" column sm={2}>
                        Number of teams
                    </Form.Label>
                    <Col sm={10}>
                        <Form.Check
                            type="radio"
                            label="2"
                            name="numTeams"
                            id="numPlayers2"
                        />
                        <Form.Check
                            type="radio"
                            label="3"
                            name="numTeams"
                            id="numPlayers3"
                        />
                    </Col>
                </Form.Group>
            </fieldset>
        </Form>
    ) : (
        <Login />
    );
};

export default Home;
