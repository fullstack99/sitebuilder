import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User} from '@app/models';
import { APIs } from '@app-shared/constants';
import { AppService } from '@app/app.service';

@Injectable()
export class FreelancerService {

	constructor(
		public httpClient: HttpClient,
		public appService: AppService		
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

	getFreelancer(expertiseId: number, favorites: boolean, skip: number, take: number): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		let params: HttpParams = new HttpParams;
		
		if (!headers)
			headers = this.appService.getHttpHeader();
		
		if (expertiseId || expertiseId >= 0)
			params = params.append('expertiseId', '' + expertiseId);
		if (favorites)
			params = params.append('favorites', '' + favorites);
		if (skip || skip == 0)
			params = params.append('skip', '' + skip);
		if (take)
			params = params.append('take', '' + take);
		return this.httpClient.get(APIs.freelancer, {headers: headers, params: params});
	}

	getPortfolioSitemap(): Observable<any> {
		const headers = this.appService.getHttpSiteHeader();
		if (!headers) return Observable.of(null);
        return this.httpClient.get(APIs.freelancer_portfolio_sitemap, {headers: headers});
	}
	
	getExpertise(): Observable<any> {
		const headers = this.appService.getHttpHeader();
        return this.httpClient.get(APIs.freelancer + '/expertise', {headers: headers});
	}
	
	addFavorite(uid: string) {
		const headers = this.appService.getHttpSiteHeader();
		if (!headers) return Observable.of(null);
        return this.httpClient.post(APIs.freelancer + '/favorite', {uid: uid}, {headers: headers});
	}

	deleteFavorite(uid: string) {
		const headers = this.appService.getHttpSiteHeader();
		if (!headers) return Observable.of(null);
        return this.httpClient.delete(APIs.freelancer + '/favorite/' + uid, {headers: headers});
	}
}
