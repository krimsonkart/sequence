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
const useSequence = (gameId, setGameComplete, setPlayersModalOpen) => {
    const playerId = window.localStorage.getItem('userEmail');
    const userName = window.localStorage.getItem('userName');
    const alert = useAlert();
    const globalBoard = initializeBoard();
    const [position, setPosition] = useState(-1);
    const [turn, setTurn] = useState(0);
    const [gameState, setGameState] = useState('created');
    const [board, setBoard] = useState([]);
    const [hand, setHand] = useState([]);
    const [numPlayers, setNumPlayers] = useState(0);
    const [numTeams, setNumTeams] = useState(0);
    const [players, setPlayers] = useState([]);
    const [history, setHistory] = useState([]);
    const [errors, setErrorsList] = useState([]);
    const [gameLoaded, setGameLoaded] = useState(false);
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
        let currentPosition = players.findIndex(p => _.get(p,playerId) === playerId);
        if (currentPosition !== -1) {
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

    function startGameAcknowledge({ board, hand, players, history, turn }) {
        setCompleteBoard(board);
        // setHistory(history);
        setHand(hand);
        setTurn(turn);
        setPlayersList(players);
    }

    useEffect(() => {
        fetch(`${SOCKET_SERVER_URL}api/sequence/game/${gameId}`)
            .then(resp => resp.json())
            .then(resp => {
                // setGame(_.omit(resp, 'board'));
                setTurn(turn);
                setGameState(resp.state);
                setPlayersList(resp.players);
                setNumPlayers(resp.numPlayers);
                setNumTeams(resp.numTeams);
                setCompleteBoard(resp.board);
                if (position < 0 || resp.state === 'created') {
                    setPlayersModalOpen(true);
                }
                setGameLoaded(true);
                let playerJoined = false;
                if (resp.players.find(p => p.playerId === playerId)) {
                    playerJoined = true;
                }
                if (!playerJoined) {
                } else {
                    createSocket();
                    // Destroys the socket reference
                    // when the connection is closed
                }
            });
        return () => {
            if (socketRef) {
                socketRef.current.disconnect();
            }
        };
    }, [gameId]);
    function createSocket() {
        console.log('Creating socket')
        if(socketRef.current){
            console.log('Socket already created')
            return ;
        }
        // Creates a WebSocket connection
        socketRef.current = socketIOClient(SOCKET_SERVER_URL, {
            query: { playerId, gameId, userName },
        });
        // Listens for incoming messages
        socketRef.current.on(MSG_HEADERS.START_GAME, startGameAcknowledge);
        socketRef.current.on(MSG_HEADERS.PLAYER_RECONNECTED, startGameAcknowledge);
        socketRef.current.on(MSG_HEADERS.PLAY_CONFIRM, confirmPlayAction);
        socketRef.current.on(MSG_HEADERS.BROADCAST_COIN_ACTION, coinAction);
        socketRef.current.on(MSG_HEADERS.BROADCAST_PLAYER_JOINED, playerUpdate);
        socketRef.current.on(MSG_HEADERS.BROADCAST_PLAYER_REJOINED, playerUpdate);
        socketRef.current.on(MSG_HEADERS.BROADCAST_PLAYER_INACTIVE, playerUpdate);

        socketRef.current.on('error', ({ err }) => {
            console.log(`Error: ${err}`);
            alert.show(err);
        });
    }

    // Sends a message to the server that
    // forwards it to all users in the same room
    const joinGame = position => {
        if (!socketRef.current) {
            createSocket();
        }
        socketRef.current.emit('join', { position, gameId, playerId });
    };
    const startGame = () => {
        socketRef.current.emit('start', { gameId });
    };
    const placeAction = (card, position) => {
        socketRef.current.emit('play', { card, position });
    };
    const replaceCard = card => {
        socketRef.current.emit('play', { card, action: 'replace' });
    };
    return {
        board,
        gameState,
        hand,
        setHand,
        players,
        errors,
        setErrors,
        gameLoaded,
        history,
        turn,
        position,
        placeAction,
        replaceCard,
        joinGame,
        startGame,
        numTeams,
        numPlayers,
    };
};

export default useSequence;
