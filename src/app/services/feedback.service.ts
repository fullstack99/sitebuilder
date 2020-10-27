import { Injectable } from '@angular/core';
import { Http, Headers, ResponseContentType, Jsonp } from '@angular/http';
import { HttpClient, HttpParams, HttpHeaders, HttpResponse, HttpRequest } from '@angular/common/http';
import * as Rx from 'rxjs/Rx';
import { APIs } from '@app-shared/constants';

@Injectable()
export class FeedbackService {

    constructor(
      private httpClient: HttpClient,
      private http: Http
    ) {
    }

    public addFeedback(body: Object) {
        let url = APIs.feedback_insert;
        let options: HttpParams = new HttpParams();
        let headers = new HttpHeaders({ 'Content-Type': 'application/json; charset=utf-8' });

        return this.httpClient.post(url, body, {headers: headers})
            .map(res => {
                return res;
            })
            .catch((error: any) => {
                return Rx.Observable.of({ result: false });
            });
    }

    public sendFormData(data: Object) {

        let url = 'https://wsapi.glogood.com/api/form'
        let options: HttpParams = new HttpParams();
        let headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' });
        const body = new FormData();
        body.append('results', JSON.stringify(data));

        return this.http.post(url, body)
          .map(res => {
            return res
          })
          .catch(error => {
            return error
          })

        // return this.httpClient.post(url, body, {headers: headers})
        //     .map(res => {
        //         return res;
        //     })
        //     .catch((error: any) => {
        //         return Rx.Observable.of({ result: false });
        //     });
    }
}
