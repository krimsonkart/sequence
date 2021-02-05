import { useEffect, useRef, useState } from "react";
import socketIOClient from "socket.io-client";

const NEW_CHAT_MESSAGE_EVENT = "newChatMessage"; // Name of the event
const SOCKET_SERVER_URL = "http://localhost:8081";

let playerJoined = (socket, { player }) => {
    console.log(`${player.id} joined`)
};
let errorHandler = (socket, { err }) => {};
const handlers = {
  error: errorHandler,
  playerJoined: playerJoined,
};
const useGame = (gameId) => {
  const [game, setGame] = useState([]); // Sent and received messages
  const socketRef = useRef();

  useEffect(() => {
    // Creates a WebSocket connection
    socketRef.current = socketIOClient(SOCKET_SERVER_URL, {
      query: { gameId },
    });
    // Listens for incoming messages
    for (const key in handlers) {
      socketRef.current.on(key, (data) => {
        handlers[key](socketRef.current, data);
      });
    }
    // Destroys the socket reference
    // when the connection is closed
    return () => {
      socketRef.current.disconnect();
    };
  }, [gameId]);

  // Sends a message to the server that
  // forwards it to all users in the same room
  const sendMessage = (messageBody) => {
    socketRef.current.emit(NEW_CHAT_MESSAGE_EVENT, {
      body: messageBody,
      senderId: socketRef.current.id,
    });
  };

  return { messages, sendMessage };
};

export default useGame;
