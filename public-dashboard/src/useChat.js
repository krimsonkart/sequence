import { useEffect, useRef, useState } from "react";
import socketIOClient from "socket.io-client";

const NEW_CHAT_MESSAGE_EVENT = "newChatMessage"; // Name of the event
const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL;
// const SOCKET_SERVER_URL = 'https://evening-lowlands-19146.herokuapp.com/';
// const SOCKET_SERVER_URL = "http://localhost:8081";
// const SOCKET_SERVER_URL = "http://localhost:5000";
const MSG_HEADERS = {
  NEW_GAME: 'gameCreated',
  PLAY_CONFIRM: 'playConfirm',
  // PLAYER_RECONNECTED: 'player_reconnected',
  START_GAME: 'start',
  PLAYER_INACTIVE: 'playerInactive',
  LOGGED_IN: 'userLoggedIn',
  CHAT_MESSAGE: 'newChatMessage',
  BROADCAST_PLAYER_JOINED: 'playerJoined',
  BROADCAST_PLAYER_REJOINED: 'playerRejoined',
  BROADCAST_PLAYER_DROPPED: 'playerDropped',
  BROADCAST_PLACE_COIN: 'placeCoin',
  BROADCAST_REMOVE_COIN: 'removeCoin',
  BROADCAST_REPLACE_CARD: 'replaceCard',
};

const useChat = (gameId, playerId) => {
  const [messages, setMessages] = useState([]); // Sent and received messages
  const socketRef = useRef();

  useEffect(() => {
    // Creates a WebSocket connection
    socketRef.current = socketIOClient(SOCKET_SERVER_URL, {
      query: { playerId, gameId: gameId },
    });
    Object.values(MSG_HEADERS).forEach((header) => {
      socketRef.current.on(header,(message) => {
        const incomingMessage = {
          body: JSON.stringify({msg: header, body: JSON.stringify(message)}),
          ownedByCurrentUser: false,
        };
        setMessages((messages) => [...messages, incomingMessage]);
      })
    });
    // Listens for incoming messages
    socketRef.current.on(NEW_CHAT_MESSAGE_EVENT, (message) => {
      const incomingMessage = {
        ...message,
        ownedByCurrentUser: message.senderId === socketRef.current.id,
      };
      setMessages((messages) => [...messages, incomingMessage]);
    });
    socketRef.current.on("error", (message) => {
      const incomingMessage = {
        body: JSON.stringify(message),
        ownedByCurrentUser: true,
      };
      setMessages((messages) => [...messages, incomingMessage]);
    });
    // Destroys the socket reference
    // when the connection is closed
    return () => {
      socketRef.current.disconnect();
    };
  }, [gameId]);

  // Sends a message to the server that
  // forwards it to all users in the same room
  const sendMessage = (message) => {
    let tokenIndex = message.indexOf(" ");
    socketRef.current.emit(
      message.substr(0, tokenIndex),
      JSON.parse(message.substr(tokenIndex + 1))
    );
  };

  return { messages, setMessages, sendMessage };
};

export default useChat;
