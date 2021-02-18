import React from "react";

import "./ChatRoom.css";
import useChat from "./useChat";

const ChatRoom = (props) => {
    // const { gameId, playerId } = props.match.params; // Gets gameId from URL
    const { messages, setMessages, sendMessage } = useChat(); // Creates a websocket and manages messaging
    const [newMessage, setNewMessage] = React.useState(""); // Message to be sent

    const handleNewMessageChange = (event) => {
        setNewMessage(event.target.value);
    };

    const handleSendMessage = () => {
        sendMessage(newMessage);
        const msg = {
            body: newMessage,
            ownedByCurrentUser: true,
        };
        setMessages((messages) => [...messages, msg]);
        setNewMessage("");
    };

    return (
        <div className="chat-room-container">
            <h1 className="room-name">Room</h1>
            <div className="messages-container">
                <ol className="messages-list">
                    {messages.map((message, i) => (
                        <li
                            key={i}
                            className={`message-item ${
                                message.ownedByCurrentUser ? "my-message" : "received-message"
                            }`}
                        >
                            {message.body}
                        </li>
                    ))}
                </ol>
            </div>
            <textarea
                value={newMessage}
                onChange={handleNewMessageChange}
                placeholder="Write message..."
                className="new-message-input-field"
            />
            <button onClick={handleSendMessage} className="send-message-button">
                Send
            </button>
        </div>
    );
};

export default ChatRoom;