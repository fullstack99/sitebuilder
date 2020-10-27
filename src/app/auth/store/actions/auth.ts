import { Action } from '@ngrx/store';
import { User, Credentials, UserSite} from '@app/models';

export enum AuthActionTypes {
    SetAuthData = '[Auth] SetAuthData',
    Authenticated = '[Auth] Authenticated',
    NotAuthenticated = '[Auth] Not Authenticated',

    GetUserDetail = '[Auth] Get User Detail',
    GetUserDetailSuccess = '[Auth] Get User Detail',
    GetUserDetailFailure = '[Auth] Get User Detail Failure',

    GetUserSites = '[Auth] Get User Sites',
    GetUserSitesSuccess = '[Auth] Get User Sites Success',
    GetUserSitesFailure = '[Auth] Get User Sites Failure',

    AddUserSite = '[Auth] Add User Site',
    AddUserSiteSuccess = '[Auth] Add User Site Success',
    AddUserSiteFailure = '[Auth] Add User Site Failure',

    UpdateUserSites = '[Auth] Update User Sites',

    RenameUserSite = '[Auth] Rename User Site',
    RenameUserSiteSuccess = '[Auth] Rename User Site Success',
    RenameUserSiteFailure = '[Auth] Rename User Site Failure',

    DeleteUserSite = '[Auth] Delete User Site',
    DeleteUserSiteSuccess = '[Auth] Delete User Site Success',
    DeleteUserSiteFailure = '[Auth] Delete User Site Failure',

    ChangeUserSiteStatus = '[Auth] Change User Site Status',
    ChangeUserSiteStatusSuccess = '[Auth] Change User Site Status Success',
    ChangeUserSiteStatusFailure = '[Auth] Change User Site Status Failure',

    DeleteAccount = '[Auth] Delete Account',
    DeleteAccountSuccess = '[Auth] Delete Account Success',
    DeleteAccountFailure = '[Auth] Delete Account Failure',

    SetCurrentSite = '[Auth] Set Current Site',
    LoginRequired = '[Auth] LoginRequired',

    Login = '[Auth] Login',
    LoginSuccess = '[Auth] Login Success',
    LoginFailure = '[Auth] Login Failure',
    LoginRedirect = '[Auth] Login Redirect',
    Logout = '[Auth] Logout',

    RefreshToken = '[Auth] RefreshToken',
    RefreshTokenSuccess = '[Auth] RefreshToken Success',
    RefreshTokenFailure = '[Auth] RefreshToken Failure',

    Register = '[Auth] Register',
    RegisterSuccess = '[Auth] Register Success',
    RegisterFailure = '[Auth] Register Failure',

    Update = '[Auth] Update',
    UpdateSuccess = '[Auth] Update Success',
    UpdateFailure = '[Auth] Update Failure',

    AddEmail = '[Auth] Add Email',
    AddEmailSuccess = '[Auth] Add Email Success',
    AddEmailFailure = '[Auth] Add Email Failure',

    ChangeEmail = '[Auth] Change Email',
    ChangeEmailSuccess = '[Auth] Change Email Success',
    ChangeEmailFailure = '[Auth] Change Email Failure',

    ChangeUserName = '[Auth] Change User Name',
    ChangeUserNameSuccess = '[Auth] Change User Name Success',
    ChangeUserNameFailure = '[Auth] Change User Name Failure',

    ChangePassword = '[Auth] ChangePassword',
    ChangePasswordSuccess = '[Auth] ChangePassword Success',
    ChangePasswordFailure = '[Auth] ChangePassword Failure',

    ForgottenPasswordVerificationSend = '[Auth] ForgottenPassword Verification Send',
    ForgottenPasswordVerificationSent = '[Auth] ForgottenPassword Verification Sent',
    ForgottenPasswordValidationSend = '[Auth] ForgottenPassword Validation Send',
    ForgottenPasswordValidated = '[Auth] ForgottenPassword Validated',
    ForgottenPasswordUpdate = '[Auth] ForgottenPassword Update',
    ForgottenPasswordUpdated = '[Auth] ForgottenPassword Updated',
    ForgottenPasswordFailure = '[Auth] ForgottenPassword Failure'
}

export class SetAuthData implements Action {
    readonly type = AuthActionTypes.SetAuthData;
    constructor(public payload: any) {}
}
export class Authenticated implements Action {
    readonly type = AuthActionTypes.Authenticated;
    constructor(public payload: any) {}
}

export class NotAuthenticated implements Action {
    readonly type = AuthActionTypes.NotAuthenticated;
    constructor(public payload?: any) {}
}

export class GetUserDetail implements Action {
    readonly type = AuthActionTypes.GetUserDetail;
    constructor(public payload?: any, public isFreelancer?: boolean) {}
}

export class GetUserDetailSuccess implements Action {
    readonly type = AuthActionTypes.GetUserDetailSuccess;
    constructor(public payload?: any, public isFreelancer?: boolean) {}
}

export class GetUserDetailFailure implements Action {
    readonly type = AuthActionTypes.GetUserDetailFailure;
    constructor(public payload?: any) {}
}

export class GetUserSites implements Action {
    readonly type = AuthActionTypes.GetUserSites;
    constructor(public payload?: any, public isFreelacer?: boolean) {}
}

export class GetUserSitesSuccess implements Action {
    readonly type = AuthActionTypes.GetUserSitesSuccess;
    constructor(public payload?: any, public isFreelacer?: boolean) {}
}

export class GetUserSitesFailure implements Action {
    readonly type = AuthActionTypes.GetUserSitesFailure;
    constructor(public payload?: any) {}
}

export class AddUserSite implements Action {
    readonly type = AuthActionTypes.AddUserSite;
    constructor(public payload?: any) {}
}

export class AddUserSiteSuccess implements Action {
  readonly type = AuthActionTypes.AddUserSiteSuccess;
  constructor(public payload: any) {}
}

export class AddUserSiteFailure implements Action {
  readonly type = AuthActionTypes.AddUserSiteFailure;
  constructor(public payload: any) {}
}

export class UpdateUserSites implements Action {
    readonly type = AuthActionTypes.UpdateUserSites;
    constructor(public payload?: any) {}
}

export class RenameUserSite implements Action {
  readonly type = AuthActionTypes.RenameUserSite;
  constructor(public payload: any) {}
}

export class RenameUserSiteSuccess implements Action {
readonly type = AuthActionTypes.RenameUserSiteSuccess;
constructor(public payload: any) {}
}

export class RenameUserSiteFailure implements Action {
readonly type = AuthActionTypes.RenameUserSiteFailure;
constructor(public payload: any) {}
}

export class DeleteUserSite implements Action {
    readonly type = AuthActionTypes.DeleteUserSite;
    constructor(public payload: any) {}
}

export class DeleteUserSiteSuccess implements Action {
  readonly type = AuthActionTypes.DeleteUserSiteSuccess;
  constructor(public payload: any) {}
}

export class DeleteUserSiteFailure implements Action {
  readonly type = AuthActionTypes.DeleteUserSiteFailure;
  constructor(public payload: any) {}
}
export class ChangeUserSiteStatus implements Action {
  readonly type = AuthActionTypes.ChangeUserSiteStatus;
  constructor(public payload: {site: UserSite, activate: string}) {}
}

export class ChangeUserSiteStatusSuccess implements Action {
readonly type = AuthActionTypes.ChangeUserSiteStatusSuccess;
constructor(public payload: {site: UserSite, activate: string}) {}
}

export class ChangeUserSiteStatusFailure implements Action {
readonly type = AuthActionTypes.ChangeUserSiteStatusFailure;
constructor(public payload: any) {}
}

export class DeleteAccount implements Action {
  readonly type = AuthActionTypes.DeleteAccount;
  constructor(public payload: any) {}
}

export class DeleteAccountSuccess implements Action {
readonly type = AuthActionTypes.DeleteAccountSuccess;
constructor(public payload: any) {}
}

export class DeleteAccountFailure implements Action {
readonly type = AuthActionTypes.DeleteAccountFailure;
constructor(public payload: any) {}
}

export class SetCurrentSite implements Action {
    readonly type = AuthActionTypes.SetCurrentSite;
    constructor(public payload?: any, public goHome?: boolean) {}
}

export class LoginRequired implements Action {
    readonly type = AuthActionTypes.LoginRequired;
    constructor(public payload: boolean) {}
}

export class Login implements Action {
    readonly type = AuthActionTypes.Login;
    constructor(public payload: Credentials, public isFreelancer: boolean = false) {}
}

export class LoginSuccess implements Action {
    readonly type = AuthActionTypes.LoginSuccess;
    constructor(public payload?: any, public isFreelancer: boolean = false) {}
}

export class LoginFailure implements Action {
  readonly type = AuthActionTypes.LoginFailure;
  constructor(public payload: any) {}
}

export class LoginRedirect implements Action {
    readonly type = AuthActionTypes.LoginRedirect;
  }

export class Logout implements Action {
  readonly type = AuthActionTypes.Logout;
}

export class RefreshToken implements Action {
    readonly type = AuthActionTypes.RefreshToken;
    constructor() {}
}

export class RefreshTokenSuccess implements Action {
    readonly type = AuthActionTypes.RefreshTokenSuccess;
    constructor(public payload?: any) {}
}

export class RefreshTokenFailure implements Action {
  readonly type = AuthActionTypes.RefreshTokenFailure;
  constructor(public payload: any) {}
}

export class Register implements Action {
    readonly type = AuthActionTypes.Register;
    constructor(public payload: {user: User, login: boolean, isFreelancer: boolean, contributor: boolean, siteId: string, code: string}) {}
}

export class RegisterSuccess implements Action {
    readonly type = AuthActionTypes.RegisterSuccess;
    constructor(public payload: {user: User, login: boolean, isFreelancer: boolean, contributor: boolean, siteId: string, code: string}) {}
}

export class RegisterFailure implements Action {
    readonly type = AuthActionTypes.RegisterFailure;
    constructor(public payload: any) {}
}

export class Update implements Action {
    readonly type = AuthActionTypes.Update;
    constructor(public payload: User, public isFreelancer: boolean) {}
}

export class UpdateSuccess implements Action {
    readonly type = AuthActionTypes.UpdateSuccess;
    constructor(public payload: User, public isFreelancer: boolean) {}
}

export class UpdateFailure implements Action {
    readonly type = AuthActionTypes.UpdateFailure;
    constructor(public payload: any) {}
}

export class AddEmail implements Action {
  readonly type = AuthActionTypes.AddEmail;
  constructor(public payload: string) {}
}

export class AddEmailSuccess implements Action {
  readonly type = AuthActionTypes.AddEmailSuccess;
  constructor(public payload: string) {}
}

export class AddEmailFailure implements Action {
  readonly type = AuthActionTypes.AddEmailFailure;
  constructor(public payload: any) {}
}
export class ChangeEmail implements Action {
  readonly type = AuthActionTypes.ChangeEmail;
  constructor(public payload: User) {}
}

export class ChangeEmailSuccess implements Action {
  readonly type = AuthActionTypes.ChangeEmailSuccess;
  constructor(public payload: User) {}
}

export class ChangeEmailFailure implements Action {
  readonly type = AuthActionTypes.ChangeEmailFailure;
  constructor(public payload: any) {}
}

export class ChangeUserName implements Action {
  readonly type = AuthActionTypes.ChangeUserName;
  constructor(public payload: User) {}
}

export class ChangeUserNameSuccess implements Action {
  readonly type = AuthActionTypes.ChangeUserNameSuccess;
  constructor(public payload: User) {}
}

export class ChangeUserNameFailure implements Action {
  readonly type = AuthActionTypes.ChangeUserNameFailure;
  constructor(public payload: any) {}
}

export class ChangePassword implements Action {
    readonly type = AuthActionTypes.ChangePassword;
    constructor(public payload: {email: string, currentPassword: string, newPassword: string}) {}
}

export class ChangePasswordSuccess implements Action {
    readonly type = AuthActionTypes.ChangePasswordSuccess;
}

export class ChangePasswordFailure implements Action {
    readonly type = AuthActionTypes.ChangePasswordFailure;
    constructor(public payload: any) {}
}

export class ForgottenPasswordVerificationSend implements Action {
  readonly type = AuthActionTypes.ForgottenPasswordVerificationSend;
  constructor(public payload: string) {}
}

export class ForgottenPasswordVerificationSent implements Action {
  readonly type = AuthActionTypes.ForgottenPasswordVerificationSent;
}

export class ForgottenPasswordValidationSend implements Action {
  readonly type = AuthActionTypes.ForgottenPasswordValidationSend;
  constructor(public payload: {code: string, email: string}) {}
}

export class ForgottenPasswordValidated implements Action {
  readonly type = AuthActionTypes.ForgottenPasswordValidated;
}

export class ForgottenPasswordUpdate implements Action {
  readonly type = AuthActionTypes.ForgottenPasswordUpdate;
  constructor(public payload: {code: string, email: string, newPassword: string}) {}
}

export class ForgottenPasswordUpdated implements Action {
  readonly type = AuthActionTypes.ForgottenPasswordUpdated;
}

export class ForgottenPasswordFailure implements Action {
  readonly type = AuthActionTypes.ForgottenPasswordFailure;
  constructor(public payload: any) {}
}

export type AuthActions =
    SetAuthData
  | Authenticated
  | NotAuthenticated
  | GetUserDetail
  | GetUserDetailFailure
  | GetUserSites
  | GetUserSitesSuccess
  | GetUserSitesFailure

  | AddUserSite
  | AddUserSiteSuccess
  | AddUserSiteFailure

  | UpdateUserSites

  | DeleteUserSite
  | DeleteUserSiteSuccess
  | DeleteUserSiteFailure

  | RenameUserSite
  | RenameUserSiteSuccess
  | RenameUserSiteFailure

  | ChangeUserSiteStatus
  | ChangeUserSiteStatusSuccess
  | ChangeUserSiteStatusFailure

  | DeleteAccount
  | DeleteAccountSuccess
  | DeleteAccountFailure

  | SetCurrentSite
  | LoginRequired
  | Login
  | LoginSuccess
  | LoginFailure
  | Logout
  | RefreshToken
  | RefreshTokenSuccess
  | RefreshTokenFailure
  | Register
  | RegisterSuccess
  | RegisterFailure
  | Update
  | UpdateSuccess
  | UpdateFailure

  | AddEmail
  | AddEmailSuccess
  | AddEmailFailure

  | ChangeEmail
  | ChangeEmailSuccess
  | ChangeEmailFailure

  | ChangeUserName
  | ChangeUserNameSuccess
  | ChangeUserNameFailure

  | ChangePassword
  | ChangePasswordSuccess
  | ChangePasswordFailure

  | ForgottenPasswordVerificationSend
  | ForgottenPasswordVerificationSent
  | ForgottenPasswordValidationSend
  | ForgottenPasswordValidated
  | ForgottenPasswordUpdate
  | ForgottenPasswordUpdated
  | ForgottenPasswordFailure;
