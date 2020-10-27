import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APIs } from '@app-shared/constants';
import { AppService } from '@app/app.service';

@Injectable()
export class SchedulerService {    
    private timeout = 15000;

    constructor(        
        private httpClient: HttpClient,
        private appService: AppService
    ) { }   

    getScheduler( startTime: string = '', endTime: string = '' ) {
        let headers = this.appService.getHttpSiteHeader();
		if (!headers) return Observable.of(null);		
		return this.httpClient.get(APIs.scheduler, {headers: headers})
			.map(res => {
                console.log(res);
                if (res) {
                    res['isNew'] = false;
				    return this.setPhotoUrl(res);
                }
                else {
                    return res;
                }                
			})
			.catch((err, obs) => {
                console.log(err);
				return Observable.of(null);
			});
    }

    addScheduler( body ) {
        if (!this.appService.getHttpSiteHeader()) return Observable.of(null);        
		return this.httpClient.post(APIs.scheduler, body, {headers: this.appService.getHttpSiteHeader()})
			.map(res => {
                console.log(res);
				return this.setPhotoUrl(res);
			})
			.catch((err, obs) => {
                console.log(err);
				return Observable.of(null);
			});
    }

    updateScheduler( body ) {
        let headers = this.appService.getHttpSiteHeader();
		if (!headers) return Observable.of(null);
        // console.log(JSON.stringify(body));
		return this.httpClient.put(APIs.scheduler, body, {headers: headers})
			.map(res => {
                console.log(res);
				return this.setPhotoUrl(res);
			})
			.catch((err, obs) => {
                console.log(err);
				return Observable.of(null);
			});
    }

    setPhotoUrl(res) {
        if (res && res['providers']) {
            res['providers'].forEach(provider=> {
                if (provider['photo'])
                    provider.dispUrl = 'pages/' + res['uid'] + '/image/' + provider['photo'].name;
            })
        }
        return res;
    }

    getAppointments(start: string, end: string, locationUid: string = null, providerUid: string = null, name: string = null): Observable<any> {
        let headers = this.appService.getHttpSiteHeader();
        if (!headers) return Observable.of(null);
        let params: HttpParams = new HttpParams;
        params = params.append('start', '' + start);
        params = params.append('end', '' + end);        
        if (locationUid)
            params = params.append('locationUid', locationUid);
        if (providerUid)
            params = params.append('providerUid', locationUid);
        if (name)
            params = params.append('name', name);

        return this.httpClient.get(APIs.scheduler + '/appointment', {headers: headers, params: params})
            .map(res => {
                console.log(res);
                return res;
            })
            .catch((error: any) => {
                console.log(error);
                return Observable.of([]);
            });        
    }

    addAppointment(body: Object): Observable<any> {
        let headers = this.appService.getHttpSiteHeader();
        if (!headers) return Observable.of(null);      
        return this.httpClient.post(APIs.scheduler + '/appointment', body, { headers: headers})
            .map(res => res)
            .catch((error: any) => {
                console.log(error);
                return Observable.of(null);
            } );
    }

    updateAppointment(body: Object): Observable<any> {
        let headers = this.appService.getHttpSiteHeader();
        if (!headers) return Observable.of(null);
        return this.httpClient.put(APIs.scheduler + '/appointment', body, { headers: headers})
            .map(res => res)
            .catch((error: any) => {
                console.log(error);
                return Observable.of(null);
            } );
    }

    updateAppointmentStatus(uid: string, status: string) {
        let headers = this.appService.getHttpSiteHeader();
        if (!headers) return Observable.of(null);        
        return this.httpClient.post(APIs.scheduler + '/appointment/status/' + uid + '/' + status, {}, { headers: headers})
            .map(res => res)
            .catch((error: any) => {
                console.log(error);
                return Observable.of(null);
            } );
    }

    deleteAppointment(uid: string): Observable<any> {
        let headers = this.appService.getHttpSiteHeader();
        if (!headers) return Observable.of(null);
        console.log(APIs.scheduler + '/appointment/' + uid);
        return this.httpClient.delete(APIs.scheduler + '/appointment/' + uid, { headers: headers})
            .map(res => res)
            .catch((error: any) => {
                console.log(error);
                return Observable.of(null);
            } );
    }
}