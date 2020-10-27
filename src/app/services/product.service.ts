import { Injectable } from '@angular/core';
import {
	HttpClient,
	HttpParams,
	HttpRequest,
	HttpEventType
} from '@angular/common/http';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs';
import { APIs } from '@app/shared/constants';
import { AppService } from '@app/app.service';

@Injectable()
export class ProductService {
	constructor(private appService: AppService, private httpClient: HttpClient) {}

	getProducts(
		skip: number,
		take: number,
		listingUids: string[],
		includeOptions: boolean = false,
		includeInventories: boolean = false
	): Observable<any> {
		const headers = this.appService.getHttpSiteHeader();
		let params: HttpParams = new HttpParams();

		if (skip || skip == 0)
			params = params.append('skip', `${skip}`);
		if (take)
			params = params.append('take', `${take}`);
		if (!!listingUids) {
			listingUids = listingUids.filter(luid => !!luid);
			params = params.append('listingUids', listingUids.toString());
			// params = params.append('listingUids', 'd5fcb24f-a3c5-4431-b4ec-cf2ccb3d3c17,99c3426b-25d2-48ef-a47f-49bf39895ceb');
		}
		if (includeOptions)
			params = params.append('includeOptions', 'true');
		if (includeInventories)
			params = params.append('includeInventories', 'true');
		return this.httpClient.get(APIs.product, {
			headers: headers,
			params: params
		});
	}

	getProduct(
		uid: string,
		includeListingDetails: boolean = false,
		theme: boolean = false
	): Observable<any> {
		const headers = theme
			? this.appService.getHttpHeader()
			: this.appService.getHttpSiteHeader();
		let params: HttpParams = new HttpParams();
		params = params.append('includeListingDetails', '' + includeListingDetails);

		return this.httpClient.get(APIs.product + '/' + uid, {
			headers: headers,
			params: params
		});
	}

	getProductOptions(theme: boolean = false): Observable<any> {
		const headers = theme
			? this.appService.getHttpHeader()
			: this.appService.getHttpSiteHeader();
		return this.httpClient.get(APIs.product + '/options', { headers: headers });
	}

	deleteMyProductOption(id: number): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);
		return this.httpClient.delete(APIs.product + '/myoption/' + id, {
			headers: headers
		});
	}

	getProductKeywords(theme: boolean = false, skip: number = null, take: number = null, search: string = null, ): Observable<any> {
		const headers = theme
			? this.appService.getHttpHeader()
			: this.appService.getHttpSiteHeader();

		let params: HttpParams = new HttpParams();
			if (skip || skip === 0)
				params = params.append('skip', `${skip}`);
			if (take)
				params = params.append('take', `${take}`);
			if (search)
				params = params.append('search', `${search}`);

		return this.httpClient.get(APIs.keyword, { headers: headers, params: params });
	}

	deleteProductKeyword(theme: boolean = false, keyword: string = null): Observable<any> {
		const headers = theme
			? this.appService.getHttpHeader()
			: this.appService.getHttpSiteHeader();

		return this.httpClient.delete(`${APIs.keyword}/${keyword}`, { headers: headers });
	}

	addProducts(body: Object): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);

		const req = new HttpRequest('POST', APIs.product, body, {
			headers: headers,
			reportProgress: true
		});
		return this.httpClient.request(req);
	}

	updateProduct(body: Object): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);

		const req = new HttpRequest('PUT', APIs.product, body, {
			headers: headers,
			reportProgress: true
		});
		return this.httpClient.request(req);
	}

	changeProductSeqence(sequences: Object): Observable<any> {
		const headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);
		return this.httpClient.post(`${APIs.product}/update/sequence`, sequences, { headers: headers });
	}

	deleteProduct(uid: string): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);

		return this.httpClient.delete(APIs.product + '/' + uid, {
			headers: headers
		});
	}

	getProductProductLisitngs(uid: string): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);
		let url = APIs.product + '/productListing/' + uid;
		return this.httpClient.get(url, { headers: headers });
	}

	insertProductProductListing(
		itemUid: string,
		listUid: string
	): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);
		let url = APIs.product + '/productListing/' + itemUid + '/' + listUid;
		return this.httpClient.post(url, {}, { headers: headers });
	}

	deleteProductProductListing(
		itemUid: string,
		listUid: string
	): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);

		let url = APIs.product + '/productListing/' + itemUid + '/' + listUid;
		return this.httpClient.delete(url, { headers: headers });
	}

	getVendors(): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);

		return this.httpClient.get(APIs.vendor, { headers: headers });
	}

	getProductListing(type: number, theme: boolean = false): Observable<any> {
		const headers = theme
			? this.appService.getHttpHeader()
			: this.appService.getHttpSiteHeader();
		return this.httpClient.get(APIs.product_listing + '/?type=' + type, {
			headers: headers
		});
	}

	getPageProductListing(uid: string): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);
		return this.httpClient.get(APIs.product + '/productListing/page/' + uid, {
			headers: headers
		});
	}

	addProductListing(body: Object): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);
		console.log(body);
		return this.httpClient.post(APIs.product_listing, body, {
			headers: headers
		});
	}

	updateProductListing(body: Object): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);

		let url = APIs.product_listing + '/' + 'update';
		return this.httpClient.post(url, body, { headers: headers });
	}

	deleteProductListing(uid: string): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);

		let url = APIs.product_listing + '/' + uid;
		return this.httpClient.delete(url, { headers: headers });
	}

	changeProductListingSeqence(sequences: Object) {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);

		let url = APIs.product_listing + '/update/sequence';
		console.log(sequences);
		return this.httpClient.post(url, sequences, { headers: headers });
	}

	getPromotions(
		skip: number,
		take: number,
		status: number = 1
	): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);
		let params: HttpParams = new HttpParams();
		params = params.append('status', '' + status);

		if (skip) params = params.append('skip', '' + skip);
		if (take) params = params.append('take', '' + take);

		return this.httpClient.get(APIs.promotion, {
			headers: headers,
			params: params
		});
	}

	getPromotion(uid: string): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);

		return this.httpClient.get(APIs.promotion + '/' + uid, {
			headers: headers
		});
	}

	addPromotion(body: Object): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);

		const req = new HttpRequest('POST', APIs.promotion, body, {
			headers: headers,
			reportProgress: true
		});
		return this.httpClient.request(req);
	}

	updatePromotion(body: Object): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);

		const req = new HttpRequest('PUT', APIs.promotion, body, {
			headers: headers,
			reportProgress: true
		});
		return this.httpClient.request(req);
	}

	deletePromotion(uid: string): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers) return new ErrorObservable(`You didn't login`);

		return this.httpClient.delete(APIs.promotion + '/' + uid, {
			headers: headers
		});
	}
}
