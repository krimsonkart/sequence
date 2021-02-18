import './Home.css';
import React, { useState, useEffect } from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import useLogin from './useLogin';
import Login from './Login';
const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL;

const Home = () => {
    const [games, setGames] = useState([]);
    const [gamesLoaded, setGamesLoaded] = useState(false);
    const [roomName, setRoomName] = useState('');
    const { userName } = useLogin();

    const handleRoomNameChange = event => {
        setRoomName(event.target.value);
    };

    function userSet() {
        return !!userName;
    }
    useEffect(() => {
        async function getData() {
            const resp = await fetch(`${SOCKET_SERVER_URL}api/sequence/games`);
            setGamesLoaded(true);
            let jsonData = await resp.json();
            setGames(jsonData.data);
        }
        !gamesLoaded && getData();
    });
    // const fetchData = async () => {
    //     const response = await axios.get(`${SOCKET_SERVER_URL}/games`);
    //     setGames(response.data);
    // };

    return userSet() ? (
        <Container fluid>
            <Row style={{ paddingLeft: 0, paddingRight: 0, paddingTop: 10, paddingBottom: 10 }}>
                <Container>
                    <Row>
                        <Col>
                            <input type="text" placeholder="Room" value={roomName} onChange={handleRoomNameChange} />
                        </Col>
                        <Col>
                            <Button href={`/ui/sequence/game/${roomName}`}>Join Game</Button>
                        </Col>
                        <Col>
                            <Button href="/ui/sequence/create">Create</Button>
                        </Col>
                    </Row>
                </Container>
            </Row>
            <Row>
                <Container>
                    {games.map(game => (
                        <Row style={{ paddingLeft: 0, paddingRight: 0, paddingTop: 10, paddingBottom: 10 }}>
                            <Col>{game.id}</Col>
                            <Col>
                                <Button href={`/ui/sequence/game/${game.id}`}>Join Game</Button>
                            </Col>
                        </Row>
                    ))}
                </Container>
            </Row>
        </Container>
    ) : (
        <Login />
    );
};

export default Home;
