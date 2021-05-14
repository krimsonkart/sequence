import React, { useState } from 'react';
import _ from 'lodash';
import { Container, Row, Col, Card, Navbar, Nav, Spinner, Button, Modal } from 'react-bootstrap';
import { useAlert } from 'react-alert';
// import Modal from 'react-modal';

import './Sequence.css';
import useSequence from './useSequence';
import useLogin from './useLogin';
import Login from './Login';
const TEAM_COINS = { 0: 'red.png', 1: 'green.png', 2: 'blue.png' };
function getImagePath(index) {
    let imagePath = `${index}.png`;
    // For ad blocker
    if (imagePath === 'AD.png') imagePath = 'aceDiamonds.png';
    if (imagePath === '*.png') imagePath = 'back2x.png';
    return imagePath;
}
const SINGLE_EYED_JACKS = ['JS', 'JH'];
const DOUBLE_EYED_JACKS = ['JD', 'JC'];
function isDoubleEyedJack(cardIndex) {
    return DOUBLE_EYED_JACKS.includes(cardIndex);
}
function isSingleEyedJack(cardIndex) {
    return SINGLE_EYED_JACKS.includes(cardIndex);
}

const Sequence = props => {
    const { userName } = useLogin();
    const alert = useAlert();
    const [gameComplete, setGameComplete] = React.useState(false);
    const [cardToUse, setCardToUse] = React.useState(''); // Message to be sent
    const [selectedCardIndex, setSelectedCardIndex] = React.useState(''); // Message to be sent
    const [isReplaceCardModalOpen, setIsReplaceModalOpen] = React.useState(false);
    const [isPlayersModalOpen, setPlayersModalOpen] = React.useState(false);
    const { gameId } = props.match.params; // Gets roomId from URL
    const {
        board,
        gameLoaded,
        hand,
        setHand,
        players,
        position,
        history,
        startGame,
        joinGame,
        turn,
        placeAction,
        numTeams,
        numPlayers,
        gameState,
        replaceCard,
    } = useSequence(gameId, setGameComplete, setPlayersModalOpen); // Creates a websocket and manages messaging

    const handleHandCardSelected = (card, i) => {
        setCardToUse(card);
        setSelectedCardIndex(i);
        if (board.board.selectedByIndex[card] > 1) {
            setIsReplaceModalOpen(true);
        }
        setHand(hand);
    };
    function getTeamCoin(board, i, j) {
        let coin = board && board.selectedPositions[`${i}-${j}`];
        return coin !== undefined && coin !== '*' && `/img/coins/${TEAM_COINS[coin]}`;
    }

    const handlePlaceCard = (i, j, card) => {
        if (gameState !== 'inProgress') {
            alert.show(`Game not started`);
            return;
        }
        if (position !== turn) {
            console.log(`Not your turn`);
            alert.show(`Not your turn`);
            return;
        }
        if (!cardToUse) {
            console.log(`No Card Selected`);
            alert.show(`No Card Selected`);
            return;
        }
        if (!isSingleEyedJack(cardToUse) && !isDoubleEyedJack(cardToUse) && cardToUse !== card) {
            console.log(`Not the selected card`);
            alert.show(`Not the selected card`);
            return;
        }
        placeAction(cardToUse, `${i}-${j}`);
        setCardToUse(null);
    };

    function getBoardToDraw() {
        return board.globalBoard || [];
    }

    function cardSelected(i) {
        return selectedCardIndex === i;
    }
    function closeReplaceCardModal() {
        setIsReplaceModalOpen(false);
    }
    function replaceSelected() {
        replaceCard(cardToUse);
        setIsReplaceModalOpen(false);
    }

    function gameStart() {
        startGame();
        setPlayersModalOpen(false);
    }

    function getGameComponent() {
        return gameLoaded ? (
            <Container>
                <Modal show={gameComplete}>
                    <Modal.Header>Game over</Modal.Header>
                    <Modal.Body>Team {_.get(board, 'board.winner')} won</Modal.Body>
                </Modal>
                <Modal show={isPlayersModalOpen} onHide={() => setPlayersModalOpen(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Players</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Container>
                            <Row>
                                <Col>Position</Col>
                                <Col>Team Number</Col>
                                <Col>Name</Col>
                            </Row>
                            {_.keys(Array(numPlayers)).map((row, i) => (
                                <Row>
                                    <Col>{i}</Col>
                                    <Col>{i % numTeams}</Col>
                                    <Col>
                                        {players[i] && !players[i].inactive ? (
                                            <span>{players[i].name}</span>
                                        ) : position < 0 ? (
                                            <Button onClick={() => joinGame(i)}>Join</Button>
                                        ) : (
                                            <span>Waiting...</span>
                                        )}
                                    </Col>
                                </Row>
                            ))}
                            {gameState === 'created' && !players.find(x => !x || x.inactive) ? (
                                <Row>
                                    <Button onClick={() => startGame()}>Start</Button>
                                </Row>
                            ) : (
                                ''
                            )}
                        </Container>
                    </Modal.Body>
                </Modal>
                <Modal show={isReplaceCardModalOpen} onHide={closeReplaceCardModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Players</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Container>
                            <Row>
                                <Col>
                                    <Button variant="primary" onClick={replaceSelected}>
                                        yes
                                    </Button>
                                </Col>
                                <Col>
                                    <Button variant="secondary" onClick={closeReplaceCardModal}>
                                        no
                                    </Button>
                                </Col>
                            </Row>
                        </Container>
                    </Modal.Body>
                </Modal>
                <Row>
                    <Col>
                        <span>Turn: {turn}</span>
                    </Col>
                    <Col>
                        <span>Selected: {cardToUse}</span>
                    </Col>
                    <Col>
                        <Button onClick={() => setPlayersModalOpen(true)}>
                            {position < 0 ? <span>Join</span> : <span>Position: {position}</span>}
                        </Button>
                    </Col>
                </Row>
                <Row>
                    <Container fluid className="container">
                        {getBoardToDraw().map((row, i) => (
                            <Row key={`row${i}`}>
                                {row.map((card, j) => {
                                    const coin = getTeamCoin(board.board, i, j);
                                    return (
                                        <Col>
                                            <Card onClick={() => handlePlaceCard(i, j, card)}>
                                                <Card.Img
                                                    alt="Card"
                                                    img-border-primary
                                                    src={`/img/${getImagePath(card)}`}
                                                />
                                                {coin && <img src={coin} className="coin img-responsive" />}
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        ))}
                    </Container>
                </Row>
                <Row>
                    <Container fluid>
                        <Row style={{ justifyContent: 'center', padding: '20px' }}>
                            {(hand || []).map((card, i) => (
                                <Col>
                                    <img
                                        alt="Card1"
                                        height="100vh"
                                        src={`/img/${getImagePath(card)}`}
                                        className={cardSelected(i) ? 'border border-primary' : ''}
                                        onClick={() => handleHandCardSelected(card, i)}
                                    />
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </Row>
            </Container>
        ) : (
            <Spinner animation="border" role="status">
                <span className="sr-only">Loading...</span>
            </Spinner>
        );
    }

    return (
        <Container>
            {/*
            <Row>
                <Navbar bg="light" fixed="top" expand="lg">
                    <Navbar.Brand href="#home">Sequence</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />

                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mr-auto">
                        <Nav.Link href="#home">Home</Nav.Link>
                    </Nav>
                </Navbar.Collapse>

                    <Login />
                </Navbar>
            </Row>
*/}
            <Row>{userName ? getGameComponent() : <Login />}</Row>
        </Container>
    );
};

export default Sequence;
