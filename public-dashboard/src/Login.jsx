import useLogin from './useLogin';
import GoogleLogin from 'react-google-login';
import { ActionCreators } from './redux/reducers/user';
import { connect } from 'react-redux';
import React from 'react';

const Login = () => {
    // const [user, setUser] = useState(''); // Sent and received messages
    const { userEmail, setUserEmail, userName, setUserName, setUserId } = useLogin();
    function responseGoogle(response) {
        let name = response.profileObj.name;
        console.log(`Logged in with google`);
        let email = response.profileObj.email;
        setUserId(email);
        // setUserEmail(email);
        setUserName(name);
        window.localStorage.setItem('userEmail', email);
        window.localStorage.setItem('userName', name);
        window.localStorage.setItem('userId', email);
        // this.props.dispatch(ActionCreators.login(userObj));
    }
    function userNotSet() {
        // return this.props.user
        return !userEmail;
    }

    return userNotSet() ? (
        <GoogleLogin
            clientId="927228406323-fdhfbqgcto7opgu54u1h7qk3p6754iq8.apps.googleusercontent.com"
            buttonText="Login"
            onSuccess={responseGoogle}
            isSignedIn={true}
            cookiePolicy={'single_host_origin'}
        />
    ) : (
        <span>{userName}</span>
    );
};
const mapStateToProps = state => {
    return {
        user: state.user,
    };
};
export default connect(mapStateToProps)(Login);
