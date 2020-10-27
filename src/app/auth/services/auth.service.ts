import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response, URLSearchParams } from '@angular/http';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map'
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
// import { tokenNotExpired, JwtHelper} from 'angular2-jwt';
import { Credentials, User, UserSite } from '@app/models';
import { SERVER_URL, APIs, GoogleAPIInfo } from '@app-shared/constants';
import { AppService } from '@app/app.service';
import { UUID } from '@app-lib/uuid/uuid.service';

@Injectable()
export class AuthService {
	// public jwtHelper: JwtHelper = new JwtHelper();

	constructor(
		private httpClient: HttpClient,
		private appService: AppService
	) {
	}

	getAccessToken() {
		return (localStorage.getItem('access_token'));
	}

	getHttpHeader() {
		if (!this.getAccessToken())
			return null;

		let option = {
				'Content-Type': 'application/json; charset=utf-8',
				'Authorization': 'Bearer ' + this.getAccessToken()
			};
		return new HttpHeaders(option);
	}

	login(credentials: Credentials) {
		let header = {headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8'),};
		let body = new URLSearchParams();
		// let clientId = localStorage.getItem('glogood_client_id');

		// if (!clientId) {
		//   clientId = UUID.UUID();
		//   localStorage.setItem('glogood_client_id', clientId);
		// }

		body.set('grant_type', 'password');
		body.set('username', credentials.email);
		body.set('password', credentials.password);
		body.set('scope', 'offline_access');
		body.set('client_id', 'glgsb');
		body.set('client_secret', '901564A5-E7FE-42CB-B10D-61EF6A8F3654');

		return this.httpClient.post(APIs.auth, body.toString(), header);
	}

	refreshToken() {
		// const currentTime = Date.now();
		// const accessTime = Date.parse(localStorage.getItem('access_date'));
		// const expiration = 24 * 60 * 60 * 1000;
		// const safetyInterval = 5 * 60 * 1000;
		// const timeout = accessTime + expiration - currentTime - safetyInterval;

		// if (timeout <= 0) return Observable.of(null);
		let refresh_token = localStorage.getItem('refresh_token');
		if (!refresh_token) return Observable.of(null);

		let header = {headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8'),};
		let body = new URLSearchParams();
		body.set('grant_type', 'refresh_token');
		body.set('refresh_token', refresh_token);
		body.set('scope', 'offline_access');
		body.set('client_id', 'glgsb');
		body.set('client_secret', '901564A5-E7FE-42CB-B10D-61EF6A8F3654');

		return this.httpClient.post(APIs.auth, body.toString(), header);
	}

	getUserInfo() {
		const headers = this.getHttpHeader();
		if (!headers) return Observable.of(null);
		return this.httpClient.get(APIs.user_info, {headers: headers});
	}

	getUserSites() {
		// add authorization header with jwt token
		const headers = this.getHttpHeader();
		if (!headers) return Observable.of([]);
		return this.httpClient.get(APIs.user_info + '/sites', {headers: headers});
	}

	addSite(body): Observable<any>{
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);
		return this.httpClient.post(APIs.site, body, {headers: headers});
	}

	deleteUserSite(uid: string) {
		const headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return Observable.of(null);
			return this.httpClient.delete(APIs.site + '/' + uid, {headers: headers});
	}

	renameUserSite(body: Object) {
		const headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return Observable.of(null);
			return this.httpClient.post(APIs.site + '/rename', body, {headers: headers});
	}

	changeUserSiteStatus(site: UserSite, activate: string) {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return Observable.of(null);
		headers = headers.set('suid', site.uid);
		return this.httpClient.post(APIs.site + '/status' + activate, '', {headers: headers});
	}

	accessUserSite(body: Object, suid: string) {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return Observable.of(null);
		headers = headers.set('suid', suid);
		return this.httpClient.post(APIs.site + '/contributor', body, {headers: headers});
	}

	deleteAccount() {
		const headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return Observable.of(null);
			return this.httpClient.delete(APIs.account, {headers: headers});
	}

	updateUser(body: User) {
		const headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return Observable.of(null);
		return this.httpClient.post(APIs.account + '/update', body, {headers: headers});
	}

	register(body: User) {
		let headers = new HttpHeaders();
		headers.append('Content-Type', 'application/json; charset=utf-8');
		return this.httpClient.post(APIs.account, body, {headers: headers});
	}

	resendEmail(email) {
		let headers = new HttpHeaders();
		headers.append('Content-Type', 'application/json; charset=utf-8');
		return this.httpClient.post(APIs.account + '/email/resend', {email: email}, {headers: headers});
	}

	checkExistingUserByEmail(email: string) {
		let header = {headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8'),};
		let body = new URLSearchParams();
		body.set('email', email);
		return this.httpClient.post(APIs.account_check_by_email, body.toString(), header);
	}

	getUserEmails() {
		const headers = this.appService.getHttpSiteHeader();
		if (!headers) return Observable.of([]);
		return this.httpClient.get(APIs.account + '/emails', {headers: headers});
	}

	getEmailConfirm(userId: string, code: string, email: string, url: string) {
		let headers = new HttpHeaders();
			headers.append('Content-Type', 'application/json; charset=utf-8');
		let params: HttpParams = new HttpParams;
		params = params.append('userId', '' + userId);
		params = params.append('code', '' + code);

		if (email)
		  params = params.append('email', '' + email);

		return this.httpClient.get( SERVER_URL + url, {headers: headers, params: params});
	}

	sendVerification(email: string, w: string = 'forgot_password') {
		let headers = new HttpHeaders();
		let params: HttpParams = new HttpParams;
		headers.append('Content-Type', 'application/json; charset=utf-8');
		params = params.append('email', email);
		if (w=='forgot_password')
			return this.httpClient.post(APIs.account + '/password/resetlink', {}, {headers: headers, params: params});
		else
			return this.httpClient.post(APIs.account + '/email/confirm', {}, {headers: headers});
	}

	changePassword(body: {email: string, currentPassword: string, newPassword: string}) {
		const headers = this.getHttpHeader();
		if (!headers) return Observable.of(null);
		return this.httpClient.post(APIs.account + '/password/update', body, {headers: headers});
	}

	getPasswordEmailConfirm(code: string, email: string) {
		let headers = new HttpHeaders();
			headers.append('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
		let params: HttpParams = new HttpParams;

		params = params.append('code', '' + code);
		params = params.append('email', '' + email);

		return this.httpClient.post(APIs.account + '/password/token/validate', {}, {headers: headers, params: params});
	}

	changeForgottenPassword(code: string, email: string, password: string) {
		let headers = new HttpHeaders();
		headers.append('Content-Type', 'application/json; charset=utf-8');

		const body = {
			email: email,
			code: code,
			password: password
		}
		// let params: HttpParams = new HttpParams;

		// params = params.append('code', code);
		// params = params.append('email', email);
		// params = params.append('password', password);

		return this.httpClient.post(APIs.account + '/password/reset', body, {headers: headers});
	}

	addEmail(email: string) {
		const headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return Observable.of(null);
		return this.httpClient.post(APIs.account + '/email', { email: email }, {headers: headers});
	}

	acceptContributor(code: string, suid: string) {
		let url = APIs.site + '/contributor/accept';
		const option = {
			'Content-Type': 'application/json; charset=utf-8',
			'suid': suid
		};
		return this.httpClient.post(url, {uid: code}, { headers: new HttpHeaders(option)});
	}

	registerContributor(user: any, code: string = "aca15077-9a17-4016-9271-5dc35e0d959", suid: string = "f8978ce3-290a-46fb-b977-aaeaf74bb00f") {
		let url = APIs.site + '/contributor/signup';
		const option = {
			'Content-Type': 'application/json; charset=utf-8',
			'suid': suid
		};

		user['code'] = code;
		return this.httpClient.post(url, user, { headers: new HttpHeaders(option)});
	}

	googleClientLoad() {
	  let OAUTH2_SCOPES = [
		'https://www.googleapis.com/auth/youtube'
	  ].join(' ');
	  let gapi = (window as any).gapi;

	  gapi.load('client:auth2', () => {
		// Retrieve the singleton for the GoogleAuth library and set up the client.
		(window as any).auth2 = gapi.auth2.init({
		  client_id: GoogleAPIInfo.client_id,
		  cookiepolicy: 'single_host_origin',
		  scope: OAUTH2_SCOPES
		  // Request scopes in addition to 'profile' and 'email'
		  // scope: 'additional_scope'
		})
	  });
	}

	googleSignIn() {
	  let gapi = (window as any).gapi;
	  gapi.auth2.getAuthInstance().signIn().then(() => {
		return Observable.of(true);
	  })
	  .catch((error: any) => {
		return Observable.of(false);
	  });
	}

	googleSignOut() {
	  let gapi = (window as any).gapi;
	  gapi.auth2.getAuthInstance().signOut();
	}
}
