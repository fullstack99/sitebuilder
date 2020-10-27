import { Http, Response, Headers, RequestOptions, RequestMethod, URLSearchParams } from '@angular/http';
import { Injectable } from '@angular/core';
import { Store } from "@ngrx/store";
import { Observable } from 'rxjs';
import { APIs, social_site_url, GoogleAPIInfo, YouTubeAPIInfo, VimeoAPIInfo} from '@app-shared/constants';
import * as youtubeReducer from '@app/stores/reducers/videos/youtube.reducer';

//import { ServerUrl, GoogleAPIInfo, YouTubeAPIInfo, VimeoAPIInfo } from '../../../../../server_url';

// source = 0: youtube, source=1: vimeo

@Injectable()
export class ExtraAPI {
	
	google_auth_url = social_site_url.google_auth;
	youtube_search_url = social_site_url.youtube_search;
	vimeo_search_url = social_site_url.vimeo_search;
	
	google_client_id = GoogleAPIInfo.client_id;	
	youtube_api_token = YouTubeAPIInfo.api_token;
	vimeo_access_token = VimeoAPIInfo.access_token;

	constructor(
		private http: Http,
		private store:Store<youtubeReducer.YoutubeUserProfileState>,
		private userProfileActions: youtubeReducer.UserProfileActions) { }

	youTubeSearch(query: string, pageToken: string='', maxResult: number=2) {
		let queryURL: string;		
		if (pageToken == '')
			queryURL = `${this.youtube_search_url}?q=${query}&key=${this.youtube_api_token}&maxResults=${maxResult}` +
				'&part=snippet' +
				'&type=video';
		else
			queryURL = `${this.youtube_search_url}?pageToken=${pageToken}&q=${query}&key=${this.youtube_api_token}&maxResults=${maxResult}` +
				'&part=snippet' +
				'&type=video';

		return this.http.get(queryURL)
			.map((res: Response) => {
				return res.json();
			})
			.catch((err, obs) => {
			if (err.status === 404) {
				return Observable.of([]);
			} else {
				return Observable.of(['error']);
			}
		});
	}

	vimeoSearch(query: string, maxResult: number = 2, pageNum: number = 1) {
		let queryURL: string;
		maxResult = 12;
		if (pageNum == 1)
			queryURL = `${this.vimeo_search_url}?q=${query}&access_token=${this.vimeo_access_token}&fields=uri,name,duration,modified_time,description,pictures,embed&per_page=${maxResult}`;
		else
			queryURL = `${this.vimeo_search_url}?q=${query}&access_token=${this.vimeo_access_token}&fields=uri,name,duration,modified_time,description,pictures,embed&per_page=${maxResult}&page=` + pageNum;

		return this.http.get(queryURL)
			.map((res: Response) => {				
				return res.json();
			})
			.catch((err, obs) => {
				if (err.status === 404) {
					return Observable.of([]);
				} else {
					return Observable.of(['error']);
				}
			});
	}

	oAuthSignInYouTube(eleId: string) {		
		let OAUTH2_SCOPES = [
				'https://www.googleapis.com/auth/youtube'
			].join(' ');
		let gapi = (window as any).gapi;

		gapi.load('client:auth2', () => {
			// Retrieve the singleton for the GoogleAuth library and set up the client.
			(window as any).auth2 = gapi.auth2.init({
				client_id: this.google_client_id,
				cookiepolicy: 'single_host_origin',
				scope: OAUTH2_SCOPES
				// Request scopes in addition to 'profile' and 'email'
				// scope: 'additional_scope'
			});
			this.attachGoogleSigninYouTube(eleId);
		});
	}

	attachGoogleSigninYouTube(eleId: string) {
		let element = document.getElementById(eleId);
		(window as any).auth2.attachClickHandler(element, {}, (googleUser: any) => {
			let gapi = (window as any).gapi;
			this.store.dispatch(this.userProfileActions.updateUserProfile({name:googleUser.getBasicProfile().getName(), imageUrl: googleUser.getBasicProfile().getImageUrl()}));
			this.store.dispatch(this.userProfileActions.updateToken(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token));			
			this.getAccountVideos();
		}, (error: any) => {
			alert(JSON.stringify(error, undefined, 2));
		});
	}

	getAccountVideos(s: string = '') {
		let gapi = (window as any).gapi;
		// gapi.client.load('youtube', 'v3', () => {
		// 	let request = gapi.client.youtube.channels.list({
		// 		mine: true,				
		// 		part: 'contentDetails'
		// 	});
		// 	request.execute((response: any) => {
		// 		console.log('playList',response.result)			;
		// 		let playlistId = response.result.items[0].contentDetails.relatedPlaylists.uploads;			
		// 		this.requestVideolist(playlistId);
		// 	});			
		// });

		gapi.client.load('youtube', 'v3', () => {
			let request = gapi.client.youtube.search.list({
				forMine: true,
				q: '',
				part: 'snippet',
				type: 'video'
			});
			request.execute((response: any) => {
				console.log('playList',response.result);
			});			
		});		
	}

	requestVideolist(playlistId: string, pageToken: string = '') {
		let gapi = (window as any).gapi;
		let requestOptions = {
			playlistId: playlistId,			
			part: 'snippet',
			maxResults: 10
		};
		if (pageToken) {
			requestOptions['pageToken'] = pageToken;
			console.log(pageToken);
		}
		let request = gapi.client.youtube.playlistItems.list(requestOptions);
		request.execute((response: any) => {
			// Only show pagination buttons if there is a pagination token for the
			// next or previous page of results.
			console.log(response.result);
			let nextPageToken = response.result.nextPageToken;			
			
			let prevPageToken = response.result.prevPageToken			
			
			let playlistItems = response.result.items;
			if (playlistItems) {
				$.each(playlistItems, (index, item) => {

					console.log(item.snippet);					
				});
			} else {
				console.log('error');
			}
		});
	}

	oAuthSignInYouTubeA() {
		let options = new RequestOptions();
		let params: URLSearchParams = new URLSearchParams();
		params.set('client_id', this.google_client_id);
		params.set('redirect_uri', 'https://localhost:4200');
		params.set('response_type', 'token');
		params.set('scope', 'https://www.googleapis.com/auth/youtube.force-ssl');
		params.set('include_granted_scopes', 'true');
		params.set('state', 'state_parameter_passthrough_value');
		options.params = params;
		
		return this.http.get(this.google_auth_url, options)
			.map((res: Response) => {
				console.log('bbb',res);
				return res.json();
			})
			.catch((error: any) => {
				return Observable.throw(error.json().error || 'Server error')
			});
	}

	// ttt() {
	// 	return this.http.get('https://api.vimeo.com/oauth/authorize?client_id=');
	// 		.map((res: Response) => {
	// 			console.log(res.json());
	// 			return res.json();
	// 		})
	// 		.catch((err, obs) => {
	// 			if (err.status === 404) {
	// 				return Observable.of([]);
	// 			} else {
	// 				return Observable.of(['error']);
	// 			}
	// 		});
	// }
}

// .get(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}` +
// 	'&maxResults=50' +
// 	'&type=video' +
// 	'&key=AIzaSyAARhzDEdAwaIYKelgTmVa8Nez5sLKjBcM')
// 	.map(response => response.json())

//https://api.vimeo.com/videos?query=elvis&access_token=<your token>

// const YOUTUBE_URL = 'https://www.googleapis.com/youtube/v3/search';
// const YOUTUBE_API_TOKEN = 'AIzaSyAARhzDEdAwaIYKelgTmVa8Nez5sLKjBcM';
// //const YOUTUBE_API_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU5OGJlNjUxNmIzMTgzNjRjOTBhNDAyYmNhOWJhNzNlYWUxMzk1ZGEifQ.eyJhenAiOiIzOTEyNzYwNTQxNzYtdWZnOWtjN2hwMnJodHRiZDM1Z2lrbzJvbjhlZW04NzkuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIzOTEyNzYwNTQxNzYtdWZnOWtjN2hwMnJodHRiZDM1Z2lrbzJvbjhlZW04NzkuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDg5NTQxMTI0MzI0MzA2NzcwOTgiLCJlbWFpbCI6ImphbnN0ZXZlbnMwOThAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJEU1V6MWw0dmZZZmFudzJjVEo4NF9BIiwiaXNzIjoiYWNjb3VudHMuZ29vZ2xlLmNvbSIsImlhdCI6MTQ5MjQ3MDM1MCwiZXhwIjoxNDkyNDczOTUwLCJuYW1lIjoiSmFuIFN0ZXZlbnMiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tLy1heDFIVzF3RTlkVS9BQUFBQUFBQUFBSS9BQUFBQUFBQUFBQS9BTWNBWWlfbHcza3N2dUo4TXRSVFFqV3Y4WTc0OGxXdzd3L3M5Ni1jL3Bob3RvLmpwZyIsImdpdmVuX25hbWUiOiJKYW4iLCJmYW1pbHlfbmFtZSI6IlN0ZXZlbnMiLCJsb2NhbGUiOiJlbiJ9.KBQgL9T06Q2pU_jgTI3Z5AGLs_Jvf0O0UxTpyac2cHZVuO4eYax43L8V6FGLEXF8knDsiYxmo6z04IO2emfe2PZcdq4g_Yh9h6BU_P1U468X1CvzDqup_asKgopH0Tpk2syk83RNLXe71H__fe2jGSV-PIfAhcM_f2RtBHnDpD9RZ3QxJljwkFsodoSlqDG5p8jygc9yUHLwNC-xTH69PXb39c9vO9XWssaIi8cDsobliDsy30lGwffLuyjMe7-nQSJssLuHa6tirNGvn7KK0hOVCe21x50ct9a3YUhhifDiBsHBU-6gGScN-ayJdfCB8kT1MTpo0Sy0Jp8wgKdQ';
// //const API_TOKEN = 'AIzaSyAJk1xUI72YYfBMgEc84gjHUX-k2AN6-B0';
// //AIzaSyAARhzDEdAwaIYKelgTmVa8Nez5sLKjBcM

// const VIMEO_URL = 'https://api.vimeo.com/videos';
// const VIMEO_ACCESS_TOKEN = '5f6e18e5343c94526cf580d393e8fa28';

// const GoogleAuth_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
// const Google_ClientId = '18532930955-5ltps6aj8qcjpieafbtf7qg6qf175dn5.apps.googleusercontent.com';