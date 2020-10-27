import {Injectable, Inject} from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';

@Injectable()
export class TranslateService {  
  private fundUrl = 'https://scotch-http-api.herokuapp.com/api/comments';
  constructor(private http: Http) { } 

  // Add a new FundInfo
  addFundInfo(body: Object): Observable<any> {
    let bodyString = JSON.stringify(body);
    let headers = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
    let options = new RequestOptions({ headers: headers }); // Create a request option

    return this.http.post(this.fundUrl, body, options) // ...using post request
      .map((res: Response) => res.json()) // ...and calling .json() on the response to return data
      .catch((error: any) => Observable.throw(error.json().error || 'Server error')); //...errors if any
  }  
}