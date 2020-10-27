import { Injectable } from '@angular/core';
import { Http, Headers, ResponseContentType, Jsonp } from '@angular/http';
import { HttpClient, HttpHeaders, HttpParams, HttpRequest, HttpResponse, HttpEventType } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Store, select } from '@ngrx/store';
// import { tokenNotExpired, JwtHelper } from 'angular2-jwt';
import { Observable, Subject } from 'rxjs';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

import {
	assign as _assign,
	cloneDeep as _cloneDeep,
	differenceWith as _differenceWith,
	flattenDepth as _flattenDepth,
	get as _get,
	keys as _keys,
	indexOf as _indexOf,
	isEqual as _isEqual,
	keysIn as _keysIn,
	orderBy as _orderBy,
	max as _max,
	min as _min,

} from 'lodash';
import * as moment from 'moment';
import * as FileSaver from 'file-saver';
import { UploadEvent, FileSystemFileEntry } from 'ngx-file-drop';

import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import * as differenceDeep from '@app-lib/functions/difference-deep';

import { UUID } from '@app-lib/uuid/uuid.service';
import { AppState, getPages, getGlobalItems, getCurrentPage, getCurrentService } from '@app/stores/reducers';
import * as fromAuth from '@app-auth/store/reducers';
import * as Auth from '@app-auth/store/actions/auth';

import {
	Branch, Question, Tree,
	User, Credentials, UserSite,
	FeedbackInfo, Page,
	BackgroundInfo, BackgroundColorInfo, BackgroundImageInfo, BackgroundTilingInfo, BackgroundVideoInfo,
	BorderInfo,
	ButtonInfo,
	DesignInfo,
	GalleryInfo, GImage,
	ImagePath, ImageInfo, Link, FileInfo,
	NavLink, NavInfo,
	ShapeInfo,
	Slide, SlideShowInfo, SocialInfo,
	VideoInfo,
	ScheduleInfo,
	BlogInfo,
	BlogFooterInfo,
	EcommerceInfo,
	EmailMarketInfo,
	EventSetupInfo, EventCalendarInfo,
	FundraisingInfo,
	InvitationInfo,
	PhotoInfo,
	FormInfo, SingleTextInfo, SingleCheckBoxInfo, MultipleChoiceInfo,
	SurveyInfo, RatingInfo, RankInfo, EndSurveyInfo, MatrixChoiceInfo,
		DateInfo, TimeInfo, SurveyCommentInfo, SurveySingleTextInfo,
	SurveyMultiChoiceInfo, SurveyMultiTextsInfo,
	Item, ItemContent, ItemGroupContent,
	HFItemContent, ImageItemContent,
	ShapeItemContent, TextItemContent,
	CommonItemContent, FormItemContent, SurveyItemContent } from '@app/models';

//import { Ribbons } from './component/blog/blog-canvas/blog-canvas-edit/blog-canvas-edit.component';

import { APIs, NonGlobalItemsServices } from '@app-shared/constants';
import { SeriveItemTypes } from '@app-shared/constants/service-item-types';
import { AlertService } from '@app/services/alert.service';
import { environment } from '@app-environments/environment';
@Injectable()
export class AppService {

	public _currentUser: User;
	public _currentSite: UserSite;

	public _currentDashboardView = 'own'; // for Dashboard => true: ownDashboard, false: freelancerDashboard
	public _selectedServiceId = 0; // for Dashboard

	public _currentThemes: { [k: string]: any } = {};
	public _currentThemesViewMode: { [k: string]: any } = {};

	public _savingPage = false;
	public _changed = false;
	public _moblieChanged = false;

	public _originalPage: Page = null;
	public _currentPage: Page = null;
	public _originalMobilePage: Page = null;
	public _mobilePage: Page = null;

	public _pages: { [k: string]: Page } = {};

	public _blog: { [k: string]: {[p: string]: BlogInfo} } = {};
	public _b: {[p: string]: BlogInfo}  = {};
	public _blogList: {[k: string]: Array<string>} = {};

	public _globalItems: Item[] = [];
	public _clipboard: Item[] = [];
	public _currentBlogId = '0';
	public _currentService = 17;
	public _themePage: {
			uid: string;
			themeUid: string;
			listingUid: string;
		} = null;
	public _editingThemeListingUid = '';
	public _multiListing: any = {listings: [], selectListings: []};

	public currentService = 17;
	public currentPageNo = 0;
	public siteMaxPageNo = 0;
	public activeSlideIndex = {};

	public savingTrigger = false;
	public changedAppPage = new Subject<Page>();

	public _changePageNo = new Subject<number>();
	public dispMyAccount = new Subject<string>();
	public refreshThumbnails = new Subject<[string, string, boolean, boolean]>();
	public closeDialog = new Subject<void>();
	public publishSiteSub = new Subject<boolean>();
	public gotoPage = new Subject<[number, boolean]>(); // pageNo, saving previous page

	public user$: Observable<User>;
	public refreshToken$: Observable<any>;
	private currentSite$: Observable<UserSite>;
	public _fontSize = [
		[ 8, 10, 12, 14, 16, 18, 24, 36, 50, 72 ],
		[ 8, 10, 12, 14, 16, 18, 24, 30 ],
		[ 8, 10, 12, 14, 16, 18 ]
	];
	public _textForcolor = 'black';
	public _textBackgroundColor = 'white';
	public _surveyInfo: SurveyInfo = null;
	public downPageNum = 0;
	public sitemapPage: Page;
	public downloadFiles: FileInfo[] = [];
	public exportFiles: FileInfo[] = [];
	public customColors: string[] = []; // stores custom colors in Color Picker dialog
	public textToolCustomColors: string[] = [];
	public currentTextToolColor: string = '#000000';
	private initiated = false;

	constructor(
		public http: Http,
		public httpClient: HttpClient,
		public jsonp: Jsonp,
		public router: Router,
		public store:Store<AppState>,
		private alertService: AlertService
	) {
		this.user$ = this.store.pipe(select(fromAuth.getUser));
		this.currentSite$ = this.store.pipe(select(fromAuth.getCurrentSite));
		this.refreshToken$ = this.store.pipe(select(fromAuth.getToken));

		this.user$.subscribe(res=> {
			this._currentUser = res;
		});

		this.refreshToken$.subscribe(res => {
			// console.log('refresh token', res);
			if (!environment['test'] && res) {
				setTimeout(() => {
					this.store.dispatch(new Auth.RefreshToken());
				}, 86100 * 1000);
			} else if(!environment['test'] && this.initiated) {
				this.store.dispatch(new Auth.Logout());
			}
		});

		this.currentSite$.subscribe(res=> {
			if (this._currentSite && !differenceDeep.isDifference(this._currentSite, res))
				return;
			this.downPageNum = 0;
			this._currentSite = res;
			if (this._currentSite && this._currentSite.roleId == 1) {
				this.publishSiteSub.next(this._currentSite.needsPublish);
				this.getComponents().subscribe((result: any) => {
					console.log(result);
					this.setGlobalItems(result, this.savingTrigger);
				});
			} else {
				this.setGlobalItems([]);
			}
		});

		this.publishSiteSub.subscribe(res => {
			this._currentSite.needsPublish = res;
		});

		this.router.events.filter(e => e instanceof NavigationEnd)
			.subscribe( (n:NavigationEnd) => {
				let s = n.url.split('/');
				this._currentService = s.length > 2 ? Number.parseInt(s[s.length-2]) : 0;
			});

		this.store.select(getCurrentPage)
			.subscribe(data => {
				this._currentPage = data;
			});
		this.store.select(getCurrentService)
			.subscribe(data => {
				this.currentService = data;
			});
		this.initiated = true;
	}

	clean() {
		this._changed = false;
	}
	// ========= User and User Sitemap ================
	getCurrentUser(): Credentials{
		return this._currentUser;
	}

	getCurrentSite() {
		return this._currentSite;
	}

	// ========= Token ===============

	getAccessToken() {
		return (localStorage.getItem('access_token'));
	}

	getHttpHeader() {
		if (!this.getAccessToken())
			return null;

		const option = {
			'Content-Type': 'application/json; charset=utf-8',
			'Authorization': 'Bearer ' + this.getAccessToken(),
			'client_id': 'glgsb',
			'client_secret': '901564A5-E7FE-42CB-B10D-61EF6A8F3654'
		};
		return new HttpHeaders(option);
	}

	getHttpSiteHeader() {
		if (!this.getCurrentSite())
			return null;
		const option = {
			'Content-Type': 'application/json; charset=utf-8',
			'Authorization': 'Bearer ' + this.getAccessToken(),
			'suid': this.getCurrentSite().uid,
			'client_id': 'glgsb',
			'client_secret': '901564A5-E7FE-42CB-B10D-61EF6A8F3654'
		};
		return new HttpHeaders(option);
	}

	getHttpNormalHeader() {
		if (localStorage.getItem('tuid')) {
			const option = {
				'Content-Type': 'application/json; charset=utf-8',
				'tuid': localStorage.getItem('tuid')
				};
			return new HttpHeaders(option);
		}
		return null;
	}

	getHeader() {
		if (!this.getAccessToken())
		return null;

		const option: Object = {
			'Content-Type': 'application/json; charset=utf-8',
			'Authorization': 'Bearer ' + this.getAccessToken(),
			'client_id': 'glgsb',
			'client_secret': '901564A5-E7FE-42CB-B10D-61EF6A8F3654'
		};
		return new Headers(option);
	}

	getSiteHeader() {
		if (!this.getCurrentSite())
			return null;
		// console.log(this.getCurrentSite() ? this.getCurrentSite().uid : '')	;
		const option: Object = {
			'Content-Type': 'application/json; charset=utf-8',
			'Authorization': 'Bearer ' + this.getAccessToken(),
			'suid': this.getCurrentSite().uid,
			'client_id': 'glgsb',
			'client_secret': '901564A5-E7FE-42CB-B10D-61EF6A8F3654'
		};
		return new Headers(option);
	}

	getSiteFormHeader() {
		if (!this.getCurrentSite())
			return null;

		const option: Object = {
			'Authorization': 'Bearer ' + this.getAccessToken(),
			'suid': this.getCurrentSite() ? this.getCurrentSite().uid : '',
			'client_id': 'glgsb',
			'client_secret': '901564A5-E7FE-42CB-B10D-61EF6A8F3654'
		};
		return new Headers(option);
	}

	getNormalHeader() {
		if (localStorage.getItem('tuid')) {
			const option: Object = {
				'Content-Type': 'application/json; charset=utf-8',
				'tuid': localStorage.getItem('tuid'),
				'client_id': 'glgsb',
				'client_secret': '901564A5-E7FE-42CB-B10D-61EF6A8F3654'
			};
			return new Headers(option);
		}
		return null;
	}

	getHttpSiteFormHeader() {
		if (!this.getCurrentSite())
			return null;

		const option = {
			'Authorization': 'Bearer ' + this.getAccessToken(),
			'suid': this.getCurrentSite() ? this.getCurrentSite().uid : '',
			'client_id': 'glgsb',
			'client_secret': '901564A5-E7FE-42CB-B10D-61EF6A8F3654'
			// 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
		};
		return new HttpHeaders(option);
	}

	getHttpNormalFormHeader() {
		if (localStorage.getItem('tuid')) {
			const option = {
				'tuid': localStorage.getItem('tuid'),
				'client_id': 'glgsb',
				'client_secret': '901564A5-E7FE-42CB-B10D-61EF6A8F3654'
		}
		return new HttpHeaders(option);
		} else {
		const option = {
			'suid': '',
			'client_id': 'glgsb',
			'client_secret': '901564A5-E7FE-42CB-B10D-61EF6A8F3654'
		};
		return new HttpHeaders(option);
		};
	}

	getNormalFormHeader() {
		const option: Object = {
			'suid': '',
			'client_id': 'glgsb',
			'client_secret': '901564A5-E7FE-42CB-B10D-61EF6A8F3654'
		};
		return new Headers(option);
	}

	// ========= PageCanvas Pages and CurrentDocId ============

	updateServiceId(n: number) {
		this._selectedServiceId = n;
	}

  	newPage(change_flag: boolean = true, g_enable:boolean = true, mobile: boolean = false) {
		this._themePage = null;
		const serviceId = this._currentService ? this._currentService : 17;
		let page = new Page();
		// page.display = _get(this._currentThemesViewMode, '' + serviceId, 'Laptop');
		page.display = mobile ? 'Mobile' : 'Laptop';
		page.mobileView = mobile;
		page.service = serviceId;

		let mobilePage = _cloneDeep(page);

		page.items.forEach(item =>  {
			item.service = serviceId;
			if (item.hf == 2 && item.itemType == 'HFItem') {
				if (serviceId == 13) {
					item.content.box.top = 2485;
					item.content.box.bottom = 2490;
				}
				if ([16].indexOf(serviceId) >=0) {
					item.content.box.bottom = item.content.box.top + 20;
				}
			}
		});

		mobilePage.items.forEach(item =>  {
			item.service = serviceId;
			if (item.hf == 1 && item.itemType == 'HFItem') {
				item.content.box = new Box(10, 320, 10, 70);
			} else if (item.hf == 2 && item.itemType == 'HFItem') {
				if ([13, 16].indexOf(serviceId) >=0) {
					item.content.box = new Box(10, 320, 432, 452);
				} else {
					item.content.box = new Box(10, 320, 432, 492);
				}
			} else
				item.content.box = new Box(10, 320, 0, 100);  // new Box(0, 320, 0, 150) : Group Item, new Box(10, 300, 10, 120) : HFItem, new Box(0, 320, 0, 300) : SurveyItem, new Box(0, 320, 0, 200) : EcommerceItem
			item.content.mView = 3;
		});

		if (g_enable) {
			page = this.appendGlobalItems(page, null, false, true);
			mobilePage = this.appendGlobalItems(mobilePage, null, true, true);
		}

		this._currentPage = page;
		this._originalPage = _cloneDeep(page);

		this._mobilePage = mobilePage;
		this._originalMobilePage = _cloneDeep(this._mobilePage);

		if (mobile)
			return mobilePage;
		else
			return page;
	}

	updatePage(uid: string, page: Page, mobile: boolean = false, changeFlag: boolean = true) {
		let changed: boolean = false;
		let p = mobile ? this._mobilePage : this._currentPage;
		let op = mobile ? this._originalMobilePage : this._originalPage;

		if (!this._originalPage || !page)
			return;

		const ignoreGlobal = _indexOf(NonGlobalItemsServices, page.service) >= 0;

		if (p && p.uid == uid && changeFlag) {
			let pItems = page.items;
			let oItems = op.items;
			if (differenceDeep.isDifference(page.serviceObject, op.serviceObject)) {
				console.log('difference service object');
				changed = true;
			} else if ((this.isBackgroundInfo(page.background, 2) || this.isBackgroundInfo(op.background, 2)) && differenceDeep.isDifference(page.background, op.background, ['imageScrolling'])) {
				console.log('background difference');
				changed = true;
			} else if (oItems.length != pItems.length) {
				console.log('items difference');
				changed = true;
			} else {
				let items = _differenceWith(page.items, op.items, _isEqual);
				let regularItems = items.filter(item => !item.global);
				if (ignoreGlobal)
					items = regularItems;

				if (items.length > 0) {
					changed = !items.every(item =>  {
						switch (item.itemType) {
							case 'HFItem':
								let oItem = op.items.find(i => i.uid == item.uid);
								if (!oItem || oItem.hf != 2 && !Box.compare(item.content.box, oItem.content.box)) {
									console.log('app service changed box changed', item.hf, _cloneDeep(oItem), _cloneDeep(item.content.box));
									return false;
								}
								if (item.content['visible'] != oItem.content['visible'] || this.isBackgroundInfo(item.content.backInfo.value, 2) && differenceDeep.isDifference(item.content.backInfo, oItem.content['backInfo'], ['imageScrolling']) || differenceDeep.isDifference(item.content.borderInfo,oItem.content['borderInfo'], ['imageScrolling'])) {
									console.log('app service changed 1')
									return false;
								}
								return true;
							case 'TextItem':
								if ((<TextItemContent>item.content).text != '') {
									return false;
								}
								return true;
							case 'ImageItem':
								if ((<ImageItemContent>item.content).image !== undefined) {
									return false;
								}
								return true;
							case 'EcommerceItem':
								let temp = op.items.find(i => i.uid === item.uid);

								if (!temp)
									return false;
								if (temp.content['info'].value.showNavigation !== item.content['info'].value.showNavigation) {
									return false;
								}
								if (temp.content['info'].value.layoutType !== 3 && item.content['info'].value.showNavigation && temp.content['info'].value.layoutType !== item.content['info'].value.layoutType) { // if it is a catalog page
									return false;
								} else {
									if (temp && differenceDeep.isDifference(item, temp, ['info', 'bottom'])) {
										return false;
									} else if (temp) {
										const info = _cloneDeep(item.content['info'].value);
										info.productUids = info.productUids.filter(uid => uid !== '');
										if (differenceDeep.isDifference(info, temp.content['info'].value, ['activeProduct', 'activeListingUid', 'viewDetail', 'page', 'products', 'listingUids', 'listings', 'prevBox'])) {
											return false;
										}
									}
								}
								return true;
							default:
								return false;
						}
					});
				}
			}

			console.log('changed', changed);

			if (!changed && page.uid == '') {
				let bodyItem = page.items.find(i => i.hf <= 0);
				if (bodyItem) {
					console.log('changed', bodyItem);
					changed = true;
				} else {
					let header = page.items.find(i => i.itemType == 'HFItem' && i.hf == 1);
					if (header && header.content['visible']) {
						let hItems = page.items.find(i=>i.itemType != 'HFItem' && i.hf == 1);
						if (hItems) changed = true;
					} else {
						let footer = page.items.find(i=>i.itemType == 'HFItem' && i.hf == 2);
						if (footer && footer.content['visible']) {
							let fItems = page.items.find(i=>i.itemType != 'HFItem' && i.hf == 2);
							if (fItems) changed = true;
						}
					}
				}
			}

			if (mobile)
				this._moblieChanged = changed;
			else
				this._changed = changed;
			this._changed = this._moblieChanged || this._changed;
		}

		if (mobile) {
			this._mobilePage = _cloneDeep(page);
		} else {
			this._currentPage = page;
			this._mobilePage.background.backgroundColor = _cloneDeep(page.background.backgroundColor);
		}

		if (!changeFlag) {
			if (mobile)
				this._originalMobilePage = _cloneDeep(this._mobilePage);
			else
				this._originalPage = _cloneDeep(this._currentPage);
		}
	// console.log('app service updated', changeFlag, changed, this._changed, _cloneDeep(this._originalPage), _cloneDeep(page));
	}

	appendGlobalItems(page: Page, gItems: Item[] = null, mobile: boolean, isNew: boolean = false) {
		const hIndex = page.items.findIndex(item => item.itemType == 'HFItem' && item.hf == 1); // Header in page
		const fIndex = page.items.findIndex(item => item.itemType == 'HFItem' && item.hf == 2); // Footer in page
		let globalItems: Item[] = _cloneDeep(gItems);

		if (gItems == null)
		globalItems = _cloneDeep(this._globalItems);

		const newHFGItems = []; // new global items in Header or Footer
		const newBGItems = []; // new global items in Body
		const newPreHeaderGItems = [];
		let preHeaderBottom = 0;

		globalItems.forEach(gi => {
			if (page.unplacedGlobalItems.indexOf(gi.uid) < 0 && ((gi.content.mView < 3 && !mobile) || (gi.content.mView == 3 && mobile))) {
				const temp = page.items.findIndex(pi => pi.uid == gi.uid);
				if (temp >= 0 ) {
					if (gi.hf == 0) {
						gi.content.box = page.items[temp].content.box;
						gi.id = page.items[temp].id;
					}

					if (gi.itemType == 'HFItem') {
						gi.content.box = gi.content.box.moveTo(page.items[temp].content.box.left, page.items[temp].content.box.top);
						gi.id = page.items[temp].id;
						const appServiceGItem = this._globalItems.find(_gi => _gi.uid == gi.uid);
						if (appServiceGItem) {
							appServiceGItem.content.box = appServiceGItem.content.box.moveTo(page.items[temp].content.box.left, page.items[temp].content.box.top);
						}
					}

					if (gi.itemType == 'HFItem')
						gi.content['visible'] = page.items[temp].content['visible'];
					page.items[temp] = gi;

				} else if (gi.hf == 0) { // items in Body
					newBGItems.push(gi);
				} else if (gi.hf > 0 && gi.itemType != 'HFItem') { // items in Header/Footer
					newHFGItems.push(gi);
				} else if (gi.hf > 0) { // Header/Footer
					const hfIndex = (gi.hf == 1 ? hIndex : fIndex);
					gi.content['visible'] = page.items[hfIndex].content['visible'];
					if (gi.hf == 2)
						gi.content.box = gi.content.box.moveTo(page.items[hfIndex].content.box.left, page.items[hfIndex].content.box.top);
					page.items[hfIndex] = gi;
				} else {
					newPreHeaderGItems.push(gi);
					if (gi.content.box.bottom > preHeaderBottom)
						preHeaderBottom = gi.content.box.bottom;
				}
			}
		});

		if (hIndex >= 0 && page.items[hIndex].content.box.top < preHeaderBottom) {
			page.items[hIndex].content.box = page.items[hIndex].content.box.moveTo(0, preHeaderBottom);
		}

		if (hIndex >= 0 && page.items[hIndex].content['visible']) {
			newBGItems.forEach(i => {
				i.content.box = i.content.box.moveBy(0, page.items[hIndex].content.box.top + page.items[hIndex].content.box.height());
			});
		}

		page.items = page.items.filter(i => globalItems.findIndex(gi => gi.uid == i.uid) >= 0 && i.global || i.itemType == 'HFItem' || !i.global);
		page.items = _orderBy([...page.items, ...newHFGItems, ...newBGItems, ...newPreHeaderGItems],[],[]);
		page.unplacedGlobalItems = page.unplacedGlobalItems.filter(uid => globalItems.findIndex(gItem => gItem.uid == uid) > 0);
		// page.items = _orderBy([hPageItem, fPageItem, ...pageItems, ...hfGItems, ...bGItems],['sequence', 'content.box.top', 'content.box.left'],['asc', 'asc', 'asc']);
		console.log('move......', page);
		return page;
	}

	setGlobalItems(gItems: any, appendToPage: boolean = true, saveGlobal: boolean = true) {
		let temp: Item[] = [];

		if (appendToPage && (!this._currentPage || this._currentPage.service != this._currentService)) {
			this.newPage(false);
		}
		gItems.forEach(gItem =>  {
			if (gItem) {
				temp.push(this.createItem(gItem));
				// if (this._currentSite.uid == '6533de87-52d3-494d-8c42-420afae96b0d')
				// if (['bfbc6982-aebc-4430-9ef3-c8dbb88ec9cb',
				// '541cd0eb-4699-4694-b366-6b245dfe1545',
				// '25d14ada-ba19-4a38-93f8-0119fd1d74f6',
				// '902ad1f8-39f9-4d8a-a3db-f08096495f4a',
				// '689f29b2-5272-4531-8cc4-272c2618af3f',
				// '3a0ac6ca-9073-412f-bb2f-bfb2382a978e',].indexOf(gItem.uid) >= 0)
					// this.deleteComponents(gItem['uid']).subscribe(r => {
					// 	console.log('kkkkk',r);
					// });
				// if (gItem.listingUid == "36bf79ec-9137-422d-aa0e-89cfc841239b")
				// 	this.deleteComponents(gItem['uid']).subscribe(r => {
				// 	console.log('kkkkk',r);
				// });
				// if (gItem.itemType == 'HFItem')
				// 	this.deleteComponents(gItem['uid']).subscribe(r=> {
				//	console.log('kkkkk',r);
				// 	});
				// else if (!f && gItem.hf == 2 && gItem.itemType == 'HFItem')
				// 	f = true;
				// else if (!h && gItem.hf == 1 && gItem.itemType == 'HFItem')
				// 	h = true;
			}
		});
		temp = _orderBy(temp,['sequence'],['asc']);

		if (saveGlobal) {
			this._globalItems = temp;
		}
		if (appendToPage) {
			this._currentPage = this.appendGlobalItems(this._currentPage, temp, false);
			this._mobilePage = this.appendGlobalItems(this._mobilePage, temp, true);
		}
		if (saveGlobal) {
			this.changedAppPage.next(this._currentPage);
			this.store.dispatch({ type: 'CHANGE_GLOBAL', payload: {changed: true} });
		}
	}

	getGlobalItemPosition(items: Item[], header: Item, mobile: boolean = false) {
		if ((header.content as HFItemContent).visible) {
			const temp = items.filter(item => item.hf <= 0 && ((item.content.mView < 3 && !mobile) || (item.content.mView == 3 && mobile)) && item.content.box.top >= header.content.box.top);
			temp.forEach(i=> {
				if (i.content.box.top < header.content.box.top) {
					i.hf = -1;
				} else {
					i.content.box = i.content.box.moveBy(0, 0 - header.content.box.top - header.content.box.height());
				}
			});
		}
	}

	getGlobalItemPositionInPage(items: Item[], header: Item, extra: number) {
		const temp = _cloneDeep(items);
		if ((header.content as HFItemContent).visible) {
			const temp1 = temp.filter(item => item.content.box.top >= header.content.box.top);
			temp1.forEach(i=> {
				i.content.box = i.content.box.moveBy(0, header.content.box.top + header.content.box.height() + extra);
			});
		}
		return temp;
	}

	// getGlobalItemPosition(page: Page, global: boolean, mobile: boolean = false): Item[]{
	// 	let items = page.items.filter(item =>  (item.content.mView < 3 && !mobile) || (item.content.mView == 3 && mobile));
	// 	let hItems = items.filter(item => item.hf == 1 && item.itemType == 'HFItem' && item.global == global);
	// 	let gItems = items.filter(item => item.global == true && (item.hf == 0 || (item.hf == 2 && item.itemType == 'HFItem')));
	// 	let hfGItems = items.filter(item => item.global == true && item.hf != 0 && item.itemType != 'HFItem');

	// 	if (mobile)
	//	console.log('mobile global Item Position', _cloneDeep(this._currentPage), _cloneDeep(this._mobilePage));

	// 	if (hItems.length > 0) {
	//	if ((hItems[0].content as HFItemContent).visible)
	//	  gItems = gItems.map(item => item.setContent(item.content.setBox(item.content.box.moveBy(0, 0 - hItems[0].content.box.height()))));

	//	if (!global && mobile) {
	//	  hItems = this._mobilePage.items.filter(item => item.hf == 1 && item.itemType == 'HFItem' && item.global);
	//	}

	//	if (hItems[0].global) {
	//	  gItems = [hItems[0], ...gItems];
	//	}
	// 	}
	// 	return [...gItems, ...hfGItems];
	// }

	getServiceItem(page: Page, service: number = 17): Item[] {
		const serviceItemType = SeriveItemTypes[`${service}`] || '';
		// let index = page.items.findIndex(item => item.itemType == serviceItemType);
		// return page.items[index];
		const serviceItems = page.items.filter(item => item.itemType == serviceItemType);
		console.log(serviceItems, serviceItemType);
		return serviceItems;
	}

	createThumbnailElement(parentElem: HTMLElement, canvasElem: HTMLElement, maxWidth: number = 1100, height: number = 768): HTMLElement[]{
		let clone = canvasElem.cloneNode(true) as HTMLElement;
		let cloneChildren = clone.childNodes;
		let cloneHeight = Math.min(canvasElem.offsetHeight, height, height * canvasElem.offsetWidth / maxWidth);

		let cloneContainer = document.createElement('div');

		cloneContainer.style.position='absolute';
		cloneContainer.style.top = '0px';
		cloneContainer.style.left = '0px';
		cloneContainer.style.opacity = '0';
		cloneContainer.style.overflow = 'hidden';
		parentElem.appendChild(cloneContainer);

		clone.style.position = 'relative';
		clone.style.width = canvasElem.offsetWidth + 'px';
		clone.style.height = cloneHeight + 'px';
		clone.style.overflow = 'hidden';
		clone.style.transform = 'scale(1)';

		for (let i = 0; i < cloneChildren.length; i++) {
			const child = cloneChildren[i] as HTMLElement;

			if (child.style && child.style.top) {
				if (parseInt(child.style.top.split('px')[0]) > cloneHeight)
					clone.removeChild(child);
			}
		}

		cloneContainer.appendChild(clone);
		return [cloneContainer, clone];
  	}

	createPage(page: any, g_enable: boolean = true, mobile: boolean, thumbnail: boolean = false) {
		let newPage: Page = Object.assign(new Page, page);
		let items: Item[] = [];

		if (!page.items)
			page.items = [];
		else
			page.items.forEach(i=> {
				if (thumbnail && (i.hf < 2 && i.content.box.top >= 768)) return;
				const item: Item = this.createItem(i, page.serviceObject);
				items.push(item);
			});

		newPage.items = items;

		if (newPage.items.findIndex(item => item.itemType == 'HFItem' && item.hf == 1 && item.global) < 0) {
			const item = new Item(0, 0, UUID.UUID(), 'HFItem', new HFItemContent(), 1, false, true, 100, '', page.service);
			item.content.mView = mobile ? 3 : 1;
			newPage.items.push(item);
		}
		if (newPage.items.findIndex(item => item.itemType == 'HFItem' && item.hf == 2) < 0) {
			const item = new Item(0, 0, UUID.UUID(), 'HFItem', new HFItemContent().setBox(mobile ? new Box(10, 320, 432, 492) : new Box(10, 1080, 400, 500)), 2, false, true, 100, '', page.service);
			item.content.mView = mobile ? 3 : 1;
			newPage.items.push(item);
		}

		if (g_enable) {
			newPage = this.appendGlobalItems(newPage, null, mobile);
		}
		const footer = newPage.items.find(i => i.hf == 2 && i.itemType == 'HFItem');
		const maxBottom = Math.max(
				400, ...newPage.items.filter(i => i.hf == 0).map(i => i.content.box.bottom)
			);
		if (footer) {
			footer.content.box = footer.content.box.moveTo(footer.content.box.left, maxBottom + 50);
		}
		newPage.background = this.setBackground(page.background);
		return newPage;
	}

	downPage(page: any, g_enable: boolean = true, mobile: boolean = false, thumbnail: boolean = false, changeable: boolean = true) {

		const roleId = _get(this._currentSite, 'roleId');

		if (!!this._themePage && roleId != 3) {
			page.uid = '';
		}

		let newPage = page;
		let newMobilePage: Page = _cloneDeep(page);

		this._currentService = page.service;
		newPage.items = newPage.items.filter(i => i.content.mView < 3);
		newMobilePage.items = newMobilePage.items.filter(i => i.content.mView == 3);

		newPage = this.createPage(newPage, g_enable, false);
		newMobilePage = this.createPage(newMobilePage, g_enable, true);

		newMobilePage.background.backgroundColor = _cloneDeep(newPage.background.backgroundColor);

		if (thumbnail)
			return mobile ? newMobilePage : newPage;

		this._currentPage = newPage;
		this._originalPage = _cloneDeep(newPage);

		this._mobilePage = newMobilePage;
		this._originalMobilePage = _cloneDeep(newMobilePage);

		if (changeable) {
			if ([1, 2].indexOf(roleId) >= 0) {
				this._changed = !!this._themePage;
			} else if (roleId == 3) {
				this._changed = false;
			} else if (!this.downPageNum) {
				this._changed = false;
			} else {
				this._changed = true;
			}
		} else {
			this._changed = false;
		}

		this.downPageNum += 1;

		if (mobile)
			return this._mobilePage;
		else
			return this._currentPage;
	}

	createItem(page_item: any, serviceObject: any = null) {
		let item: Item;
		let itemContent: any;
		let info: any;
		let content = page_item.content;

		switch (page_item.itemType) {
			case 'HFItem':
				let items: Item[] = [];
				itemContent = Object.assign(new HFItemContent, content);
				itemContent = (itemContent as HFItemContent).setItems(items);
				break;
			case 'TextItem':
				itemContent = Object.assign(new TextItemContent, content);
				break;
			case 'ButtonItem':
				itemContent = Object.assign(new CommonItemContent<ButtonInfo>(null), content);
				itemContent = (itemContent as CommonItemContent<ButtonInfo>)
					.setInfo(
					Maybe.just<ButtonInfo>(Object.assign(ButtonInfo.empty(), content.info.value))
					);
				itemContent.link = itemContent.link;
				break;
			case 'ImageItem':
				itemContent = Object.assign(new ImageItemContent, content) as ImageItemContent;
				break;
			case 'NavItem':
				let navLinks: NavLink[] = [];
				content.info.value.links.forEach((navlink: NavLink) => {
				let newLink = Object.assign(new NavLink, navlink);
				let subLinks = newLink.sublinks.map(sublink=>Object.assign(new NavLink, sublink));
				navLinks.push(newLink.setSublinks(subLinks));
				});
				itemContent = Object.assign(new CommonItemContent<NavInfo>(null), content);
				itemContent = (itemContent as CommonItemContent<NavInfo>)
					.setInfo(
					Maybe.just(
						Object.assign(NavInfo.empty(), content.info.value)
						.setLinks(navLinks)
						.setDesign(Object.assign(DesignInfo.empty(), content.info.value.design))
						.setImageInfo(Object.assign(ImageInfo.empty(), content.info.value.imageInfo))
					)
					);

				break;
			case 'ShapeItem':
				itemContent = Object.assign(new ShapeItemContent, content);
				itemContent = (itemContent as ShapeItemContent)
						.setInfo(
						Maybe.just(Object.assign(ShapeInfo.empty(), content.info.value))
					);
				break;
			case 'GalleryItem':
				let gImages: GImage[] =[];
				if (content.info.value.gimages) {
					content.info.value.gImages = content.info.value.gimages;
					delete content.info.value.gimages;
				}
				content.info.value.gImages.map((gImage) => {
					const temp = Object.assign(new GImage, gImage);
					if (!temp.name)
						temp.name = '';
					gImages.push(temp);
				});
				itemContent = Object.assign(new CommonItemContent<GalleryInfo>(null), content);
				itemContent = (itemContent as CommonItemContent<GalleryInfo>)
					.setInfo(
						Maybe.just(Object.assign(GalleryInfo.empty(), content.info.value).setGImages(gImages))
					);
				break;
			case 'SlideShowItem':
				let slides: Slide[] = [];
				content.info.value.slides.map((slide: Slide) => {
					const newSlide = Object.assign(new Slide, slide);
					slides.push(newSlide);
				});
				itemContent = Object.assign(new CommonItemContent<SlideShowInfo>(null), content);
				itemContent = (itemContent as CommonItemContent<SlideShowInfo>)
						.setInfo(
						Maybe.just(Object.assign(SlideShowInfo.empty(), content.info.value).setSlides(slides))
					);
				break;
			case 'ItemGroup':
				itemContent = Object.assign(new ItemGroupContent(new Box(),[]), content);
				itemContent = itemContent.setItems(content.items.map((item: any) =>this.createItem(item)));
				break;
			case 'VideoItem':
				itemContent = Object.assign(new CommonItemContent<VideoInfo>(null), content);
				itemContent = (itemContent as CommonItemContent<VideoInfo>)
						.setInfo(
						Maybe.just(Object.assign(VideoInfo.empty(), content.info.value))
					);
				break;
			case 'SocialItem':
				itemContent = Object.assign(new CommonItemContent<SocialInfo>(null), content);
				itemContent = (itemContent as CommonItemContent<SocialInfo>)
						.setInfo(
						Maybe.just(
							new SocialInfo( content.info.value.type, content.info.value.ribbons	)
						)
					);
				break;
			case 'SingleTextItem':
				itemContent = this.createCommonItemContent(new SingleTextInfo(), content);
				break;
			case 'SingleCheckItem':
				itemContent = this.createCommonItemContent(new SingleCheckBoxInfo(), content);
				break;
			case 'MultiChoiceItem':
				itemContent = this.createCommonItemContent(new MultipleChoiceInfo(), content);
				break;
			case 'RatingItem':
				itemContent = this.createCommonItemContent(new RatingInfo(), content);
				break;
			case 'RankItem':
				itemContent = this.createCommonItemContent(new RankInfo(), content);
				break;
			case 'MatrixChoiceItem':
				itemContent = this.createCommonItemContent(new MatrixChoiceInfo(), content);
				break;
			case 'DateItem':
				itemContent = this.createCommonItemContent(new DateInfo(), content);
				break;
			case 'TimeItem':
				itemContent = this.createCommonItemContent(new TimeInfo(), content);
				break;
			case 'SurveySingleTextItem':
				itemContent = this.createCommonItemContent(new SurveySingleTextInfo(), content);
				break;
			case 'SurveyCommentItem':
				itemContent = this.createCommonItemContent(new SurveyCommentInfo(), content);
				break;
			case 'SurveyMultiChoiceItem':
				itemContent = this.createCommonItemContent(new SurveyMultiChoiceInfo(), content);
				break;
			case 'SurveyMultiTextsItem' :
				itemContent = this.createCommonItemContent(new SurveyMultiTextsInfo(), content);
				break;
			case 'EndSurveyItem':
				if (content.info.value && serviceObject) {
					content.info.value = serviceObject;
				}
				itemContent = this.createCommonItemContent(new EndSurveyInfo(), content);
				break;
			case 'FormItem':
				itemContent = Object.assign(new FormItemContent, content);
				itemContent.info = Maybe.just(
						new FormInfo(
							_get(content, 'info.value.formName', ''),
							'',
							this.createBox(_get(content, 'info.value.box', new Box(50, 350, 50, 200))),
							_get(content, 'info.value.formType')
						)
					);
				itemContent.items = content.items.map((item: any) => this.createItem(item));
				break;
			case 'SurveyItem':
				let branches = content.info.value.branches.map(branch=> {
					branch = _assign(new Branch, branch);
					let questions = branch.questions.map(question=> {
						question = _assign(new Question, question);
						question.items = question.items.map(item => this.createItem(item));
						return question;
					});
					branch.questions = questions;
					return branch;
				});
				itemContent = Object.assign(new SurveyItemContent, content);
				itemContent = (itemContent as SurveyItemContent)
					.setInfo(
						Maybe.just(
						new SurveyInfo(
							content.info.value.surveyName,
							branches
						)
						)
					);
				itemContent.items = content.items.map((item: any) =>this.createItem(item));
				break;
			case 'AppointmentItem':
				if (content.info.value && serviceObject) {
					content.info.value = serviceObject;
					content.info.value['isNew'] = false;
					if (content.info.value['providers']) {
						content.info.value['providers'].forEach(provider=> {
							if (provider['photo'])
								provider.dispUrl = 'pages/' + content.info.value['uid'] + '/image/' + provider['photo'].name;
						});
					}
				}
				itemContent = this.createCommonItemContent(new ScheduleInfo(), content);
				break;
			case 'EcommerceItem':
				if (content.info.value && serviceObject) {
					content.info.value['activeListingUid'] = serviceObject['activeListingUid'];
					if (serviceObject['productUids']) {
						content.info.value['productUids'] = content.info.value['productUids'].filter(i => serviceObject['productUids'].indexOf(i) >= 0)
					}
					if (serviceObject['showNavigation']) {
						content.info.value['showNavigation'] = serviceObject['showNavigation'];
					}
					serviceObject.layoutType = content.info.value['layoutType'];
				}
				itemContent = this.createCommonItemContent(new EcommerceInfo(), content);
				break;
			case 'EmailMarketItem':
				itemContent = this.createCommonItemContent(new EmailMarketInfo(), content);
				break;
			case 'DonationItem':
				itemContent = this.createCommonItemContent(new FundraisingInfo(), content);
				break;
			case 'EventSetupItem':
				itemContent = this.createCommonItemContent(EventSetupInfo.empty(), content);
				break;
			case 'InvitationItem':
				itemContent = this.createCommonItemContent(new InvitationInfo(), content);
				break;
			case 'BlogItem':
				itemContent = this.createCommonItemContent(new BlogInfo(), content);
				break;
			case 'BlogFooterItem':
				itemContent = this.createCommonItemContent(new BlogFooterInfo(), content);
				break;
			case 'PhotoItem':
				itemContent = this.createCommonItemContent(new PhotoInfo(), content);
				break;
			case 'SitemapItem':
				itemContent = new CommonItemContent<any>(null, new Box(10, 310, 50, 500));
				break;
			case 'EventCalendarItem':
				itemContent = this.createCommonItemContent({allView: false}, content);
				break;
		}

		itemContent = itemContent
			.setBox(Object.assign(new Box, content.box));
		itemContent = itemContent
			.setMBox(Object.assign(new Box, content.mBox));

		if (content.borderInfo && content.borderInfo.value)
			itemContent = itemContent.setBorderInfo(Maybe.just(this.setBorder(content.borderInfo.value)));
		else if (content.borderInfo)
			itemContent = itemContent.setBorderInfo(Maybe.nothing<BorderInfo>());

		if (content.backInfo && content.backInfo.value)
			itemContent = itemContent.setBackInfo(Maybe.just(this.setBackground(content.backInfo.value)));
		else if (content.backInfo)
			itemContent = itemContent.setBackInfo(Maybe.nothing<BackgroundInfo>());

		item = Object.assign(new Item, page_item);
		item = item.setContent(itemContent);
		return item;
	}

	createCommonItemContent(info: any, content: any) {
		let itemContent = _assign(new CommonItemContent(Maybe.just(info)), content);
		info = _assign(info, content.info.value);
		if (info.labelBox)
			info.labelBox = this.createBox(info.labelBox);
		if (info.totalBox)
			info.totalBox = this.createBox(info.totalBox);
		if (info.textBox)
			info.textBox = this.createBox(info.textBox);
		if (info.commentBox)
			info.commentBox = this.createBox(info.commentBox);
		if (info.textBoxes) {
			info.textBoxes = info.textBoxes.map(textBox=>this.createBox(textBox));
		}
		if (info.startDate) {
			info.startDate = new Date(info.startDate);
		}
		if (info.endDate) {
			info.endDate = new Date(info.endDate);
		}
		if (info.rsvpByDate) {
			info.rsvpByDate = new Date(info.rsvpByDate);
		}

		if (info.eventActivitiesInfo) {
			if (info.eventActivitiesInfo.activities) {
				info.eventActivitiesInfo.activities = info.eventActivitiesInfo.activities.map(
						activity=> {
						if (activity.startDate)
							activity.startDate = new Date(activity.startDate);
						if (activity.endDate)
							activity.endDate = new Date(activity.endDate);
						if (activity.fee.earlyPriceEndDate)
							activity.fee.earlyPriceEndDate = new Date(activity.fee.earlyPriceEndDate);
						return activity;
					}
				);
			}
			if (info.eventActivitiesInfo.admission) {
				if (info.eventActivitiesInfo.admission.earlyPriceEndDate)
					info.eventActivitiesInfo.admission.fee.earlyPriceEndDate = new Date(info.eventActivitiesInfo.admission.earlyPriceEndDate);
			}
		}

		if (info.eventInfo) {
			if (info.eventInfo.startDate)
				info.eventInfo.startDate = new Date(info.eventInfo.startDate);
			if (info.eventInfo.endDate)
				info.eventInfo.endDate = new Date(info.eventInfo.endDate);

			_keys(info.eventInfo).map(key => {
				if (key == 'name') {
					info['title'] = info.eventInfo['name'];
				} else if (key == 'showImageOnEventCalendarOnly') {
					info['displayImage'] = info.eventInfo['showImageOnEventCalendarOnly'];
				} else if (key == 'eventContactName') {
					info['contact'] = info.eventInfo['eventContactName'];
				} else {
					info[key] = info.eventInfo[key];
				}
			});
			delete(info.eventInfo);
		}

		itemContent.info = Maybe.just(info);
		return itemContent;
	}

	createBox(box: any) {
		return new Box(box.left, box.right, box.top, box.bottom);
	}

	setBackground(backInfo: any): BackgroundInfo{
		let resultInfo = BackgroundInfo.empty();
		if (backInfo.backgroundColor) {
			resultInfo.backgroundColor = Object.assign(BackgroundColorInfo.empty(), backInfo.backgroundColor);
		}
		if (backInfo.backgroundImage)
			resultInfo.backgroundImage = Object.assign(BackgroundImageInfo.empty(), backInfo.backgroundImage);
		if (backInfo.backgroundTiling)
			resultInfo.backgroundTiling = Object.assign(BackgroundTilingInfo.empty(), backInfo.backgroundTiling);
		if (backInfo.backgroundVideo)
			resultInfo.backgroundVideo = Object.assign(BackgroundVideoInfo.empty(), backInfo.backgroundVideo);

		return resultInfo;
	}

	setBorder(borderInfo: any): BorderInfo{
		let resultInfo =  Object.assign(BorderInfo.empty(), borderInfo);
		return resultInfo;
	}

	isBackgroundInfo(backInfo: BackgroundInfo, n: number): boolean {
		if (!backInfo)
			return false;
		const backgroundColor: BackgroundColorInfo = BackgroundColorInfo.empty();

		switch (n) {
			case 1:
				if (!backInfo.backgroundColor || _isEqual(backInfo.backgroundColor, backgroundColor))
					return false;
				else
					return true;
			case 2:
				if (backInfo.backgroundColor && !_isEqual(backInfo.backgroundColor, backgroundColor)) {
					return true;
				}
				if (backInfo.backgroundImage && !_isEqual(backInfo.backgroundImage, BackgroundImageInfo.empty())) {
					return true;
				}
				if (backInfo.backgroundTiling && !_isEqual(backInfo.backgroundTiling, BackgroundTilingInfo.empty())) {
					return true;
			}
		}
		return false;
  	}

	mobileToLaptop(mobilePage: Page, latopPage: Page, maxWidth: number): Page {
		const laptopItem = latopPage.items.find(item => item.itemType != 'HFItem' && item.content.mView < 3 && !item.global);
		if (laptopItem) return latopPage;
		const mobileItem = mobilePage.items.find(item => item.itemType != 'HFItem' && item.content.mView == 3 && !item.global);
		if (!mobileItem) return latopPage;

		let mItems = mobilePage.items.filter(i=> i.itemType != 'HFItem');
		let newItems = mItems.map(i=> { // create a list if moblie items.
		i.content.mView = 2; // set mView = 2 for Laptop item.
		if (i.itemType == 'NavItem') {
			return i.setContent(i.content.setBox(new Box(10, maxWidth - 10, 20, 55))).setUID(UUID.UUID());
		} else {
			const x = Math.floor((maxWidth - 320) / 2);
			return i.setContent(i.content.setBox(i.content.box.moveBy(x, 50))).setUID(UUID.UUID());
		}
		// else if (i.content.box.width() > maxWidth) {
		// 	let h = Math.round(i.content.box.height() * maxWidth / i.content.box.width());
		// 	return i.setContent(i.content.setBox(i.content.box.setBottom(i.content.box.top + h).setRight(i.content.box.left + maxWidth))).setUID(UUID.UUID());
		// }
		});

		let lHFItems = latopPage.items.filter(item => item.itemType == 'HFItem'); // Laptop HFItems in appService
		let lHeader = lHFItems.find(item => item.hf == 1);
		let lFooter = lHFItems.find(item => item.hf == 2);
		// let mHFItems = this._mobilePage.items.filter(item => item.itemType == 'HFItem'); // Mobile HFItems in appService
		// let mHeader = mHFItems.find(item => item.hf == 1);
		// let mFooter = mHFItems.find(item => item.hf == 2);
		latopPage.items = [lHeader, lFooter, ...newItems];
		return latopPage;
	}

	laptopToMobile(laptopPage: Page, mobilePage: Page, laptopChange = false, maxWidth = 310) {
		let cItems = laptopPage.items.filter(i=> i.itemType != 'HFItem' && i.content.mView == 1);
		let gCItems = cItems.filter(i=> i.itemType == 'ItemGroup');

		gCItems.forEach(gc=> {
			if (gc.content.box.width() > maxWidth) {
				if (laptopChange)
					gc.content.mView = 2;
				const ungroupedItems = (gc.content as ItemGroupContent).ungroup();
				cItems = [
					...cItems.filter(i => i !== gc),
					...ungroupedItems
				];
			}
		});

		cItems = cItems.map(i => {  // create a list if moblie items.
			if (laptopChange) i.content.mView = 2; // set mView = 2 for Laptop item.
			if (i.itemType == 'NavItem') {
				return i.setContent(i.content.setBox(new Box(280, 315, 10, 35))).setUID(UUID.UUID());
			}
			else if (i.content.box.width() > maxWidth) {
				let h = Math.round(i.content.box.height() * maxWidth / i.content.box.width());
				return i.setContent(i.content.setBox(i.content.box.setBottom(i.content.box.top + h).setRight(i.content.box.left + maxWidth))).setUID(UUID.UUID());
			}
			return i.setUID(UUID.UUID());
		});

		let lHFItems = this._currentPage.items.filter(item => item.itemType == 'HFItem'); // Laptop HFItems in appService
		let lHeader = lHFItems.find(item => item.hf == 1);
		let lFooter = lHFItems.find(item => item.hf == 2);
		let mHFItems = this._mobilePage.items.filter(item => item.itemType == 'HFItem'); // Mobile HFItems in appService
		let mHeader = mHFItems.find(item => item.hf == 1);
		let mFooter = mHFItems.find(item => item.hf == 2);
		let existItems = [[],[],[],[]]; // Mobile Items in appService
		let workItems = [[],[],[],[]];
		let existHeights = [0, 0, 0, 0];

		for (let i = 0; i < 4; i++) { // 0: preHeader, 1: body items, 2: header items, 3: footer items
			if (i == 0) { // preheader
				if (mHeader && mHeader.content['visible']) {
					existItems[i] = this._mobilePage.items.filter(item => item.hf == 0  && item.content.box.bottom <= mHeader.content.box.top);
				}
				if (lHeader && lHeader.content['visible']) {
					workItems[i] = cItems.filter(item => item.hf == 0 && item.content.box.bottom <= lHeader.content.box.top);
				}
			} else if (i==1) { // body
				if (mHeader && mHeader.content['visible']) {
					existItems[i] = this._mobilePage.items.filter(item => item.hf == 0 && item.content.box.top >= mHeader.content.box.bottom);
				}
				else {
					existItems[i] = this._mobilePage.items.filter(item => item.hf == 0);
				}

				if (lHeader && lHeader['visible']) {
					workItems[i] = cItems.filter(item => item.hf == 0 && item.content.box.top >= lHeader.content.box.bottom);
				} else {
					workItems[i] = cItems.filter(item => item.hf == 0);
				}
			} else if (i == 2) { // header
				if (mHeader) {
					existItems[i] = this._mobilePage.items.filter(item => item.hf == 1 && item.itemType != 'HFItem');
				}
				if (lHeader) {
					workItems[i] = cItems.filter(item => item.hf == 1);
				}
			} else { // footer
				if (mFooter) {
					existItems[i] = this._mobilePage.items.filter(item => item.hf == 2 && item.itemType != 'HFItem');
				}
				if (lFooter) {
					workItems[i] = cItems.filter(item => item.hf == 2);
				}
			}
			existHeights[i] = existItems[i].length == 0 ? 0 : Box.boundingBox(existItems[i].map(i=>i.content.box)).value.height();
		}

		let resultItems = [];
		let bodyHeight = 0;

		workItems.forEach((wi, index) => {
			let height = 10 + existHeights[index];
			let left = 5;
			let layoutItems = [];
			let resultLayoutItems = [];

			if (wi.length > 0) {
				wi = _orderBy(wi,['content.box.top'],['asc']);

				while(wi.length > 0) {
					let groupItems = this.splitLayout(wi, wi[0].content.box);
					layoutItems.push(groupItems);
					wi = _differenceWith(wi, groupItems, _isEqual);
				}

				layoutItems.forEach(gi=> {
					gi = _orderBy(gi,['content.box.left'],['asc']);
					let gsItems = this.splitBySize(gi);
					gsItems.forEach(gs=> {
						if (gs.length > 1) {
						Box.boundingBox(gs.map(i=>i.content.box))
							.map(box => {
								gs.forEach(i => {
									i.content.box = i.content.box.moveBy(left, height - box.top);
									i.content.mView = 3;
								});
								height += box.height() + 10;
							});
						}
						else {
							gs[0].content.box = gs[0].content.box.moveBy(left, height - gs[0].content.box.top);
							gs[0].content.mView = 3;
							height += gs[0].content.box.height() + 10;
						}
					});
					resultLayoutItems.push(gsItems);
				});

				if (index < 2) {
					bodyHeight += height;
				}

				if (index == 0 && mHeader) {
					mHeader.content.box = mHeader.content.box.moveTo(0, height);
				} else if (index == 2 && mHeader) { // set header height
					if (height + 10 > mHeader.content.box.height())
						mHeader.content.box.bottom = mHeader.content.box.top + height + 10;

					if (mHeader.content['visible'])
						bodyHeight += mHeader.content.box.height();
					} else if (index == 3 && mFooter) {
						if (height + 10 > mFooter.content.box.height())
							mFooter.content.box.bottom = mFooter.content.box.top + height + 10;
						if (bodyHeight > mFooter.content.box.top)
							mFooter.content.box = mFooter.content.box.moveTo(0, bodyHeight);
					}
				}
				resultItems.push(resultLayoutItems);
		});

		let newPage = _cloneDeep(mobilePage);
		newPage.items = _flattenDepth(existItems, 2);
		console.log('mobile_1', _cloneDeep(newPage.items));

		newPage.items.push(..._flattenDepth(resultItems, 3));
		console.log('mobile_2', _flattenDepth(resultItems, 3));

		if (mHeader) newPage.items.push(mHeader);
		if (mFooter) {
			if ([13].indexOf(newPage.service) >=0) {
				mFooter.content.box.top = 1235;
				mFooter.content.box.bottom = 1240;
			} else {

			}
			newPage.items.push(mFooter);
		}

		console.log('mobile_3', _cloneDeep(newPage.items));
		return newPage;
	}

	makeMobileLayout(maxWidth: number = 310) {
		let cItems = this._currentPage.items.filter(i=> i.itemType != 'HFItem' && i.content.mView == 1);
		let gCItems = cItems.filter(i=> i.itemType == 'ItemGroup');

		gCItems.forEach(gc=> {
		if (gc.content.box.width() > maxWidth) {
			gc.content.mView = 2;
			const ungroupedItems = (gc.content as ItemGroupContent).ungroup();
			cItems = [
			...cItems.filter(i => i !== gc),
			...ungroupedItems
			];
		}
		});

		cItems = cItems.map(i=> { // create a list if moblie items.
		i.content.mView = 2; // set mView = 2 for Laptop item.
		if (i.itemType == 'NavItem') {
			return i.setContent(i.content.setBox(new Box(280, 315, 10, 35))).setUID(UUID.UUID());
		} else if (i.content.box.width() > maxWidth) {
			let h = Math.round(i.content.box.height() * maxWidth / i.content.box.width());
			return i.setContent(i.content.setBox(i.content.box.setBottom(i.content.box.top + h).setRight(i.content.box.left + maxWidth))).setUID(UUID.UUID());
		}
		return i.setUID(UUID.UUID());
		});

		let lHFItems = this._currentPage.items.filter(item => item.itemType == 'HFItem'); // Laptop HFItems in appService
		let lHeader = lHFItems.find(item => item.hf == 1);
		let lFooter = lHFItems.find(item => item.hf == 2);
		let mHFItems = this._mobilePage.items.filter(item => item.itemType == 'HFItem'); // Mobile HFItems in appService
		let mHeader = mHFItems.find(item => item.hf == 1);
		let mFooter = mHFItems.find(item => item.hf == 2);
		let existItems = [[],[],[],[]]; // Mobile Items in appService
		let workItems = [[],[],[],[]];
		let existHeights = [0, 0, 0, 0];

		for(let i = 0; i < 4; i++) { // 0: preHeader, 1: body items, 2: header items, 3: footer items
		if (i==0) { // preheader
			if (mHeader && mHeader.content['visible']) {
			existItems[i] = this._mobilePage.items.filter(item => item.hf == 0  && item.content.box.bottom <= mHeader.content.box.top);
			}
			if (lHeader && lHeader.content['visible']) {
			workItems[i] = cItems.filter(item => item.hf == 0 && item.content.box.bottom <= lHeader.content.box.top);
			}
		} else if (i==1) { // body
			if (mHeader && mHeader.content['visible']) {
			existItems[i] = this._mobilePage.items.filter(item => item.hf == 0 && item.content.box.top >= mHeader.content.box.bottom);
			}
			else {
			existItems[i] = this._mobilePage.items.filter(item => item.hf == 0);
			}

			if (lHeader && lHeader['visible']) {
			workItems[i] = cItems.filter(item => item.hf == 0 && item.content.box.top >= lHeader.content.box.bottom);
			}
			else {
			workItems[i] = cItems.filter(item => item.hf == 0);
			}
		} else if (i==2) { // header
			if (mHeader) {
			existItems[i] = this._mobilePage.items.filter(item => item.hf == 1 && item.itemType != 'HFItem');
			}
			if (lHeader) {
			workItems[i] = cItems.filter(item => item.hf == 1);
			}
		} else { // footer
			if (mFooter) {
			existItems[i] = this._mobilePage.items.filter(item => item.hf == 2 && item.itemType != 'HFItem');
			}
			if (lFooter) {
			workItems[i] = cItems.filter(item => item.hf == 2);
			}
		}
		existHeights[i] = existItems[i].length == 0 ? 0 : Box.boundingBox(existItems[i].map(i=>i.content.box)).value.height();
		}

		let resultItems = [];
		let bodyHeight = 0;

		workItems.forEach((wi, index) => {
			let height: number = 10 + existHeights[index];
			let left: number = 5;
			let layoutItems = [];
			let resultLayoutItems = [];

			if (wi.length > 0) {
				wi = _orderBy(wi,['content.box.top'],['asc']);

				while(wi.length > 0) {
					let groupItems = this.splitLayout(wi, wi[0].content.box);
					layoutItems.push(groupItems);
					wi = _differenceWith(wi, groupItems, _isEqual);
				}

				layoutItems.forEach(gi=> {
					gi = _orderBy(gi,['content.box.left'],['asc']);
					let gsItems = this.splitBySize(gi);
					gsItems.forEach(gs=> {
						if (gs.length > 1) {
							Box.boundingBox(gs.map(i=>i.content.box))
								.map(box => {
								gs.forEach(i => {
									i.content.box = i.content.box.moveBy(left, height - box.top);
									i.content.mView = 3;
								});
								height += box.height() + 10;
								});
						} else {
							gs[0].content.box = gs[0].content.box.moveBy(left, height - gs[0].content.box.top);
							gs[0].content.mView = 3;
							height += gs[0].content.box.height() + 10;
						}
				});
				resultLayoutItems.push(gsItems);
				});

				if (index < 2) {
					bodyHeight += height;
				}

				if (index == 0 && mHeader) {
					mHeader.content.box = mHeader.content.box.moveTo(0, height);
				}
				else if (index == 2 && mHeader) { // set header height
					if (height + 10 > mHeader.content.box.height())
						mHeader.content.box.bottom = mHeader.content.box.top + height + 10;
					if (mHeader.content['visible'])
						bodyHeight += mHeader.content.box.height();
				}
				else if (index == 3 && mFooter) {
					if (height + 10 > mFooter.content.box.height())
						mFooter.content.box.bottom = mFooter.content.box.top + height + 10;
					if (bodyHeight > mFooter.content.box.top)
						mFooter.content.box = mFooter.content.box.moveTo(0, bodyHeight);
				}
			}
			resultItems.push(resultLayoutItems);
		});
		let newPage = _cloneDeep(this._mobilePage);
		newPage.items = _flattenDepth(existItems, 2);
		console.log('mobile_1', _cloneDeep(newPage.items));
		newPage.items.push(..._flattenDepth(resultItems, 3));
		console.log('mobile_2', _flattenDepth(resultItems, 3));
		if (mHeader)
			newPage.items.push(mHeader);
		if (mFooter) {
			if ([13].indexOf(newPage.service) >=0) {
				mFooter.content.box.top = 1235;
				mFooter.content.box.bottom = 1240;
			} else {

			}
			newPage.items.push(mFooter);
		}

		console.log('mobile_3', _cloneDeep(newPage.items));
		return newPage;
	}

	splitLayout(workItems: Item[], box: Box, field1: string = 'top', field2: string = 'bottom') {
		if (box.top==0 && box.bottom==0) return workItems;
		let groupItems = workItems.filter(i=>i.content.box[field1] >= box[field1] && i.content.box[field1] < box[field2]);
		workItems = _differenceWith(workItems, groupItems, _isEqual);

		if (workItems.length > 0) {
			if (groupItems.length > 0) {
				groupItems.push(...this.splitLayout(workItems, Box.boundingBox(groupItems.map(i=>i.content.box)).value, field1, field2));
			}
		}
		return groupItems;
	}

	splitBySize(workItems: Item[], field: string = 'right', size: number = 310) {
		Box.boundingBox(workItems.map(item => item.content.box))
			.map(box => {
				workItems = workItems.map(i => i.setContent(i.content.setBox(i.content.box.moveBy(-box.left, -box.top))));
			});

		let groupItems: Item[][] = [workItems.filter(i=>i.content.box[field] <= size)];
		workItems = _differenceWith(workItems, groupItems[0], _isEqual);

		if (workItems.length > 0) {
			if (groupItems.length > 0) {
				groupItems.push(...this.splitBySize(workItems, field, size));
			}
		}
		return groupItems;
	}

	dataURLtoFile(dataurl: string, filename: string) {
		const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1];
		let bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
		
		while (n--) {
			u8arr[n] = bstr.charCodeAt(n);
		}
		return new File([u8arr], filename, {type:mime});
	}

	// getPages(): Maybe<{ [k: string]: Page }> {
	// 	return Maybe.just(this._pages);
	// }

	// lenPages(): number{
	// 	return Object.keys(this._pages).length;
	// }

	// ========= Feedback ===========

	public _feedbacks: { [k: string]: FeedbackInfo } = {};

	getFeedback(code: string): Maybe<FeedbackInfo> {
		return Maybe.prop(this._feedbacks, code);
	}

	updateFeedback(code: string, feedback: FeedbackInfo) {
		this._feedbacks[code] = feedback;
	}

	getBlogList(uid: string): Maybe<Array<string>> {
		return Maybe.prop(this._blogList, uid);
	}

	updateBlogList(uid: string, blogList: Array<string>) {
		if (this._currentBlogId == uid)
			this._changed = true;
		else
			this._changed = false;
		this._currentBlogId = uid;
		this._blogList[uid]= blogList;
	}

	removeBlogList(uid: string) {
		delete this._blog[uid];
		delete this._blogList[uid];
	}

	updateBlog(uid: string, postName: string, blog: BlogInfo) {
		if (postName != '') {
			if (this._currentBlogId == uid)
				this._changed = true;
			else
				this._changed = false;
			this._currentBlogId = uid;
			this._b[postName] = blog;
			this._blog[uid] = this._b;
		}
	}

	removeBlog(uid: string, postName: string) {
		delete this._blog[uid][postName];
		this._changed = false;
	}

	getMultiListing() {
		return this._multiListing;
	}

	setMultiListing(l) {
		this.store.dispatch({ type: 'MULTI_LISTING', payload: {changed: true} });
		this._multiListing['listings'] = l.listings;
		this._multiListing['selectListings'] = l.selectListings;
	}

	getRotation(item: any): number{
		return item.content.rotate ?  item.content.rotate : 0;
	}

	rotatedPosition(box: Box, angle: number = 0) {
		if (angle == 0) {
			return box;
		}
		let pLeft = box.left;
		let pTop = box.top;
		let oLeft = pLeft + box.width() / 2;
		let oTop = pTop + box.height() / 2
		let x = pLeft - oLeft;
		let y = pTop - oTop;
		angle = angle * (Math.PI / 180);
		let cos = Math.cos(angle);
		let sin = Math.sin(angle);

		let xRot0 = x * cos - y * sin + oLeft;
		let yRot0 = x * sin + y * cos + oTop;
		let xRot1 = -1 * x * cos - y * sin + oLeft;
		let yRot1 = -1 * x * sin + y * cos + oTop;
		let xRot2 = -1 * x * cos + y * sin + oLeft;
		let yRot2 = -1 * x * sin - y * cos + oTop;
		let xRot3 = x * cos + y * sin + oLeft;
		let yRot3 = x * sin - y * cos + oTop;

		return new Box(_min([xRot0,xRot1,xRot2,xRot3]),_max([xRot0,xRot1,xRot2,xRot3]), _min([yRot0,yRot1,yRot2,yRot3]), _max([yRot0,yRot1,yRot2,yRot3]));
	}

	getComponents(theme: boolean = false, listingUid: string = '') {
		if (!this.getHttpSiteHeader() && !theme || theme && !listingUid)
			return Observable.of([]);

		const header = this._currentSite && this._currentSite.roleId > 1 || !theme ? this.getHttpSiteHeader() : this.getHttpHeader();
		const url = this._currentSite && this._currentSite.roleId > 1 || !theme ? APIs.component : APIs.system_themes + '/components';

		let params = new HttpParams();
		if ((this._currentSite && this._currentSite.roleId > 1 || theme) && listingUid) {
			params = params.set('listingUid', listingUid);
		}
		return this.httpClient.get(url, {headers: header, params: params})
			.map(res => {
				console.log('get component from server - ' + listingUid, _cloneDeep(res));
				return res;
			})
			.catch((error: any) => {
				console.log(error);
				return Observable.of([]);
			});
	}

	addComponents(body: Object): Observable<any> {
		let headers = this.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);
		return this.httpClient.post(APIs.component, body, {headers: headers});
	}

  	updateComponents(body: Object): Observable<any> {
		let headers = this.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);
		console.log(JSON.stringify(body));
		return this.httpClient.post(APIs.component_update, body, {headers: headers});
	}

  	deleteComponents(uid: string): Observable<any> {
		let headers = this.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);

		const url = APIs.component + '/' + uid;
		return this.httpClient.delete(url, {headers: headers});
	}

	clearComponent() {
		const headers = this.getHttpSiteHeader();
		if (!headers)
			return Observable.of(null);

		return this.httpClient.delete(APIs.component_clear, {headers: headers})
			.map(res => {
				this.setGlobalItems([]);
				return res;
			})
			.catch((error: any) => {
				return Observable.of(null);
			});
	}

	uploadFiles(files: File[], path: string = '') {
		let headers = this.getHttpSiteFormHeader();
		if (!headers)
			headers = this.getHttpNormalFormHeader();

		const data = new FormData();

		files.forEach(file => {
			data.append('files', file, file.name.replace(/\s+/g, ''));
		});

		if (path)
			data.append('path', path);

		const req = new HttpRequest('POST', APIs.file + '/upload', data, {headers: headers, reportProgress: true});
		return this.httpClient.request(req);
  	}

	getFiles(skip?: number, take?: number): Observable<FileInfo[]> {
		let headers = this.getHttpSiteHeader();
		if (!headers)
			headers = this.getHttpNormalHeader();

		if (!headers)
			return Observable.of([]);

	  	let params = new HttpParams();

		if (skip != null) {
			params = params.set('skip',skip.toString());
			if (take != null)
				params = params.set('take',take.toString());
			else
				params = params.set('take', '9');
		} else {
			params = params.set('skip', '0');
		}

		return this.httpClient.get(APIs.file, {headers: headers, params: params}).map(r => {
				return JSON.parse(JSON.stringify(r).toLowerCase());
				// return r.json();
			})
			.catch((err, obs) => {
				return Observable.of([]);
			});
	}

  	removeFile(filename: string): Observable<any> {
		let headers = this.getHttpSiteHeader();
		if (!headers)
			return new ErrorObservable(`You didn't login`);
		// let params = new HttpParams();
		// params = params.set('type', 'file');
		// params = params.set('filename', filename);
		const data = {
			type: 'file',
			filename: filename
		};

		return this.httpClient.request('DELETE', APIs.file, {headers: headers, body: data});
	}

	downloadFile(api: string, fileName: string) {
		this.httpClient.get(api, { responseType: "blob" })
		.subscribe(res=> {
			FileSaver.saveAs(res, fileName);
		})
			// this.http.get(api, { responseType: ResponseContentType.Blob })
			//	 .subscribe((response: any) => {
			//		 FileSaver.saveAs(response.blob(), fileName);
			//	 });
	}

	uploadImages(files: File[], path: string = '') {
		let headers = this.getHttpSiteFormHeader();
		if (!headers)
		headers = this.getHttpNormalFormHeader();

		const data = new FormData();
		files.forEach(file => {
			data.append('files', file, file.name.replace(/[\s()]/g, ''));
		});

		if (path)
			data.append('path', path);
		const req = new HttpRequest('POST', APIs.image + '/upload', data, {headers: headers, reportProgress: true});
		return this.httpClient.request(req);
  	}

	uploadVideos(files: File[]) {
		let headers = this.getHttpSiteFormHeader();
		if (!headers)
			headers = this.getHttpNormalFormHeader();
		headers = headers.set('timeout', '600000');

		const data = new FormData();
			files.forEach(file => {
				data.append('files', file, file.name);
		});

		const req = new HttpRequest('POST', APIs.video + '/upload', data, {headers: headers, reportProgress: true});
		return this.httpClient.request(req);
	}

	setFormData (data: any, form : FormGroup) {
		let value: any = {};
		let keys = _keysIn(form.value);
		keys.map(key=> {
		if (data[key] || data[key]=='')
			value[key] = data[key];
		});
		form.patchValue(value);
	}

	convertToCSV(objArray, headerList) {
		//console.log('convert to array called');
		var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
		var str = '';
		var row = 'no,';

		for (var index in headerList) { //objArray[0]
			//Now convert each value to string and comma-separated
			row += headerList[index] + ',';
		}

		row = row.slice(0, -1);
		//append Label row with line break
		str += row + '\r\n';

		for (var i = 0; i < array.length; i++) {
			var line = (i+1)+'';
			for (var index in headerList) {//array[i]
				let head = headerList[index];

				//if (line != '') line += ','
				line += ',' + array[i][head];
			}
			str += line + '\r\n';
		}
		return str;
	}

	dropped(event: UploadEvent, dragEle: HTMLElement, backGroundColor: string = 'white') : FileSystemFileEntry[]{
		if (dragEle) {
			dragEle.style.backgroundColor = backGroundColor;
			dragEle.style.opacity = '0';
		}
		const eventFiles = event.files;
		return eventFiles.map(f=>f.fileEntry as FileSystemFileEntry);
	}

	fileOver(event: DragEvent, dragEle: HTMLElement, backGroundColor: string = 'lightgray', opacity: string = '1') {
		dragEle = (event.target as HTMLElement).parentElement;
		dragEle.style.backgroundColor = backGroundColor;
		dragEle.style.opacity = opacity;
		return dragEle;
	}

	fileLeave(event: DragEvent, dragEle: HTMLElement, backGroundColor: string = 'white', opacity: string = '0', isNull: boolean = true) {
		if (dragEle) {
			dragEle.style.backgroundColor = backGroundColor;
			dragEle.style.opacity = '0';
		}
		if (isNull) {
			dragEle = null;
		}
	}

	toUtcMoment(date) {
		return moment(date).add(moment(date).utcOffset(), 'minutes').utc();
	}

	toLocalMoment(date) {
		return moment.utc(date).local().format();
		// local_date = moment.utc(date).local().format('YYYY-MM-DD HH:mm:ss');
	}

	hasImages(page: Page) {
		if (this.hasBackgroundImage(page)) return true;
		const temp = page.items.find((item: any) => item.content && item.itemType == 'ImageItem');
		return !!temp;
	}

	hasBackgroundImage(page: Page) {
		if (!page.background) return false;
		if (page.background.backgroundImage && page.background.backgroundImage.image && page.background.backgroundImage.image.name)
			return true;
		else if (page.background.backgroundTiling && page.background.backgroundTiling.image && page.background.backgroundTiling.image.name)
			return true;
		return false;
	}
}
