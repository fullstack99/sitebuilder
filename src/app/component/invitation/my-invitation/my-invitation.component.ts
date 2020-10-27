import {
	Component, ViewChild, AfterViewInit, HostListener, ElementRef, Input,
	OnChanges, SimpleChanges, OnInit, ChangeDetectorRef, Output, EventEmitter,
	OnDestroy
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { VirtualScrollComponent, ChangeEvent } from 'ngx-virtual-scroll-plus';
import { Store } from "@ngrx/store";
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';

import { createAttentionDialogWindow } from '@app-dialogs/attention-dialog/attention-dialog.component';
import { AttentionInfo, EmailData } from '@app/models';

import { AppState } from '@app/stores/reducers';

import { AppService } from '@app/app.service';
import { AlertService, EmailService, SitemapService } from '@app/services' ;
import { WindowService, DialogWindow } from '@app-common/window/window.service';

@Component({
	moduleId: module.id,
	selector: 'my-invitation',
	templateUrl: 'my-invitation.component.html',
	styleUrls: ['my-invitation.component.css']
})

export class MyInvitationComponent implements OnInit, OnDestroy, AfterViewInit {
	@ViewChild(VirtualScrollComponent)
	virtualScroll: VirtualScrollComponent;

	public viewPortItems: any;

	public skip: number = 0;
	public take: number = 24;
	public order: string = '0';

	public viewInited: boolean = false;
	public time = new Date().getTime();
	public _loading: boolean = false;

	public pages: EmailData[] = [null];
	public startNumber: number = 0;
	public totalNum: number = 0;
	private subs: Rx.Subscription[] = [];

	constructor(
		private _changeDetector: ChangeDetectorRef,
		private sanitizer: DomSanitizer,
		private store: Store<AppState>,
		private _router: Router,
		private _appService: AppService,
		private _sitemapService: SitemapService,
		private _emailService: EmailService,
		private _alertService: AlertService,
		private _windowService: WindowService
	) { }

	ngOnInit() {
		this.subs = [
		];
		this.loadData();
	}

	ngAfterViewInit() {
		this.viewInited = true;
	}

	loadData() {
		this.startNumber = 0;
		this.getServiceEmails(0, this.take-1);
	}

	getServiceEmails(skip: number, take: number) {
		this.refreshView(true);
		this._emailService.getServiceEmails('15', false, skip, take).subscribe(
			res => {
				if (res) {
					this.totalNum = res.total;
					this.pages = this.pages.concat(res.data);
				}
			},
			error => { this.refreshView(false); },
			() => { this.refreshView(false); }
		);
	}

	onCopy(item: EmailData, i: number) {
		this._sitemapService.copyPage(item.uid).subscribe(
			res => {
				this.totalNum += 1;
				this.pages.splice(i + 1, 0, res);
				this.pages = [...this.pages];
			},
			error => {},
			() => {}
		);
	}

	onEdit(item: EmailData, setup: boolean = false) {
		this.refreshView(true);
		this._sitemapService.getPage(item.uid).subscribe(
			res => {
				if (res) {
					this._appService.siteMaxPageNo = res.siteMaxPageNo || this._appService.siteMaxPageNo;

					this._appService.downPage(res, false);

					setTimeout(() => {
						if (setup) {
							this._router.navigate(['/detail', '15', 2], { queryParams: { setupDialog: true }});
						} else {
							this._router.navigate(['/detail', '15', 2]);
						}
					});
				}
			},
			error => { this._alertService.playToast('Failed', 'Cannot read from server.', 1); },
			() => {}
		);
	}

	onCreate() {
		this.refreshView(true);
		this._appService.newPage(false);
		setTimeout(() => {
			this._router.navigate(['/detail', '15', 2]);
		});
	}

	onRemove(item: EmailData, i: number) {
		const attentionWindow = createAttentionDialogWindow(
			this._windowService,
			new AttentionInfo(
				{ value: 'Delete Invitation', font_size: '22px', color: '#8c8c8c' },
				[
					{ value: 'Do you want to delete this Invitation?', font_size: '16px', color: '#8c8c8c' }
				],
				true,
				['DELETE'],
				''
			));

		attentionWindow.componentRef.instance.submit.subscribe((feedback) => {
			if (feedback) {
				this.refreshView(true);
				this._sitemapService.deletePage(item.uid, 15).subscribe(
					res => {
						this._alertService.playToast('Delete Success', 'Invitation is deleted successfully.', 0);
						this.pages.splice(i, 1);

						if (this.totalNum <= this.pages.length) {
							this.pages = [...this.pages];
							return;
						}
						this.getServiceEmails(this.pages.length, 1);
					},
					error => {
						this.refreshView(false);
						this._alertService.playToast('Failed', 'Invitation is not deleted.', 1);
					},
					() => {
						this.refreshView(false);
					}
				);
			}
			attentionWindow.destroy();
		});
		attentionWindow.open();
	}

	backgroundImage(uid: string): SafeStyle {
		return this._appService._currentSite ? 'https://' + this._appService._currentSite.url + '/pages/' + uid + '/thumbnail.png?' + this.time : '';
	}

	refreshView(loading: boolean = false) {
		this._loading = loading;
		this._changeDetector.detectChanges();
	}

	onListChange(event: ChangeEvent) {
		this.startNumber = event.start;
		console.log(event, this.totalNum);
		if (event.start == 0 && event.end < 5 && event.end < this.totalNum) {
			this.virtualScroll.scrollInto(this.pages[1]);
			return;
		}
		if (event.end >= this.totalNum) return;
		if (event.end != this.pages.length) return;
		if (event.end < this.take) return;
		this.getServiceEmails(event.end-1, this.take);
	}

	ngOnDestroy() {
		this.viewInited = false;
		this.subs.forEach(s => s.unsubscribe());
	}
}
