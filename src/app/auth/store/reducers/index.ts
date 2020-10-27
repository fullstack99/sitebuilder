import {
    createSelector,
    createFeatureSelector,
    ActionReducerMap,
} from '@ngrx/store';

import * as fromRoot from '@app/stores/reducers';
import * as fromAuth from '@app-auth/store/reducers/auth';
import * as fromLoginPage from '@app-auth/store/reducers/login-page';
import * as fromRegisterPage from '@app-auth/store/reducers/register-page';
import * as fromChangePasswordPage from '@app-auth/store/reducers/change-password-page';
import * as fromForgottenPasswordPage from '@app-auth/store/reducers/forgotten-password-page';

export interface AuthState {
	status: fromAuth.State;
	loginPage: fromLoginPage.State;
  registerPage: fromRegisterPage.State;
  forgottenPasswordPage: fromForgottenPasswordPage.State;
  changePasswordPage: fromChangePasswordPage.State;
}

export interface State extends fromRoot.AppState {
	auth: AuthState;
}
export interface State {
	auth: AuthState;
}

export const reducers: ActionReducerMap<AuthState> = {
	status: fromAuth.reducer,
	loginPage: fromLoginPage.reducer,
  registerPage: fromRegisterPage.reducer,
  forgottenPasswordPage: fromForgottenPasswordPage.reducer,
  changePasswordPage: fromChangePasswordPage.reducer
};

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectAuthStatusState = createSelector(
	selectAuthState,
	(state: AuthState) => state.status
);

export const getUser = createSelector(selectAuthStatusState, fromAuth.getUser);
export const getCurrentSite = createSelector(selectAuthStatusState, fromAuth.getCurrentSite);
export const getAuthError = createSelector(selectAuthStatusState, fromAuth.getError);
export const getLoggedIn = createSelector(selectAuthStatusState,fromAuth.getLoggedIn);
export const getToken = createSelector(selectAuthStatusState, fromAuth.getToken);
export const getUpdatePending = createSelector(selectAuthStatusState, fromAuth.getUpdatePending);
export const getUpdated = createSelector(selectAuthStatusState, fromAuth.getUpdated);

export const selectLoginPageState = createSelector(
	selectAuthState,
	(state: AuthState) => state.loginPage
);
export const selectRegisterPageState = createSelector(
	selectAuthState,
	(state: AuthState) => state.registerPage
);
export const selectForgottenPasswordPageState = createSelector(
	selectAuthState,
	(state: AuthState) => state.forgottenPasswordPage
);
export const selectChangePasswordPageState = createSelector(
	selectAuthState,
	(state: AuthState) => state.changePasswordPage
);

export const getLoginRequired = createSelector(
	selectLoginPageState,
	fromLoginPage.getLoginRequired
);
export const getLoginPageError = createSelector(
	selectLoginPageState,
	fromLoginPage.getError
);
export const getLoginPagePending = createSelector(
	selectLoginPageState,
	fromLoginPage.getPending
);
export const getRegisterPageSuccess = createSelector(
  selectRegisterPageState,
  fromRegisterPage.getSuccess
)
export const getRegisterPageError = createSelector(
	selectRegisterPageState,
	fromRegisterPage.getError
);
export const getRegisterPagePending = createSelector(
	selectRegisterPageState,
	fromRegisterPage.getPending
);

export const getForgottenPasswordPageVerificationSent = createSelector(
  selectForgottenPasswordPageState,
  fromForgottenPasswordPage.getVerificationSent
);export const getForgottenPasswordPageValidated = createSelector(
  selectForgottenPasswordPageState,
  fromForgottenPasswordPage.getValidated
);
export const getForgottenPasswordPageUpdated = createSelector(
  selectForgottenPasswordPageState,
  fromForgottenPasswordPage.getPasswordUpdated
);
export const getForgottenPasswordPageError = createSelector(
  selectForgottenPasswordPageState,
  fromForgottenPasswordPage.getError
);
export const getForgottenPasswordPageVerificationPending = createSelector(
	selectForgottenPasswordPageState,
	fromForgottenPasswordPage.getVerificationPending
);
export const getForgottenPasswordPageValidationPending = createSelector(
	selectForgottenPasswordPageState,
	fromForgottenPasswordPage.getValidationPending
);
export const getForgottenPasswordUpdatePending = createSelector(
	selectForgottenPasswordPageState,
	fromForgottenPasswordPage.getPasswordUpdatePending
);

export const getChangePasswordPending = createSelector(
  selectChangePasswordPageState,
  fromChangePasswordPage.getPasswordChangePending
);
export const getChangePasswordError = createSelector(
  selectChangePasswordPageState,
  fromChangePasswordPage.getError
);

export const getChangePasswordSuccess = createSelector(
	selectChangePasswordPageState,
	fromChangePasswordPage.getPasswordChanged
);

