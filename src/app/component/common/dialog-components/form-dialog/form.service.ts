import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions, RequestMethod, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class FormService {

    constructor(public http: Http) {
    }
        
}
