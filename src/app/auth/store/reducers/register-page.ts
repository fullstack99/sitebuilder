import { AuthActionTypes, AuthActions } from '@app-auth/store/actions/auth';

export interface State {
	error: string | null;
	success: boolean;
	pending: boolean;
}

export const initialState: State = {
	error: null,
	success: false,
	pending: false,

};

export function reducer(state = initialState, action: AuthActions): State {
	switch (action.type) {
		case AuthActionTypes.Register: {
			return {
				...state,
				error: null,
				success: false,
				pending: true,
			};
		}
		case AuthActionTypes.RegisterSuccess: {
			console.log(action.payload)
			return {
				...state,
				error: null,
				success: true,
				pending: false,
			};
		}

		case AuthActionTypes.RegisterFailure: {
			console.log(action.payload)
			return {
				...state,
				error: action.payload,
				success: false,
				pending: false,
			};
		}

		default: {
			return state;
		}
	}
}

export const getError = (state: State) => state.error;
export const getPending = (state: State) => state.pending;
export const getSuccess = (state: State) => state.success;
