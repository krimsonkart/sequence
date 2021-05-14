import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router';
import './Home.css';
import axios from 'axios';
import { Button, Form, Container, Row, Col, FormLabel, FormCheck } from 'react-bootstrap';
import useLogin from './useLogin';
import Login from './Login';
const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL;

const Home = () => {
    const { userName, userId } = useLogin();
    const [name, setName] = useState('');
    const [numPlayers, setNumPlayers] = useState('2');
    const [numTeams, setNumTeams] = useState('2');
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
        // console.log(JSON.stringify(event.currentTarget));
        const data = new FormData(event.target);
        console.log(JSON.stringify(data));

        fetch(`${SOCKET_SERVER_URL}api/sequence/game`, {
            method: 'POST',
            body: data,
        })
            .then(resp => resp.json())
            .then(resp => history.push(`/ui/sequence/${resp.gameId}`));
    }

    function handleCreateGame() {
        let game = { name, numPlayers, numTeams, adminUser: userId, adminUserName: userName };
        fetch(`${SOCKET_SERVER_URL}api/sequence/game`, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({ game }),
        })
            .then(resp => resp.json())
            .then(resp => history.push(`/ui/sequence/game/${resp.gameId}`));
    }

    function handleNameChange(e) {
        setName(e.target.value);
    }

    function handleTeamsChange(e) {
        setNumTeams(e.target.value);
    }

    function handlePlayerChange(e) {
        setNumPlayers(e.target.value);
    }

    return userSet() ? (
        <Container>
            <Row>
                <Col>
                    <label>Name</label>
                </Col>
                <Col>
                    <input type="text" placeholder="Name" value={name} onChange={handleNameChange} />
                </Col>
            </Row>
            <Row>
                <Col>
                    <label>Number of players</label>
                </Col>
                <Col>
                    <input type="text" placeholder="Players" value={numPlayers} onChange={handlePlayerChange} />
                </Col>
            </Row>
            <Row>
                <Col>
                    <label>Number of Teams</label>
                </Col>
                <Col>
                    <input type="text" placeholder="Teams" value={numTeams} onChange={handleTeamsChange} />
                </Col>
            </Row>
            <Row>
                <Button onClick={handleCreateGame}>Create Game</Button>
            </Row>
        </Container>
    ) : (
        /*
        <Form onSubmit={handleSubmit}>
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
                        <Form.Check type="radio" label="2" name="numTeams" id="numPlayers2" />
                        <Form.Check type="radio" label="3" name="numTeams" id="numPlayers3" />
                    </Col>
                </Form.Group>
            </fieldset>
            <Button type="submit" className="mb-2">
                Create
            </Button>
        </Form>
*/
        <Login />
    );
};

export default Home;
