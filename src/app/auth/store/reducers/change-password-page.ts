import { AuthActionTypes, AuthActions } from '@app-auth/store/actions/auth';

export interface State {
  error: any;
  passwordChanged: boolean;
  passwordChangePending: boolean;
}

export const initialState: State = {
  error: null,
  passwordChanged: false,
  passwordChangePending: false
};

export function reducer(state = initialState, action: AuthActions): State {
  switch (action.type) {

    case AuthActionTypes.ChangePassword: {
      return {
        ...state,
        error: null,
        passwordChanged: false,
        passwordChangePending: true
      };
    }

    case AuthActionTypes.ChangePasswordSuccess: {
      return {
        ...state,
        error: null,
        passwordChanged: true,
        passwordChangePending: false
      };
    }

    case AuthActionTypes.ChangePasswordFailure: {
      return {
        ...state,
        error: action.payload,
        passwordChanged: false,
        passwordChangePending: false
      };
    }

    default: {
      return state;
    }
  }
}

export const getError = (state: State) => state.error;
export const getPasswordChangePending = (state: State) => state.passwordChangePending;
export const getPasswordChanged = (state: State) => state.passwordChanged;
