import { AuthActionTypes, AuthActions } from '@app-auth/store/actions/auth';

export interface State {
	error: string | null;
	pending: boolean;
	loginRequired: boolean;
}

export const initialState: State = {
	error: null,
	pending: false,
	loginRequired: false
};

export function reducer(state = initialState, action: AuthActions): State {
	switch (action.type) {
		case AuthActionTypes.Login: {
			return {
				...state,
				error: null,
				pending: true,
				loginRequired: false
			};
		}

		case AuthActionTypes.LoginSuccess: {
			return {
				...state,
				error: null,
				pending: false,
				loginRequired: false
			};
		}

		case AuthActionTypes.LoginFailure: {
			return {
				...state,
				error: action.payload,
				pending: false,
				loginRequired: false
			};
		}

		case AuthActionTypes.LoginRequired: {
			return {
				...state,
				error: null,
				pending: false,
				loginRequired: action.payload
			};
		}

		default: {
			return state;
		}
	}
}

export const getError = (state: State) => state.error;
export const getPending = (state: State) => state.pending;
export const getLoginRequired = (state: State) => state.loginRequired;
