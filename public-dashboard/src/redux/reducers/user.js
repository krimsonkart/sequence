import { Types } from '../actions/actionTypes';

export const ActionCreators = {
    login: (user) => ({ type: Types.LOGIN, payload: { user } })
}