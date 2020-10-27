import { AuthActionTypes, AuthActions } from '@app-auth/store/actions/auth';

export interface State {
  error: any;
  verificationSent: boolean;
  validated: boolean;
  passwordUpdated: boolean;
  verificationPending: boolean;
  validationPending: boolean;
  passwordUpdatePending: boolean;
}

export const initialState: State = {
  error: null,
  verificationSent: false,
  validated: false,
  passwordUpdated: false,
  verificationPending: false,
  validationPending: false,
  passwordUpdatePending: false
};

export function reducer(state = initialState, action: AuthActions): State {
  switch (action.type) {
    case AuthActionTypes.ForgottenPasswordVerificationSend: {
        return {
          ...state,
          error: null,
          verificationSent: false,
          validated: false,
          passwordUpdated: false,
          verificationPending: true,
          validationPending: false,
          passwordUpdatePending: false
        };
    }

    case AuthActionTypes.ForgottenPasswordVerificationSent: {
      return {
        ...state,
        error: null,
        verificationSent: true,
        verificationPending: false
      };
    }

    case AuthActionTypes.ForgottenPasswordValidationSend: {
      return {
        ...state,
        error: null,
        verificationSent: false,
        validated: false,
        passwordUpdated: false,
        validationPending: true
      };
    }

    case AuthActionTypes.ForgottenPasswordValidated: {
      return {
        ...state,
        error: null,
        validated: true,
        validationPending: false
      };
    }

    case AuthActionTypes.ForgottenPasswordUpdate: {
      return {
        ...state,
        error: null,
        passwordUpdated: false,
        passwordUpdatePending: true
      };
    }

    case AuthActionTypes.ForgottenPasswordUpdated: {
      return {
        ...state,
        error: null,
        verificationSent: false,
        validated: false,
        passwordUpdated: true,
        passwordUpdatePending: false
      };
    }

    case AuthActionTypes.ForgottenPasswordFailure: {
      return {
        ...state,
        error: action.payload,
        verificationSent: false,
        passwordUpdated: false,
        verificationPending: false,
        passwordUpdatePending: false
      };
    }

    default: {
      return state;
    }
  }
}

export const getError = (state: State) => state.error;
export const getVerificationPending = (state: State) => state.verificationPending;
export const getVerificationSent = (state: State) => state.verificationSent;
export const getValidationPending = (state: State) => state.validationPending;
export const getValidated = (state: State) => state.validated;
export const getPasswordUpdatePending = (state: State) => state.passwordUpdatePending;
export const getPasswordUpdated = (state: State) => state.passwordUpdated;
