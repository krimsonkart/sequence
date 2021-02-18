import { useEffect, useState } from 'react';

const useLogin = () => {
    const [userEmail, setUserEmail] = useState(window.localStorage.getItem('userEmail'));
    const [userName, setUserName] = useState(window.localStorage.getItem('userName'));
    const [userId, setUserId] = useState(window.localStorage.getItem('userId'));
    return { userEmail, setUserEmail, userName, userId, setUserName, setUserId };
};

export default useLogin;
