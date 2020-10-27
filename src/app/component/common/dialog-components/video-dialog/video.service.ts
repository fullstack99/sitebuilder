import { Injectable, Inject, forwardRef } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import * as Rx from 'rxjs/Rx';
import { APIs } from '@app-shared/constants';
import { AppService } from '@app/app.service';

export interface Video {
    name: string;
    location: string;
}

export interface Folder {
    name: string;
    subfolders: Folder[];
}

export interface Category {
    id: number;
    description: string;
}

@Injectable()
export class VideoService {   

    constructor(
        public _http: Http,
        @Inject(forwardRef(() => AppService)) public _appService: AppService
    ) {       
    }    

    getVideos(url: string, skip: number = 0, take: number = 9): Rx.Observable<Video[]> {
        url = APIs.video + url + '?skip=' + skip.toString() + '&take=' + take.toString();        
        return this._http.get(url).map(r => r.json())
            .catch((err, obs) => {
                if (err.status === 404) {
                    return Rx.Observable.of([]);
                } else {
                    throw err;
                }
            });
    }

    getCategories(): Rx.Observable<Category[]> {
        let url = APIs.system_image_categories + '/' + 'video';
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
