import * as lodash from 'lodash';
import { AuthActions, AuthActionTypes } from '@app-auth/store/actions/auth';
import { User, UserSite, AccountType } from '@app/models';

import { environment } from '@app-environments/environment';
export interface State {
	user: User;
	current_site: UserSite;
	loggedIn: boolean;
  token: string;

  updatePending: boolean;
  updated: boolean;

	error: any;
}

export const initialState: State = {
	user: null,
	current_site: null,
	loggedIn: false,
  token: null,

  updatePending: false,
  updated: false,

	error: null
};

export function reducer(state = initialState, action: AuthActions): State {
	switch (action.type) {
		case AuthActionTypes.SetAuthData: {
			if (action.payload) {
				const user_info = localStorage.getItem('user_info');
				const current_site = localStorage.getItem('current_site');
				const access_token = localStorage.getItem('access_token');
				return {
		  			...state,
					user: user_info ? JSON.parse(user_info) : null,
					current_site: current_site ? JSON.parse(current_site) : null,
					loggedIn: access_token ? true : false,
		  			token: access_token ? access_token : null,
		  			updatePending: false,
					updated: false,
					error: null,
				}
			} else {
				return initialState;
			}
		}

		case AuthActionTypes.Authenticated: {
			return {
				...state,
				loggedIn: true,
				error: null,
				user: action.payload,
			};
		}

		case AuthActionTypes.Logout:
		case AuthActionTypes.NotAuthenticated: {
				localStorage.removeItem('access_token');
				localStorage.removeItem('refresh_token');
				localStorage.removeItem('expires_in');
				localStorage.removeItem('user_info');
				localStorage.removeItem('current_site');
				localStorage.removeItem('glogood_client_id');
				return initialState;
			}

		case AuthActionTypes.Login: {
			return {
				...state,
				user: new User('', action.payload['email'])
			};
		}

		case AuthActionTypes.LoginSuccess: {
			localStorage.setItem('access_token', action.payload['access_token']);
			localStorage.setItem('refresh_token', action.payload['refresh_token']);
			localStorage.setItem('expires_in', action.payload['expires_in']);
			localStorage.setItem('access_date', new Date().toString());
			const user = state.user;
			console.log(action);
			const userdata = action.payload['userdata'].split(',');

			if (user && userdata) {
				user.uid = userdata[0];
				user.accountType = userdata[1];
			}

			return {
				...state,
				user: user,
				loggedIn: true,
				updated: false,
				token: action.payload['access_token']
			};
		}

		case AuthActionTypes.RefreshTokenSuccess: {
			console.log('refresh token', action.payload);
			if (action.payload) {
				localStorage.setItem('access_token', action.payload['access_token']);
				localStorage.setItem('access_date', new Date().toString());
			} else {
				localStorage.removeItem('access_token');
				localStorage.removeItem('expires_in');
				localStorage.removeItem('access_date');
			}
			return {
				...state,
				updated: false,
				token: action.payload ? action.payload['access_token'] : ''
			};
		}

		case AuthActionTypes.RefreshTokenFailure:
		case AuthActionTypes.LoginFailure:
		case AuthActionTypes.GetUserDetailFailure: {
			console.log(action.payload);
			localStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
			localStorage.removeItem('expires_in');
			localStorage.removeItem('user_info');
			localStorage.removeItem('access_date');
			return {
				...state,
				token: null,
				user: null,
				current_site: null,
				loggedIn: false,
				updated: false,
				error: action.payload || 'Token expired'
			};
		}

		case AuthActionTypes.RegisterSuccess: {
			return {
				...state,
				loggedIn: false,
				current_site: null,
				updatePending: false,
				updated: true,
				error: null
			};
		}

		case AuthActionTypes.Update: {
			return {
				...state,
				updatePending: true,
				updated: false,
				error: null
			};
		}

		case AuthActionTypes.UpdateSuccess: {
	  		console.log('success', action.payload);
			let user = state.user;
			user.accountType = action.payload.accountType;
			return {
				...state,
				user: user,
				updatePending: false,
				updated: true
			};
		}

		case AuthActionTypes.UpdateFailure: {
			return {
				...state,
				updatePending: false,
				error: action.payload
			};
		}

		case AuthActionTypes.ChangeEmail: {
				return {
					...state,
					updatePending: true,
					updated: false,
					error: null
				};
		}

		case AuthActionTypes.ChangeEmailSuccess: {
			console.log('success', action.payload);
				localStorage.removeItem('access_token');
				localStorage.removeItem('refresh_token');
				localStorage.removeItem('expires_in');
				localStorage.removeItem('user_info');
				localStorage.removeItem('current_site');
				return {
					...initialState,
					updated: true
				};
		}

		case AuthActionTypes.ChangeEmailFailure: {
		console.log(action);
			return {
					...state,
					updatePending: false,
					error: action.payload
				};
		}

		case AuthActionTypes.AddEmail: {
			return {
					...state,
					updatePending: true,
					updated: false,
					error: null
				};
		}

		case AuthActionTypes.AddEmailSuccess: {
			return {
				...state,
				updatePending: false,
				updated: true
			};
		}

		case AuthActionTypes.AddEmailFailure: {
			return {
				...state,
				updatePending: false,
				error: action.payload
			};
		}

		case AuthActionTypes.ChangeUserName: {
			return {
				...state,
				updatePending: true,
				updated: false,
				error: null
			};
		}

		case AuthActionTypes.ChangeUserNameSuccess: {
			const user = {...state.user, name: action.payload.name};

			return {
				...state,
				user: user,
				updatePending: false,
				updated: true,
			};
		}

		case AuthActionTypes.ChangeUserNameFailure: {
			return {
				...state,
				updatePending: false,
				error: action.payload
			};
		}

		case AuthActionTypes.GetUserSitesSuccess: {
			const sites = action.payload.sort((a,b) =>a.roleId - b.roleId);
			let current_site = sites[0];
			let user = lodash.cloneDeep(state.user);
			user.sites = sites;

			if (action.isFreelacer) {
				const s = sites.find(s=>s.roleId == 2);
				if (s) current_site = s;
			}

			return {
				...state,
				user: user,
				current_site: current_site,
				updated: true,
				error: null
			}
		}

		case AuthActionTypes.GetUserSitesFailure: {
			return {
				...state,
				current_site: null,
				error: action.payload
			}
		}

		case AuthActionTypes.GetUserDetailSuccess: {
			console.log(action.payload);

			action.payload.sites = action.payload.sites ? action.payload.sites.sort((a,b) =>a.roleId - b.roleId) : [];
			let current_site = null;
			if (action.payload.sites.length > 0) {
				let system_site = action.payload.sites.find(s=>s.roleId == 3);
				if (system_site) {
					current_site = system_site;
				} else {
					current_site = action.payload.sites[0];
				}
			}

			if (action.isFreelancer) {
				const s = action.payload.sites.find(s=>s.roleId == 2);
				if (s) current_site = s;
			}

			localStorage.setItem('user_info', JSON.stringify(action.payload));
			localStorage.setItem('current_site', JSON.stringify(current_site));

			return {
				...state,
				user: action.payload,
				current_site: current_site,
					error: null
			}
		}

		case AuthActionTypes.AddUserSite: {
			return {
				...state,
				updatePending: true,
				updated: false,
				error: null
			}
		}

		case AuthActionTypes.AddUserSiteSuccess: {
			let user = lodash.cloneDeep(state.user);
			user.sites = user.sites ? [...user.sites, ...action.payload] : [...action.payload];
			return {
				...state,
				user: user,
				updatePending: false,
				updated: true,
				error: null
			}
		}

		case AuthActionTypes.AddUserSiteFailure: {
			return {
				...state,
				updatePending: false,
				error: action.payload
			}
		}

		case AuthActionTypes.UpdateUserSites: {
			let user = lodash.cloneDeep(state.user);
			if (!user.sites)
				user.sites = [];
			action.payload.forEach(i=> {
				let temp = user.sites.find(s=>s.uid==i.uid);
				if (temp) {
					temp.name = i.name;
					temp.url = i.url;
					temp.roleId = i.roleId;
				}
			})
			return {
				...state,
				user: user,
				error: null
			}
		}

		case AuthActionTypes.DeleteAccount: {
			return {
				...state,
				updatePending: true,
				updated: false,
				error: null
			}
		}

		case AuthActionTypes.DeleteAccountSuccess: {
			console.log('Delete Account Success', action.payload)
			return {
				...initialState,
				updated: true
			}
		}

		case AuthActionTypes.DeleteAccountFailure: {
			console.log('Delete Usersite Fail', action.payload)
			return {
				...state,
				updatePending: false,
				error: action.payload
			}
		}

		case AuthActionTypes.DeleteUserSite: {
			return {
				...state,
				updatePending: true,
				updated: false,
				error: null
			}
		}

		case AuthActionTypes.DeleteUserSiteSuccess: {
			let user = lodash.cloneDeep(state.user);
			let current_site = state.current_site;
			user.sites = user.sites ? user.sites.filter(site=>site.uid != action.payload) : [];

			if (current_site && current_site.uid == action.payload) {
				if (user.sites.length > 0) {
					current_site = user.sites[0];
				} else {
					current_site = null;
				}
			}

			return {
				...state,
				user: user,
				current_site: current_site,
				updatePending: false,
				error: null
			}
		}

		case AuthActionTypes.DeleteUserSiteFailure: {
			console.log('Delete Usersite Fail', action.payload)
			return {
				...state,
				updatePending: false,
				error: action.payload
			}
		}

		case AuthActionTypes.RenameUserSite: {
			return {
				...state,
				updatePending: true,
				updated: false,
				error: null
			}
		}

		case AuthActionTypes.RenameUserSiteSuccess: {
			let user = lodash.cloneDeep(state.user);
			let current_site = state.current_site;
			let temp = user.sites.find(site=>site.uid == action.payload.uid);

			temp.name = action.payload.name;
			temp.url = action.payload.name + '.glogood.com';
			// temp.hostname = action.payload.hostname;

			if (current_site && current_site.uid == action.payload.uid) {
				current_site = temp;
			}

			return {
				...state,
				user: user,
				current_site: current_site,
				updatePending: false,
				updated: true,
				error: null
			}
		}

		case AuthActionTypes.RenameUserSiteFailure: {
		console.log('Rename Usersite Fail', action.payload)
			return {
				...state,
				updatePending: false,
				error: action.payload
			}
		}

		case AuthActionTypes.ChangeUserSiteStatus: {
			return {
				...state,
				updatePending: true,
				updated: false,
				error: null
			}
		}

		case AuthActionTypes.ChangeUserSiteStatusSuccess: {
			let user = lodash.cloneDeep(state.user);
			let current_site = state.current_site;
			let temp = user.sites.find(site=>site.uid == action.payload.site.uid);

			temp.status = action.payload.activate;

			if (current_site && current_site.uid == action.payload.site.uid) {
				current_site = temp;
			}

			return {
				...state,
				user: user,
				current_site: current_site,
				updatePending: false,
				updated: true,
				error: null
			}
		}

		case AuthActionTypes.ChangeUserSiteStatusFailure: {
			console.log('Change Usersite Status Fail', action.payload)
			return {
				...state,
				updatePending: false,
				error: action.payload
			}
		}

		case AuthActionTypes.SetCurrentSite: {
		console.log(action.payload);
			return {
				...state,
				current_site: action.payload
			}
		}

		default: {
			return state;
		}
	}
}

export const getUser = (state: State) => state.user;
export const getCurrentSite = (state: State) => state.current_site;

export const getLoggedIn = (state: State) => state.loggedIn;
export const getToken = (state: State) => state.token;

export const getUpdatePending = (state: State) => state.updatePending;
export const getUpdated = (state: State) => state.updated;

export const getError = (state: State) => state.error;
