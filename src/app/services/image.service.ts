import { Injectable, Inject, forwardRef } from '@angular/core';
import { HttpClient, HttpParams, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ImagePath, Folder, Tab, Category } from '@app/models';
import { APIs } from '@app-shared/constants';
import { AppService } from '@app/app.service';

@Injectable()
export class ImageService {

	private readonly tabs = {
		myimages: 'My Images',
		stock: 'Stock Images',
		clipart: 'Image Clipper',
		site: 'Site\'s Image'
	};

	public imageTreeTypes = [
		'myimages', 'editor', 'stock', 'clipart', 'site'
	]

	constructor(
		private httpClient: HttpClient,
		@Inject(forwardRef(() => AppService)) private appService: AppService
	) {
	}

	getTabs(): Observable<Tab[]> {
		return Observable.of(
			Object.keys(this.tabs).map(id => ({ id, name: this.tabs[id] })));
	}

	getTabFolders(tabId: number): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return Observable.of([]);

		let params: HttpParams = new HttpParams();
		if (tabId == 0) {
			params = params.set('type', 'folder');
			params = params.set('path', '');
			return this.httpClient.get(APIs.image, {headers: headers, params: params});
		} else if (tabId == 2) {
			return this.getCategories('stock-clipart');
		} else {
			return this.getCategories('stock-photos');
		}

	}

	addFolder(tabId: number, path: string, name: string): Observable<any> {
		// console.log('tab', tabId, 'path', path, 'name', name);
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.image+'/folder';
		let data = {
				path: path,
				name: name
			};
		return this.httpClient.post(url, data, { headers: headers });
	}

	renameFolder(path: string, name: string, dest: string, source: string = null, subfolders = null): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.image + '/folder/rename' ;

		let data = {
				path: path,
				name: name,
				dest: dest,
				source: source,
				subfolders: subfolders
			};
		console.log(data);
		return this.httpClient.post(url, data, { headers: headers });
	}

	updateFolder(tabId: string, path: string, name: string, dest: string, source: string = null, subfolders = null): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.image + '/folder/update' ;
		let data = {
				path: path,
				name: name,
				dest: dest,
				source: source,
				subfolders: subfolders
			};
		console.log(data);
		return this.httpClient.post(url, data, { headers: headers });
	}

	updateFolderSequence(tabId: number, path: string, name: string, dest: string, sequence: number, source: string = null, subfolders = null): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.image + '/folder/update/sequence';
		let data = {
				path: path,
				name: name,
				dest: dest,
				source: source,
				subfolders: subfolders,
				sequence: sequence
			};
		console.log(data);
		return this.httpClient.post(url, data, { headers: headers });
	}

	removeFolder(tabId: number, path: string, name: string): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let data = {
			type: 'folder',
			path: path,
			name: name
		}
		const req = new HttpRequest('DELETE', APIs.image, data, {headers: headers, reportProgress: true});
		return this.httpClient.request(req);
	}

	getFolderImages(tabId: number, path: string, skip?: number, take?: number): Observable<ImagePath[]> {
		// let url = this._apiUrl + 'file/'
		//	 + encodeURIComponent(path ? tabId + '/' + path : tabId);
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) {
		  headers = this.appService.getHttpNormalHeader();
		  if (!headers) {
			return new ErrorObservable(`You didn't login`);
		  }
		}

		let params = new HttpParams();
		params = params.set('type', 'file');
		// path = path ? tabId + '/' + path : tabId;
		params = params.set('path', path);

		if (skip >= 0) {
			params = params.set('skip', skip.toString());
			if (take > 0)
				params = params.set('take', take.toString());
			else
				params = params.set('take', '9');
		}

		return this.httpClient.get(APIs.image, {headers: headers, params: params})
			.map(res => {
				console.log(res)				;
				return JSON.parse(JSON.stringify(res).toLowerCase());
			})
			.catch((err, obs) => {
				return Observable.of([]);
			});
	}

	removeFolderImage(tabId: number, path: string, filename: string): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let data = {
			type: 'file',
			path: path ? this.imageTreeTypes[tabId] + '/' + path : this.imageTreeTypes[tabId],
			filename: filename
		}
		const req = new HttpRequest('DELETE', APIs.image, data, {headers: headers, reportProgress: true});
		return this.httpClient.request(req);
	}

	renameImage(tabId: string, location: string, name: string, path: string, filename: string, dest: string, source: string = null): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.image + '/image/rename' ;
		let data = {
				name: name,
				location: location,
				path: path,
				filename: filename,
				dest: dest,
				source: source
			};
		console.log(data);
		return this.httpClient.post(url, data, {headers: headers});
	}

	uploadImages(tabId: number, path: string, files: File[]) {
		return this.appService.uploadImages(files, path ? path : '');
	}

	getImages(url: string, skip: number = 0, take: number = 9): Observable<any> {
		url = APIs.system_image + '/' + url + '?skip=' + skip.toString() + '&take=' + take.toString();
		console.log(url);
		return this.httpClient.get(url)
			.map(r => {
				return r;
			})
			.catch((err, obs) => {
				return Observable.of([]);
			});
	}

	getCategories(url: string = ''): Observable<any> {
		url = APIs.system_image_categories + '/' + url;
		return this.httpClient.get(url);
	}
}
