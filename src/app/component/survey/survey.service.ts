import { Injectable } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';
import * as Rx from 'rxjs/Rx';
import { Maybe } from '@app-lib/maybe/maybe';
import { APIs } from '@app-shared/constants';

export interface SurveyInfo {
	thumbnail: string;
	name: string;
}

@Injectable()
export class SurveyService {    
    constructor(
        private _http: Http
    ) { }

    getSurveyThemes(uid: string): Rx.Observable<SurveyInfo[]> {

        let url = APIs.system_themes + '/' + uid;
        console.log(url);
        return this._http.get(url).map(r => r.json())
            .catch((err, obs) => {
                if (err.status === 404) {
                    return Rx.Observable.of([]);
                } else {
                    throw err;
                }
            });
    }

    getCategories(): Rx.Observable<string[]> {
        let url = APIs.system_themes + '/categories';        
        return this._http.get(url).map(r => r.json())
            .catch((err, obs) => {
                if (err.status === 404) {
                    return Rx.Observable.of([]);
                } else {
                    throw err;
                }
            });
    }
}
