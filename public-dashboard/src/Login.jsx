import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";

import "./Home.css";

const Login = () => {
  const [userId, setUserId] = React.useState("");
  const [userName, setUserName] = React.useState("");

  const handleUserIdChange = (event) => {
    setUserId(event.target.value);
  };

  const handleUserNameChange = (event) => {
    setUserName(event.target.value);
  };
  const handleLogin = () => {
    this.props.setUserId(this.state.userName);
    this.props.setUserName(this.state.userName);
  };
  return (
    <div className="home-container">
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
      <button className="add-todo" onClick={handleLogin}>
        Login
      </button>
      <Link to={`/rooms`} className="enter-room-button">
        Join room
      </Link>
    </div>
  );
};

const setUserId = (userId) => ({
  type: "userId",
  payload: {
    userId,
  },
});
const setUserName = (userName) => ({
  type: "userName",
  payload: {
    userName,
  },
});

export default connect(null, { setUserId, setUserName })(Login);
