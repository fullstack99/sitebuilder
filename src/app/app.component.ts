import {
	Component,
	ViewContainerRef,
	ViewChild,
	OnInit,
	OnDestroy,
	ElementRef,
	Renderer2
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { Store, select } from '@ngrx/store';
import { Observable, Subject, Subscription } from 'rxjs';
import { Angulartics2GoogleAnalytics } from 'angulartics2/ga';

import { AppState } from '@app/stores/reducers';
import * as fromAuth from '@app-auth/store/reducers';
import * as Auth from '@app-auth/store/actions/auth';

import { InactivityDirective } from '@app-directives/inactivity';
import { HeaderComponent } from '@app/component/header/header.component';
import { ViewComponent } from '@app-common/page-canvas/preview/view/view.component';
import { User, UserSite, Page } from '@app/models';
import { NonGlobalItemsServices } from '@app/shared/constants';
import { TreeService, AlertService, SitemapService } from '@app/services';
import { AppService } from '@app/app.service';
import * as html2canvas from 'html2canvas';
import { environment } from '@app-environments/environment';

var canvg = require('canvg-browser');
@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
	@ViewChild(HeaderComponent)
	public header: HeaderComponent;
	@ViewChild(ViewComponent)
	public viewComponent: ViewComponent;
	@ViewChild('progressEle')
	public progressEle: ElementRef;
	@ViewChild(InactivityDirective)
	directiveRef: InactivityDirective;
  @ViewChild('appContainer') appContainer: ElementRef;
  @ViewChild('cookieNotice') cookieNotice: ElementRef;

	public title = 'GloGood Site Builder';

	idleState = [''];
	timedOut: boolean = false;
	willTimeout: boolean = false;
	lastPing?: Date = null;

	user$: Observable<User>;
	authUpdated$: Observable<any>;
	loggedIn$: Observable<boolean>;
	currentSite$: Observable<UserSite>;
	authError$: Observable<string>;
	loginRequired$: Observable<boolean>;

  enableNotice = true;
  visibleNotice = false;

	public currentRefreshPage: Page = new Page();
	public refreshing: boolean = false;
	private refreshThumbnail = new Subject<[number, boolean, boolean, boolean]>(); // page#, changedHeader, changedFooter, changedBody
	private refreshPages: Page[] = [];
	private subs: Subscription[] = [];

	constructor(
		private store: Store<AppState>,
	private router: Router,
		private renderer: Renderer2,
		private angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics,
		private treeService: TreeService,
		private alertService: AlertService,
		private appService: AppService,
		private sitemapService: SitemapService
	) {
		// angulartics2GoogleAnalytics.startTracking();
		if (!environment['test']) {
			// let current_user = localStorage.getItem('current_user');
			localStorage.clear();
			// localStorage.setItem('current_user', current_user);
		} else {
			this.store.dispatch(new Auth.SetAuthData(true));
		}

		// let offset = new Date().getTimezoneOffset();
		// console.log(offset);
		// console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)
	}

	ngOnInit() {
		this.user$ = this.store.pipe(select(fromAuth.getUser));
		this.loggedIn$ = this.store.pipe(select(fromAuth.getLoggedIn));
		this.currentSite$ = this.store.pipe(select(fromAuth.getCurrentSite));
		this.authUpdated$ = this.store.pipe(select(fromAuth.getUpdated));
		this.authError$ = this.store.pipe(select(fromAuth.getAuthError));
		this.loginRequired$ = this.store.pipe(select(fromAuth.getLoginRequired));

		this.subs = [
			this.user$.subscribe(res => {
				if (!res) return;
				this.reset();
			}),
			this.currentSite$.subscribe(res => {
				this.treeService._clean.next();
				this.appService.clean();
			}),
			this.loginRequired$.subscribe(res => {
				if (res) {
					this.header.login();
					this.store.dispatch(new Auth.LoginRequired(false));
				}
			}),

		this.router.events
			.filter(e => e instanceof NavigationEnd)
			.subscribe(e => {
				if (!this.enableNotice)
					return;

				if (this.router.url == '/dashboard') {
					setTimeout(() => {
						this.visibleNotice = true;
					});
				} else {
					this.visibleNotice = false;
				}
			}),

			this.appService.refreshThumbnails.subscribe(res => {
				this.refreshThumbnails(res[0], res[1], res[2], res[3]);
			}),

			this.refreshThumbnail.subscribe(res => {
				let enableRefresh: boolean = true;
				if (res[1] && !res[2] && !res[3]) {
					let header = this.refreshPages[res[0]].items.find(
						i =>
							i.itemType == 'HFItem' &&
							i.hf == 1 &&
							i.content.mView < 3 &&
							i.content['visible']
					);
					enableRefresh = !!header;
				} else if (!res[1] && res[2] && !res[3]) {
					let footer = this.refreshPages[res[0]].items.find(
						i =>
							i.itemType == 'HFItem' &&
							i.hf == 2 &&
							i.content.mView < 3 &&
							i.content['visible'] &&
							i.content.box.top > 768
					);
					enableRefresh = !!footer;
				}

				// if (this.progressEle) {
				// 	let progress = this.refreshPages.length > 0 ? Math.max(10, res[0]/this.refreshPages.length) : 100;
				// 	(this.progressEle.nativeElement as HTMLElement).innerText = 'Refreshing Thumbnails ' + progress.toFixed(1) + '%';
				// 	this.renderer.setElementStyle(this.progressEle.nativeElement, 'width', progress.toFixed(1) + '%');
				// }

				if (enableRefresh) {
					let isGlobal =
						NonGlobalItemsServices.indexOf(this.refreshPages[res[0]].service) <
						0;
					this.currentRefreshPage = this.appService.downPage(
						this.refreshPages[res[0]],
						isGlobal,
						false,
						true
					);
					setTimeout(() => {
						this.onRefreshThumbnail(res[0], res[1], res[2], res[3]);
					}, 500);
				} else {
					if (res[0] < this.refreshPages.length - 1)
						this.refreshThumbnail.next([res[0] + 1, res[1], res[2], res[3]]);
				}
			})
		];
	}

	reset() {
		this.timedOut = false;
		this.willTimeout = false;
	}

	onLogin() {
		this.handleInactivityReset();
		this.header.logout(true);
		setTimeout(() => {
			this.header.login();
		});
	}

	onRefresh() {
		this.handleInactivityReset();
		if (this.appService._currentUser) {
			this.store.dispatch(new Auth.RefreshToken());
		}
	}

	handleStart() {
		this.willTimeout = false;
	}

	handleInactivity() {
		this.idleState = ['You have been logged out.'];
		this.timedOut = true;
		this.alertService.playToast('Warning', 'Your token is expired. Please login again.', 2);
		this.header.logout(true);
	}

	handleInactivityWarning(countdown: number) {
		this.idleState = [
			'Your session is about to expire in ' + countdown + ' seconds!',
			'Are you still there?'
		];
		this.willTimeout = true;
	}

	handleInactivityReset() {
		this.timedOut = false;
		this.willTimeout = false;
		this.lastPing = new Date();
	}

	refreshThumbnails(
		uid: string,
		listingUid: string,
		changedHeader: boolean,
		changedFooter: boolean,
		changedBody: boolean = false
	) {
		this.refreshing = true;
		const pages =
			!!this.appService._themePage || this.appService._currentSite && this.appService._currentSite.roleId > 1
				? this.sitemapService.getListPages(listingUid, '', '', true)
				: this.sitemapService.getPages(
						'',
						'',
						'',
						false,
						changedHeader,
						changedHeader || changedFooter
					);

		pages.subscribe(res => {
			const refreshPages = res.filter(r => r.uid != uid);
			
			if (refreshPages.length > 0) {
				this.refreshPages = refreshPages;
				this.refreshThumbnail.next([
					0,
					changedHeader,
					changedFooter,
					changedBody
				]);
			}
		});
	}

	onRefreshThumbnail(
		i: number,
		changedHeader: boolean,
		changedFooter: boolean,
		changedBody: boolean = false
	) {
		let elements = $(this.viewComponent.canvasElem)
			.find('svg')
			.map(function() {
				var svg = $(this);
				var canvas = $('<canvas></canvas>').css({
					position: 'absolute',
					left: svg.css('left'),
					top: svg.css('top')
				});
				svg.replaceWith(canvas);
				// Get the raw SVG string and curate it
				var content = svg
					.wrap('<p></p>')
					.parent()
					.html();
				svg.unwrap();
				canvg(canvas[0], content);

				return {
					svg: svg,
					canvas: canvas
				};
			});

		setTimeout(() => {
			let scale = 280 / this.viewComponent.canvasElem.offsetWidth;
			html2canvas(this.viewComponent.canvasElem, {
				allowTaint: false,
				useCORS: true,
				logging: false,
				imageTimeout: 0,
				backgroundColor: '#FFFFFF',
				scale: scale
			})
				.then(canvas => {
					let dataImage = canvas.toDataURL('image/jpeg', 0.92); //image/png
					let thumb = this.appService.dataURLtoFile(
						dataImage,
						this.currentRefreshPage.uid
					);
					this.sitemapService.updatePageThumbnails([thumb]).subscribe(
						event => {
							if (event.type == HttpEventType.Response) {
								console.log(
									'The page(uid: ' +
										this.currentRefreshPage.uid +
										') is refreshed'
								);
							}
						},
						error => {
							console.log(error);
						},
						() => {}
					);
					if (i < this.refreshPages.length - 1)
						this.refreshThumbnail.next([
							i + 1,
							changedHeader,
							changedFooter,
							changedBody
						]);
					else this.refreshing = false;
				})
				.catch(error => {
					console.log(error);
					if (i < this.refreshPages.length - 1)
						this.refreshThumbnail.next([
							i + 1,
							changedHeader,
							changedFooter,
							changedBody
						]);
					else this.refreshing = false;
				});
		}, 1000);
	}

	onDragOver(e) {
		e.preventDefault();
	}
	onDragEnter(e) {
		e.preventDefault();
	}
	onDragLeave(e) {
		e.preventDefault();
	}
	onDrop(e) {
		e.preventDefault();
	}

  onClickAppContainer(e: MouseEvent) {
	if(!this.visibleNotice || !this.enableNotice)
	  return;
	this.enableNotice = false;
  }

  onClickCookieNotice(e: MouseEvent) {
	e.stopPropagation();
	e.preventDefault();
  }

  onCloseCookieNotice(e) {
	this.enableNotice = false;
  }

	ngOnDestroy() {
		this.refreshing = false;
		this.subs.forEach(s => s.unsubscribe());
	}
}
