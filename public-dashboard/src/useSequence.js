import { useEffect, useRef, useState } from 'react';
import socketIOClient from 'socket.io-client';
import _ from 'lodash';
import { useAlert } from 'react-alert';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL;
// const SOCKET_SERVER_URL = 'https://evening-lowlands-19146.herokuapp.com/';
// const SOCKET_SERVER_URL = 'http://localhost:8081/';
// const SOCKET_SERVER_URL = 'http://localhost:5000/';

const MSG_HEADERS = {
    NEW_GAME: 'gameCreated',
    PLAY_CONFIRM: 'playConfirm',
    PLAYER_RECONNECTED: 'player_reconnected',
    START_GAME: 'start',
    PLAYER_INACTIVE: 'playerInactive',
    LOGGED_IN: 'userLoggedIn',
    CHAT_MESSAGE: 'newChatMessage',
    BROADCAST_WIN_ACTION: 'broadcastWin',
    PLAYER_WIN_ACTION: 'playerWin',
    BROADCAST_PLAYER_INACTIVE: 'playerInactive',
    BROADCAST_PLAYER_JOINED: 'playerJoined',
    BROADCAST_PLAYER_REJOINED: 'playerRejoined',
    BROADCAST_PLAYER_DROPPED: 'playerDropped',
    BROADCAST_COIN_ACTION: 'coinAction',
    BROADCAST_PLACE_COIN: 'placeCoin',
    BROADCAST_REMOVE_COIN: 'removeCoin',
    BROADCAST_REPLACE_CARD: 'replaceCard',
};

function initializeBoard() {
    const board = [];
    for (let i = 0; i < 10; i++) {
        board[i] = [];
    }
    let suits = ['S', 'D', 'C', 'H'];
    let suiteNumbers = ['2', '3', '4', '5', '6', '7', '8', '9', '0', 'Q', 'K', 'A'];
    let values = {
        S: suiteNumbers,
        D: suiteNumbers,
        C: [...suiteNumbers].reverse(),
        H: [...suiteNumbers].reverse(),
    };
    let sIndex = 0;
    let vIndex = 0;
    let rIndex = 0;
    let cIndex = 1;
    let direction = 0;
    let loop = 0;
    _.set(board, [0, 0], '*');
    _.set(board, [9, 9], '*');
    _.set(board, [0, 9], '*');
    _.set(board, [9, 0], '*');
    for (let i = 0; i < 100; i++) {
        if (!board[rIndex][cIndex]) {
            let s = suits[sIndex];
            let v = values[s][vIndex];
            if (vIndex === 11) {
                sIndex = (sIndex + 1) % 4;
            }
            vIndex = (vIndex + 1) % 12;
            _.set(board, [rIndex, cIndex], `${v}${s}`);
        }
        switch (direction) {
            case 0:
                if (cIndex === 9 - loop) {
                    rIndex++;
                    direction++;
                } else {
                    cIndex++;
                }
                break;
            case 1:
                if (rIndex === 9 - loop) {
                    direction++;
                    cIndex--;
                } else {
                    rIndex++;
                }
                break;
            case 2:
                if (cIndex === loop) {
                    rIndex--;
                    direction++;
                    loop++;
                } else {
                    cIndex--;
                }
                break;
            case 3:
                if (rIndex === loop) {
                    cIndex++;
                    direction = 0;
                } else {
                    rIndex--;
                }
                break;
        }
    }
    return board;
}
const useSequence = (gameId, playerId, setGameComplete) => {
    const alert = useAlert();
    const globalBoard = initializeBoard();
    const [position, setPosition] = useState(0); // Sent and received messages
    const [turn, setTurn] = useState(0); // Sent and received messages
    const [board, setBoard] = useState([]); // Sent and received messages
    const [hand, setHand] = useState([]); // Sent and received messages
    const [players, setPlayers] = useState([]); // Sent and received messages
    const [history, setHistory] = useState([]); // Sent and received messages
    const [errors, setErrorsList] = useState([]); // Sent and received messages
    const socketRef = useRef();

    function setErrors(errs) {
        setErrorsList(errs);
        setTimeout(() => {
            setErrorsList((errors || []).filter(({ time }) => Date.now() - time < 3000));
        }, 3000);
    }

    function setCompleteBoard(board) {
        if (board.winner !== undefined) {
            setGameComplete(true);
        }
        setBoard({ globalBoard, board });
    }

    function confirmPlayAction({ hand, turn }) {
        setHand(hand);
    }

    function setPlayersList(players) {
        setPlayers(players);
        let currentPosition = players.findIndex(p => p.playerId === playerId);
        if (currentPosition) {
            setPosition(currentPosition);
        }
    }

    function playerUpdate({ players, history, turn }) {
        if (turn !== undefined) {
            setTurn(turn);
        }
        setHistory(history);
        setPlayersList(players);
    }

    function coinAction({ turn, history, board }) {
        setTurn(turn);
        setCompleteBoard(board);
        setHistory(history);
    }

    function startGame({ board, hand, players, history, turn }) {
        setCompleteBoard(board);
        setHistory(history);
        setHand(hand);
        setTurn(turn);
        setPlayersList(players);
    }

    useEffect(() => {
        // Creates a WebSocket connection
        socketRef.current = socketIOClient(SOCKET_SERVER_URL, {
            query: { playerId, gameId },
        });
        // Listens for incoming messages
        socketRef.current.on(MSG_HEADERS.START_GAME, startGame);
        socketRef.current.on(MSG_HEADERS.PLAYER_RECONNECTED, startGame);
        socketRef.current.on(MSG_HEADERS.PLAY_CONFIRM, confirmPlayAction);
        socketRef.current.on(MSG_HEADERS.BROADCAST_COIN_ACTION, coinAction);
        socketRef.current.on(MSG_HEADERS.BROADCAST_PLAYER_JOINED, playerUpdate);
        socketRef.current.on(MSG_HEADERS.BROADCAST_PLAYER_REJOINED, playerUpdate);
        socketRef.current.on(MSG_HEADERS.BROADCAST_PLAYER_INACTIVE, playerUpdate);

        socketRef.current.on('error', ({ err }) => {
            console.log(`Error: ${err}`);
            alert.show(err);
        });
        // Destroys the socket reference
        // when the connection is closed
        return () => {
            socketRef.current.disconnect();
        };
    }, [gameId]);

    // Sends a message to the server that
    // forwards it to all users in the same room
    const placeAction = (card, position) => {
        socketRef.current.emit('play', { card, position });
    };
    const replaceCard = card => {
        socketRef.current.emit('play', { card, action: 'replace' });
    };
    return {
        board,
        hand,
        setHand,
        players,
        errors,
        setErrors,
        history,
        turn,
        position,
        placeAction,
        replaceCard,
    };
};

export default useSequence;
