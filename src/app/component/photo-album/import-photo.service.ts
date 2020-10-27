import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions, RequestMethod, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs';
import { Maybe } from '@app-lib/maybe/maybe';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Item, BackgroundInfo } from '@app/models';

import { APIs } from '@app-shared/constants';
import { AppService } from '@app/app.service';

export interface PhotoInfo {
    description: string; 
    title: string; 
    keywords: string; 
    items: Item[];
    listingUid: string;
    thumbnail: string;
    siteId: number;
    id: number;
    uid: string;
    version: number;
    background: BackgroundInfo;
}

@Injectable()
export class PhotoCanvasService {    

    constructor(
        private http: Http,
        private _appService: AppService) {        
    }    

    public publishPhoto(body: Object) {
        if (!this._appService.getSiteHeader())
            return Observable.of({ error: true });

        let url = APIs.photo_publish;
        let options = new RequestOptions({ headers: this._appService.getSiteHeader() });
        return this.http.post(url, JSON.stringify(body), options)
            .map((res: Response) => res.json())
            //.map((res: Response) => console.log(res))
            .catch((error: any) => {
                //Observable.throw(error || 'Server Error')
                return Observable.of({ error: true });
            });
    }

}

