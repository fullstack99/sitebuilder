import { Injectable } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';
import * as Rx from 'rxjs/Rx';
import * as WebFont from "webfontloader";

export type SortFonts =
      'alpha'
    | 'date'
    | 'popularity'
    | 'trending'

export type FontCategory =
      'display'
    | 'handwriting'
    | 'monospace'
    | 'serif'
    | 'sans-serif'

interface GetFontListResponse {
    items: Font[];
}

export interface Font {
    family: string;
    category: FontCategory;
    variants: string[];
    subsets: string[];
    version: string;
    lastModified: string;
    files: { [key: string]: string; };
}

@Injectable()
export class FontsService {
    public _apiKey = 'AIzaSyDh7-jVkYaURoEyxSRZXD3BZBU35bLUT-I';
    public _apiUrl = 'https://www.googleapis.com/webfonts/v1/webfonts';

    public _loadedFonts: { [key: string]: boolean } = {};

    public _myFonts: Font[] = [];
    get myFonts(): Font[] { return this._myFonts; }

    constructor(public _http: Http) {}

    getFontList(sort?: SortFonts): Rx.Observable<Font[]> {
        const search = new URLSearchParams();
        search.append('key', this._apiKey);
        if (sort) { search.append('sort', sort); }

        const url = this._apiUrl + '?' + search.toString();

        return this._http.get(url)
            .map(r => (r.json() as GetFontListResponse).items);
    }

    loadFonts(families: string[]): void {
        const fams = families.filter(f => !this._loadedFonts[f]);

        if (fams.length > 0) {
            WebFont.load({ google: { families: fams } });
            fams.forEach(f => { this._loadedFonts[f] = true; });
        }
    }

    setMyFonts(fonts: Font[]) {
        this._myFonts = fonts;
    }
}
