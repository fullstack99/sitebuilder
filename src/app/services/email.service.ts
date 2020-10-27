import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as lodash from 'lodash';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/timeout';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Box } from '@app-lib/rect/rect';
import { Page, Item, ItemType, ItemContent, CommonItemContent, ImageItemContent, TextItemContent, ItemGroupContent, EmailMarketInfo, EmailItemGroup, Link, BackgroundInfo, BorderInfo, ButtonInfo } from '@app/models';
import { Contact, List, InList } from "@app-models/email-list";
import { APIs } from '@app-shared/constants';
import { AppService } from '@app/app.service';

@Injectable()
export class EmailService {
	public emailDoc: Document;
	public emailTemplate: HTMLElement = document.createElement('div');
	private timeout = 15000;

	constructor(
		private httpClient: HttpClient,
		private appService: AppService) {
	}

	insertGuests(body: Object): Observable<any>{
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);
		return this.httpClient.post(APIs.content_email + '/contacts', body, {headers: headers});
	}

	getContacts( skip: number, take: number, order: string ): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.contact + "?skip=" + skip + "&take=" + take + "&orderby=" + order;
		return this.httpClient.get(url, {headers: headers});
	}

	getContactsNum(): Observable<any>{
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.contact + '/total';
		return this.httpClient.get(url, {headers: headers});
	}

	getDetailsContact(uid: string): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.contact + "/details/" + uid;
		return this.httpClient.get(url, {headers: headers});
	}

	insertContacts(body: Array<Contact>): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		return this.httpClient.post(APIs.contact, body, {headers: headers});
	}

	updateContact(body: Contact): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);
		return this.httpClient.post(APIs.contact + '/update', body, {headers: headers});
	}

	getLists(): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		return this.httpClient.get(APIs.contact + '/list', {headers: headers});
	}

	insertList(body: string): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.contact + "/list";
		let bodyString = JSON.stringify({ description: body });

		return this.httpClient.post(url, bodyString, {headers: headers});
	}

	updateList(body: List): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.contact + "/list/update";
		return this.httpClient.post(url, body, {headers: headers});
	}

	deleteList(uid: string): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.contact + "/list/" + uid;
		return this.httpClient.delete(url, {headers: headers});
	}

	getInList(listUid: string, skip?: number, take?: number, orderby?: string ): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!listUid)
			return new ErrorObservable(`You didn't select the listing`);
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.contact + "/in_list/" + listUid + "?skip=" + (skip != undefined ? skip : "") + "&take=" + (take != undefined ? take : "") +	"&orderby=" + (orderby != undefined ? orderby : "");
		return this.httpClient.get(url, {headers: headers});
	}

	insertInList(body: InList): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.contact + "/in_list";
		return this.httpClient.post(url, body, {headers: headers});
	}

	removeInList(body: InList): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.contact + "/in_list/delete";
		return this.httpClient.post(url, body, {headers: headers});
	}

	copyLists(from: string, to: string): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.contact + "/in_list/copy/" + from + '/' + to;
		return this.httpClient.post(url, '{}', {headers: headers});
	}

	moveLists(from: string[], to: string): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let url = APIs.contact + '/list/move';
		let body = { fromListUids: from, toListUid: to }
		return this.httpClient.post(url, body, {headers: headers});
	}

	getEmailMarkets(skip: number, take: number): Observable<any> {
		return Observable.of([]);
		// if (!this.appService.getSiteHeader()) return Observable.of([]);

		// let options = new RequestOptions({
		// 	headers: this.appService.getSiteHeader()
		// });

		// let url = APIs.invitation + "?skip=" + skip + "&take=" + take;

		// console.log(url);
		// return this.http.get(url, options).map(r => {
		// 	console.log('result', r.json());
		// 	return r.json();
		// })
		// .catch((err, obs) => {
		// 	if (err.status === 404) {
		// 		return Observable.of([]);
		// 	} else {
		// 		throw err;
		// 	}
		// });
	}

	sendTestEmail(contentEmail: Object): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);
		return this.httpClient.post(APIs.content_email + '/test', contentEmail, {headers: headers});
	}

	getServiceEmails(serviceId: string, active_only: boolean, skip?: number, take?: number): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let params: HttpParams = new HttpParams;
		params = params.append('active_only', '' + active_only);

		if (skip) {
			params = params.append('skip', '' + skip);
			params = params.append('take', '' + take);
		}
		return this.httpClient.get(APIs.content_email + "/service/" + serviceId, {headers: headers, params: params});
	}

	getEmailMarket(uid: string, serviceId: string): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		let params: HttpParams = new HttpParams;
		params = params.append('service_id', '' + serviceId);

		return this.httpClient.get(APIs.content_email + "/" + uid, {headers: headers, params: params});
	}

	insertEmailMarket(body: Object): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);
		return this.httpClient.post(APIs.content_email, body, {headers: headers});
	}

	updateEmailMarket(body: Object): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);
		return this.httpClient.post(APIs.content_email + '/update', body, {headers: headers})
	}

	deleteEmailMarket(uid: string): Observable<any> {
		let headers = this.appService.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);
		return this.httpClient.delete(APIs.content_email + '/' + uid, {headers: headers});
	}

	createEmail(page: Page) {
		this.emailDoc = document.implementation.createHTMLDocument('email');

		let style = document.createElement('style');
		style.type = 'text/css';
		style.appendChild(document.createTextNode(`
			.hidden{
				display:none;
			}

			@media screen  and (max-width: 480px) {
				table, tr, td{
					width: 100% !important;
					display: block !important;
					text-align: center;
				}
				.OneColumnMobile{
					padding-top: 5px !important;
					padding-left: 0px !important;
				}
				.itemMobile{
					margin: auto !important;
				}
			}`
		));
		this.emailDoc.body.appendChild(style);

		let items = page.items.filter(i=>i.itemType != 'HFItem');

		if (items.length>0) {
			let emailItemGroup = this.createEmailTree(new EmailItemGroup('table', items,[]));
			let table = document.createElement('table');
			let tr = document.createElement('tr');
			let td = document.createElement('td');
			table.style.setProperty('width', '100%');
			td.style.setProperty('padding-left', lodash.min(items.map(i=>i.content.box.left)) + 'px ');
			td.style.setProperty('padding-top', lodash.min(items.map(i=>i.content.box.top)) + 'px ');
			td.style.setProperty('padding-bottom', '20px ');
			table.appendChild(tr);
			tr.appendChild(td);
			td.appendChild(this.createEmailTemplate(emailItemGroup));
			this.emailTemplate.innerHTML = '';
			this.emailTemplate.appendChild(table);
			this.emailDoc.body.appendChild(this.emailTemplate);
			document.body.appendChild(style);
			return table;
		}
		return null;
	}

	createEmailTemplate(emailItemGroup: EmailItemGroup, box: Box = new Box()): HTMLElement{
		if (emailItemGroup.items.length == 0) return null;

		let ele: HTMLElement;
		let eleBox: Box = Box.boundingBox(emailItemGroup.items.map(i=>i.content.box)).value;
		switch(emailItemGroup.layout) {
			case 'table':
				let extraTop = 0;
				ele = document.createElement('table');
				emailItemGroup.children.forEach((i, index) => {
					ele.appendChild(this.createEmailTemplate(i, index == 0 ? eleBox.moveTo(eleBox.left, eleBox.top) : eleBox.moveTo(eleBox.left, extraTop)));
					extraTop = Box.boundingBox(i.items.map(i=>i.content.box)).value.bottom;
				});
				break;
			case 'tr':
				let extraLeft = 0;
				ele = document.createElement('tr');
				emailItemGroup.children.forEach((i, index) => {
					ele.appendChild(this.createEmailTemplate(i, index == 0 ? eleBox.moveTo(box.left, box.top) : eleBox.moveTo(extraLeft, box.top)));
					extraLeft = Box.boundingBox(i.items.map(i=>i.content.box)).value.right;
				});
				break;
			case 'td':
				ele = document.createElement('td');
				ele.setAttribute('style', `vertical-align: top; padding-top: ${eleBox.top - box.top}px; padding-left: ${(eleBox.left - box.left)}px; `);
				if (eleBox.top - box.top > 0) {
					ele.setAttribute('class', 'OneColumnMobile');
				}
				if (emailItemGroup.children.length>0) {
					emailItemGroup.children.forEach(i=> {
						ele.appendChild(this.createEmailTemplate(i, eleBox));
					});
				}
				else {
					switch(emailItemGroup.items[0].itemType) {
						case 'ButtonItem':
							ele.appendChild(this.createButton(emailItemGroup.items[0]));
							break;
						case 'TextItem':
							ele.appendChild(this.createText(emailItemGroup.items[0]));
							break;
						case 'ImageItem':
							ele.appendChild(this.createImage(emailItemGroup.items[0]));
							break;
					}
				}
				break;
		}
		return ele;
	}

	splitLayout(workItems: Item[], box: Box, field1: string = 'top', field2: string = 'bottom') {
		let groupItems = workItems.filter(i=>i.content.box[field1] >= box[field1] && i.content.box[field1] < box[field2]);
		workItems = lodash.differenceWith(workItems, groupItems, lodash.isEqual);

		if (workItems.length > 0) {
			if (groupItems.length > 0) {
				groupItems.push(...this.splitLayout(workItems, Box.boundingBox(groupItems.map(i=>i.content.box)).value, field1, field2));
			}
		}
		return groupItems;
	}

	createEmailTree(emailItemGroup: EmailItemGroup): EmailItemGroup{
		switch(emailItemGroup.layout) {
			case 'table':
				let workItems: Item[] = lodash.orderBy(emailItemGroup.items, ['content.box.top', 'content.box.left'], ['asc', 'asc']);
				if (workItems.length < 2) {
					let trItem = new EmailItemGroup('tr', [workItems[0]], []);
					let tdItem: EmailItemGroup;

					if (workItems.length == 1 && workItems[0].itemType == 'ItemGroup') {
						let items = (workItems[0].content as ItemGroupContent).ungroup();
						tdItem = this.createEmailTree(new EmailItemGroup('td', items, []));
					}
					else {
						tdItem = new EmailItemGroup('td', [workItems[0]], []);
					}
					trItem.children = [tdItem];
					emailItemGroup.children = [trItem];
				}
				else {
					while(workItems.length > 0 ) {
						let items = lodash.orderBy(this.splitLayout(workItems, workItems[0].content.box), ['content.box.left'], ['asc']);
						workItems = lodash.differenceWith(workItems, [...items,  workItems[0]], lodash.isEqual);
						let trItem = this.createEmailTree(new EmailItemGroup('tr', items, []));
						emailItemGroup.children.push(trItem);
					}
				}
				break;
			case 'tr':
				workItems = emailItemGroup.items;
				let tdItems: EmailItemGroup[] = [];

				while(workItems.length > 0 ) {
					let tdItem: EmailItemGroup;
					let items = lodash.orderBy(this.splitLayout(workItems, workItems[0].content.box,'left','right'), ['content.box.top'], ['asc']);
					workItems = lodash.differenceWith(workItems, [...items,  workItems[0]], lodash.isEqual);

					if (items.length == emailItemGroup.items.length) {
						tdItem = new EmailItemGroup('td', items, []);
						let tableItem = new EmailItemGroup('table', items, []);
						items.forEach(i=> {
							let subTrItem = new EmailItemGroup('tr', [i], []);
							let subTdItem: EmailItemGroup;

							if (i.itemType == 'ItemGroup') {
								let items = (i.content as ItemGroupContent).ungroup();
								subTdItem = this.createEmailTree(new EmailItemGroup('td', items, []));
							}
							else {
								subTdItem = new EmailItemGroup('td', [i], []);
							}

							subTrItem.children = [subTdItem];
							tableItem.children.push(subTrItem);
						});
						tdItem.children = [tableItem];
						tdItems.push(tdItem);
					}
					else {
						tdItem = this.createEmailTree(new EmailItemGroup('td', items, []));
						tdItems.push(tdItem);
					}
				}

				if (tdItems.length > 1) {
					let tdItem = new EmailItemGroup('td', emailItemGroup.items, []);
					let tableItem = new EmailItemGroup('table', emailItemGroup.items, []);
					let trItem = new EmailItemGroup('tr', emailItemGroup.items, []);
					tdItems.forEach(i=> {
						trItem.children.push(i);
					});
					tableItem.children.push(trItem);
					tdItem.children.push(tableItem);
					emailItemGroup.children.push(tdItem);
				}
				else {
					emailItemGroup.children = tdItems;
				}
				break;
			case 'td':
				workItems = emailItemGroup.items;
				if (workItems.length>0) {
					let tdItem = this.createEmailTree(new EmailItemGroup('table', workItems));
					emailItemGroup.children.push(tdItem);
				}
				break;
		}

		return emailItemGroup;
	}

	createButton(item: Item) {
		let itemContent: CommonItemContent<ButtonInfo> = item.content as CommonItemContent<ButtonInfo>;
		let div = document.createElement('div');
		div.setAttribute('style',
			`width: ${itemContent.box.width()}px; height: ${itemContent.box.height()}px; display: grid; overflow: hidden; text-align: center; vertical-align: middle;
			line-height: ${itemContent.box.height()}px;
			background: ${itemContent.info.value.backColor};
			border: ${itemContent.info.value.border}px solid ${itemContent.info.value.borderColor};
			border-radius: ${itemContent.info.value.corner}px; ${this.getShadow(itemContent)}`);
		div.setAttribute('class', 'itemMobile');
		div.innerHTML = itemContent.info.get().text;
		return div;
	}

	getShadow(itemContent: any): string {
		let result = '';
		if (itemContent.info.value) {
			let bevel = itemContent.info.value.bevel;
			let glow = itemContent.info.value.glow;
			let shadow = itemContent.info.value.shadow;
			result = 'box-shadow: ' + shadow + 'px ' + shadow + 'px ';
			result += glow + 'px rgba(0,0,0,0.4),';
			result += ' inset ' + bevel + 'px ' + bevel + 'px 2px rgba(255,255,255,0.6),';
			result += ' inset -' + bevel + 'px -' + bevel + 'px 2px rgba(0,0,0,0.4)';

			// -moz-box-shadow:
			// -webkit-box-shadow:
		}
		return result;
	}

	createImage(item: Item) {
		let itemContent: ImageItemContent = item.content as ImageItemContent;
		let img = document.createElement('img');
		img.src = itemContent.image.location + '/' + encodeURIComponent(itemContent.image.name);
		img.setAttribute('style', `max-width: 100%; width: ${itemContent.box.width()}px; height: ${itemContent.box.height()}px; ${this.getBorderStyle(itemContent.borderInfo.value)};`);
		img.setAttribute('class', 'itemMobile');
		return img;
	}

	createText(item: Item) {
		let itemContent: TextItemContent = item.content as TextItemContent;
		let div = document.createElement('div');
		div.setAttribute('style',
			`width: ${itemContent.box.width()}px; height: ${itemContent.box.height()}px; word-wrap: break-word; line-height: 1; padding: ${itemContent.padding};
			${this.getBackGroundStyle(itemContent.backInfo.value)}
			${this.getBorderStyle(itemContent.borderInfo.value)}`);
		div.setAttribute('class', 'itemMobile');
		div.innerHTML = itemContent.text;
		return div;
	}

	getLink(link: Link) {
		let target: any = link;
		switch(target.type) {
			case 'page':
				//target.pageNumber.toString()
			case 'lookup':
				//target.pageUid
				break;
			case 'website':
				return 'https://' + target.website;
			case 'email':
				return 'https://' + target.email;
			case 'maps':
				return 'https://' + target.address;
		}
	}

	getBackGroundStyle(info: BackgroundInfo) {
		if (!info) return '';

		let result: string = '';
		let direction: number = 0;
		let amount: string = '0%';
		let color: string = '';

		if (info.backgroundColor.vertical > 0) {
			direction = 0;
			amount = info.backgroundColor.vertical + "%";
		}
		if (info.backgroundColor.horizontal > 0) {
			direction = 1;
			amount = info.backgroundColor.horizontal + "%";
		}

		color = ', ' + info.backgroundColor.startColor + ', ' + amount + ', ' + info.backgroundColor.endColor;

		if (info.backgroundColor.vertical > 0) {
			direction = 0;
			amount = info.backgroundColor.vertical + '%';
		}
		if (info.backgroundColor.horizontal > 0) {
			direction = 1;
			amount = info.backgroundColor.horizontal + '%';
		}

		if (amount == '0%') {
			result = 'background: ' + info.backgroundColor.startColor + '; ';
		}
		else {
			result = 'background: ' + info.backgroundColor.startColor + '; ';
			result += 'background: -webkit-linear-gradient(' + (direction == 0 ? ' top' : ' left') + color + '); ';
			result += 'background: -o-linear-gradient(' + (direction == 0 ? ' bottom' : ' right')  + color + '); ';
			result += 'background: -moz-linear-gradient(' + (direction == 0 ? ' bottom' : ' right')  + color + '); ';
			result += 'background: linear-gradient(to' + (direction == 0 ? ' bottom' : ' right')  + color + '); ';
			result += 'background: linear-gradient(' + (direction == 0 ? ' bottom' : ' right')  + color + '); ';
		}
		if (result == '')
			result = 'transparent';
		return ' ' + result + '; ';
	}

	getBorderStyle(info: BorderInfo) {
		if (!info) return '';

		let result: string;
		if (info) {
			result = ' border: ' + `${info.borderWidth}px solid ${info.borderColor}; `;
			result += ` border-top-left-radius: ${this.getBorderRadius(info, info.lTop)}; `;
			result += ` border-top-right-radius: ${this.getBorderRadius(info, info.rTop)}; `;
			result += ` border-bottom-left-radius: ${this.getBorderRadius(info, info.lBottom)}; `;
			result += ` border-bottom-right-radius: ${this.getBorderRadius(info, info.rBottom)}; `;
			result += ` box-shadow: ${info.shadow}px ${info.shadow}px 5px rgba(0,0,0,0.4); `;
		}
		else {
			result = ' border: 1px solid transparent; ';
		}
		return result;
	}

	getBorderRadius(info: BorderInfo, borderFlag: boolean): string{
		let result: string = '0px';
		if (borderFlag) {
			if (info.borderType == 1) {
				result = info.amount + '%';
			}
			else {
				result = info.amount + 'px';
			}
		}
		return result;
	}

	replyInvitation(body: any) {
		let headers = this.appService.getHttpSiteHeader();
		headers = headers.delete('authorization');

		if (!headers) return Observable.of(null);
		console.log(headers, JSON.stringify(body));
		return this.httpClient.post('https://wsapi.glogood.com/api/invitation', body, {headers: headers})
			.map(res => {
				console.log('reply result', res);
				return res;
			})
			.catch((err, obs) => {
				console.log(err);
				return Observable.of(null);
			});
	}
}
