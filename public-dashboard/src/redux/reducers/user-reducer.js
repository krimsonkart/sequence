import { Types } from '../actions/actionTypes';

const initialState = {
    profile: {
        id: '',
        name: '',
        email: '',
    },
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case Types.LOGIN:
            console.log('login', action.payload.user);
            return {
                ...state,
                user: action.payload.user,
            };
        default:
            return state;
    }
};

export default reducer;
