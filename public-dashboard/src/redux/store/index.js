import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import userReducer from '../reducers/user-reducer';

const rootReducer = combineReducers({
    user: userReducer
});

const configureStore = () => {
    return createStore(
        rootReducer,
        compose(applyMiddleware(thunk))
    );
};

export default configureStore;