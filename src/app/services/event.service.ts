import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpRequest, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as lodash from 'lodash';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/timeout';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { APIs } from '@app-shared/constants';
import { AlertService } from '@app/services/alert.service';
import { AppService } from '@app/app.service';

@Injectable()
export class EventService {

	constructor(
		private httpClient: HttpClient,
		private appService: AppService,
		private alertService: AlertService
	) {
	}


	public getEventCalendar(skip: number = 0, take: number = 20, orderBy: string = ''): Observable<any> {
		const header = this.appService.getHttpSiteHeader();
		let params: HttpParams = new HttpParams;

		if (!header)
			return Observable.of([]);

		params = params.append('skip', `${skip}`);
		params = params.append('take', `${take}`);

		if (orderBy)
			params = params.append('orderBy', `${orderBy}`);
			
		return this.httpClient.get(APIs.event, {headers: header, params: params});
	}

	public updateEvent(body: any): Observable<any> {
		const header = this.appService.getHttpSiteHeader();

		if (!header)
			return Observable.of(null);

		return this.httpClient.put(APIs.event, body, {headers: header});
	}
}

