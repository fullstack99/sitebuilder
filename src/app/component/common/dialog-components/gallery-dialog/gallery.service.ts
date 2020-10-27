import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions, RequestMethod, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { GalleryInfo, GImage } from '@app-models/gallery-info';

@Injectable()
export class GalleryService {    

    constructor(public http: Http) {
    }

    getGalleryThemes() {
        let galleryThemes: GalleryInfo[] = [];        
        return Observable.of(galleryThemes);
    }
}
