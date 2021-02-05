import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";

import "./Home.css";

const Home = () => {
    const [roomName, setRoomName] = React.useState("");
    const [userId, setUserId] = React.useState("");
    const [userName, setUserName] = React.useState("");

    const handleRoomNameChange = (event) => {
        setRoomName(event.target.value);
    };

    const handleUserIdChange = (event) => {
        setUserId(event.target.value);
    };

    const handleUserNameChange = (event) => {
        setUserName(event.target.value);
    };

    return (
        <div className="home-container">
            <input
                type="text"
                placeholder="Room"
                value={roomName}
                onChange={handleRoomNameChange}
                className="text-input-field"
            />
            <input
                type="text"
                placeholder="User ID"
                value={userId}
                onChange={handleUserIdChange}
                className="text-input-field"
            />
            <input
                type="text"
                placeholder="User Name"
                value={userName}
                onChange={handleUserNameChange}
                className="text-input-field"
            />
            <Link to={`/${userId}/${roomName}`} className="enter-room-button">
                Join room
            </Link>
        </div>
    );
};

export default Home;