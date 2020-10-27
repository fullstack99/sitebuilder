import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Effect, Actions, ofType } from '@ngrx/effects';
import { of } from 'rxjs/observable/of';
import { tap, map, switchMap, exhaustMap, mergeMap, first, catchError, take, delay } from 'rxjs/operators';

import * as AuthAction from '@app-auth/store/actions/auth';

import { User, Credentials } from '@app/models';
import { AuthService } from '@app-auth/services/auth.service';
import { forkJoin } from 'rxjs/observable/forkJoin';

import * as errorHandler from '@app-shared/utils/error-handler';

@Injectable()
export class AuthEffects {
	constructor(
		private actions$: Actions,
		private router: Router,
		private authService: AuthService
	) {
	}

	@Effect()
	login = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.Login),
		exhaustMap((action: AuthAction.Login) =>
			this.authService.login(action.payload)
			.pipe(
				map(res => {
					if (res && res['access_token']) {
						return new AuthAction.LoginSuccess(res, action.isFreelancer);
					}
					else {
						return new AuthAction.LoginFailure('Login Failure');
					}
				}),
				catchError(error => of(new AuthAction.LoginFailure(error)))
			)
		),
		tap(() => {
		})
	);

	@Effect()
	loginSuccess = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.LoginSuccess),
		exhaustMap((action: AuthAction.LoginSuccess) =>
			this.authService.getUserInfo()
			.pipe(
				map((res) => {
					return new AuthAction.GetUserDetailSuccess(res, action.isFreelancer);
				}),
				catchError(error => of(new AuthAction.GetUserDetailFailure(errorHandler.getHttpError(error))))
			)
		),
		// tap(() => {
		// 	this.router.navigate(['/']);
		// })
	);

	@Effect()
	refreshToken = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.RefreshToken),
		exhaustMap(() =>
			this.authService.refreshToken()
			.pipe(
				map(res => {
					if (res)
						return new AuthAction.RefreshTokenSuccess(res);
					else
						return new AuthAction.RefreshTokenFailure(null);
				}),
				catchError(error => of(new AuthAction.RefreshTokenFailure(errorHandler.getHttpError(error))))
			)
		)
	);

	@Effect()
	getUserSites = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.GetUserSites),
		exhaustMap((action: AuthAction.GetUserSites) =>
			this.authService.getUserSites()
			.pipe(
				map(res => new AuthAction.GetUserSitesSuccess(res, action.isFreelacer)),
				catchError(error => of(new AuthAction.GetUserSitesFailure(errorHandler.getHttpError(error))))
			)
		)
  );

  @Effect()
	addUserSite = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.AddUserSite),
		exhaustMap((action: AuthAction.AddUserSite) =>
			this.authService.addSite(action.payload)
			.pipe(
				map(result => {
					if (result && !result['error'])
						return new AuthAction.AddUserSiteSuccess(result);
					else
						return new AuthAction.AddUserSiteFailure(result['error'] ? result : 'Add a Site Failure');

				}),
				catchError(error => of(new AuthAction.AddUserSiteFailure(errorHandler.getHttpError(error))))
			)
		)
  );

  @Effect()
	renameUserSite = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.RenameUserSite),
		exhaustMap((action: AuthAction.RenameUserSite) =>
			this.authService.renameUserSite(action.payload)
			.pipe(
				map(result => {
					console.log('renaming', result);
					if (result)
						return new AuthAction.RenameUserSiteSuccess(action.payload);
					else
						return new AuthAction.RenameUserSiteFailure(result['error'] ? result : 'Delete Site Failure');

				}),
				catchError(error => of(new AuthAction.RenameUserSiteFailure(errorHandler.getHttpError(error))))
			)
		)
  );

  @Effect()
	deleteUserSite = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.DeleteUserSite),
		exhaustMap((action: AuthAction.DeleteUserSite) =>
			this.authService.deleteUserSite(action.payload)
			.pipe(
				map(result => {
					if (result)
						return new AuthAction.DeleteUserSiteSuccess(action.payload);
					else
						return new AuthAction.DeleteUserSiteFailure(result['error'] ? result : 'Delete Site Failure');

				}),
				catchError(error => of(new AuthAction.DeleteUserSiteFailure(errorHandler.getHttpError(error))))
			)
		)
  );

  @Effect()
	changeUserSiteStatus = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.ChangeUserSiteStatus),
		exhaustMap((action: AuthAction.ChangeUserSiteStatus) =>
			this.authService.changeUserSiteStatus(action.payload.site, action.payload.activate)
			.pipe(
				map(result => {
					if (result)
						return new AuthAction.ChangeUserSiteStatusSuccess(action.payload);
					else
						return new AuthAction.ChangeUserSiteStatusFailure(result['error'] ? result : 'Delete Site Failure');

				}),
				catchError(error => of(new AuthAction.ChangeUserSiteStatusFailure(errorHandler.getHttpError(error))))
			)
		)
  );

  @Effect()
	deleteAccount = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.DeleteAccount),
		exhaustMap((action: AuthAction.DeleteAccount) =>
			this.authService.deleteAccount()
			.pipe(
				map(result => {
					if (result)
						return new AuthAction.DeleteAccountSuccess(action.payload);
					else
						return new AuthAction.DeleteAccountFailure(result['error'] ? result : 'Delete Account Failure');

				}),
				catchError(error => of(new AuthAction.DeleteAccountFailure(errorHandler.getHttpError(error))))
			)
		)
	);

	@Effect()
	getUserDetail = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.GetUserDetail),
		exhaustMap((action: AuthAction.GetUserDetail) =>
			this.authService.getUserInfo()
			.pipe(
				map(res => new AuthAction.GetUserDetailSuccess(res, action.isFreelancer)),
				catchError(error => of(new AuthAction.GetUserDetailFailure(errorHandler.getHttpError(error))))
			)
		)
	);

	@Effect({ dispatch: false })
	setCurrentSite = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.SetCurrentSite),
		tap((action: AuthAction.SetCurrentSite) => {
			if (action.goHome)
				this.router.navigate(['/']);
		})
	);

	@Effect({ dispatch: false })
	loginRedirect = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.LoginRedirect, AuthAction.AuthActionTypes.Logout),
		tap(authed => {
			this.router.navigate(['/login']);
		})
	);

	@Effect()
	register = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.Register),
		map((action: AuthAction.Register) => action.payload),
		exhaustMap((info) => {
			let apiService;
			if (info.contributor) {
				apiService = this.authService.registerContributor(info.user, info.code, info.siteId)
			} else {
				apiService = this.authService.register(info.user);
			}
			return apiService
				.pipe(
				map(authState => {
					console.log(authState);
					return new AuthAction.RegisterSuccess(info);
				}),
				catchError(error => of(new AuthAction.RegisterFailure(errorHandler.getHttpError(error))))
				)

		})
	);

	@Effect({ dispatch: false })
	logout = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.Logout),
		tap(() => {this.router.navigate(['/'])})
	);

	@Effect()
	update = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.Update),
		exhaustMap((action: AuthAction.Update) =>
			this.authService.updateUser(action.payload)
			.pipe(
				map(result => {
					if (result && result['success'])
						return new AuthAction.UpdateSuccess(action.payload, action.isFreelancer);
					else
						return new AuthAction.UpdateFailure(result.error ? result : 'Update Failure');

				}),
				catchError(error => of(new AuthAction.UpdateFailure(errorHandler.getHttpError(error))))
			)
		)
	);

	@Effect()
	updateSuccess = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.UpdateSuccess),
		exhaustMap((action: AuthAction.UpdateSuccess) =>
			this.authService.getUserInfo()
				.pipe(
					map(res => new AuthAction.GetUserDetailSuccess(res, action.isFreelancer)),
					catchError(error => of(new AuthAction.GetUserDetailFailure(errorHandler.getHttpError(error))))
				)
		)
	);

	@Effect()
	changePassword = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.ChangePassword),
		map((action: AuthAction.ChangePassword) => action.payload),
		exhaustMap((data: any) =>
			this.authService.changePassword(data)
			.pipe(
				map(authState => {
					return new AuthAction.ChangePasswordSuccess();
				}),
				catchError(error => of(new AuthAction.ChangePasswordFailure(errorHandler.getHttpError(error))))
			)
		)
  );

  @Effect()
	addEmail = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.AddEmail),
		exhaustMap((action: AuthAction.AddEmail) =>
			this.authService.addEmail(action.payload)
			.pipe(
				map(result => {
					if (result)
						return new AuthAction.AddEmailSuccess(action.payload);
					else
						return new AuthAction.AddEmailFailure(result.error ? result : 'Add Email Failure');

				}),
				catchError(error => of(new AuthAction.AddEmailFailure(errorHandler.getHttpError(error))))
			)
		)
  );

  @Effect()
	changeEmail = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.ChangeEmail),
		exhaustMap((action: AuthAction.ChangeEmail) =>
			this.authService.updateUser(action.payload)
			.pipe(
				map(result => {
					if (result && result['success'])
						return new AuthAction.ChangeEmailSuccess(action.payload);
					else
						return new AuthAction.ChangeEmailFailure(result.error ? result : 'Update Failure');

				}),
				catchError(error => of(new AuthAction.ChangeEmailFailure(errorHandler.getHttpError(error))))
			)
		)
  );

  @Effect()
	changeUserName = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.ChangeUserName),
		exhaustMap((action: AuthAction.ChangeUserName) =>
			this.authService.updateUser(action.payload)
			.pipe(
				map(result => {
					if (result && result['success'])
						return new AuthAction.ChangeUserNameSuccess(action.payload);
					else
						return new AuthAction.ChangeUserNameFailure(result.error ? result : 'Update Failure');

				}),
				catchError(error => of(new AuthAction.ChangeUserNameFailure(errorHandler.getHttpError(error))))
			)
		)
  );

  @Effect()
	forgottenPasswordVerificationSend = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.ForgottenPasswordVerificationSend),
		exhaustMap((action: AuthAction.ForgottenPasswordVerificationSend) =>
			this.authService.sendVerification(action.payload)
			.pipe(
				map(res => {
					if (res) {
						return new AuthAction.ForgottenPasswordVerificationSent();
					}
					else {
						return new AuthAction.ForgottenPasswordFailure({error: 'ResetPassword Error', errorDescription: 'Verification Send Failed'});
					}
				}),
				catchError(error => of(new AuthAction.ForgottenPasswordFailure(errorHandler.getHttpError(error))))
			)
		),
		tap(() => {
		})
  );

  @Effect()
	forgottenPasswordValidationSend = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.ForgottenPasswordValidationSend),
		exhaustMap((action: AuthAction.ForgottenPasswordValidationSend) =>
			this.authService.getPasswordEmailConfirm(action.payload.code, action.payload.email)
			.pipe(
				map(res => {
					if (res) {
						return new AuthAction.ForgottenPasswordValidated();
					}
					else {
						return new AuthAction.ForgottenPasswordFailure({error: 'ResetPassword Error', errorDescription: 'Validation Failed'});
					}
				}),
				catchError(error => of(new AuthAction.ForgottenPasswordFailure(errorHandler.getHttpError(error))))
			)
		),
		tap(() => {
		})
  );

  @Effect()
	forgottenPasswordUpdate = this.actions$.pipe(
		ofType(AuthAction.AuthActionTypes.ForgottenPasswordUpdate),
		exhaustMap((action: AuthAction.ForgottenPasswordUpdate) =>
			this.authService.changeForgottenPassword(action.payload.code, action.payload.email, action.payload.newPassword)
			.pipe(
				map(res => {
					if (res) {
						return new AuthAction.ForgottenPasswordUpdated();
					}
					else {
						return new AuthAction.ForgottenPasswordFailure({error: 'ResetPassword Error', errorDescription: 'Password Update Failed'});
					}
				}),
				catchError(error => of(new AuthAction.ForgottenPasswordFailure(errorHandler.getHttpError(error))))
			)
		),
		tap(() => {
		})
	);
}
