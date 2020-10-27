import { ViewChild, Component, ElementRef, HostListener, OnInit, OnDestroy, AfterViewInit, Renderer, Input } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { RouterStateSnapshot } from '@angular/router';
import { ComponentCanDeactivate } from '@app/component/can-deactivate/component-can-deactivate';
import { Store } from '@ngrx/store';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { FormBuilder, FormGroup, FormControl, Validators, Validator } from '@angular/forms';

import { Subscription } from 'rxjs';
import {
	assign as _assign,
	cloneDeep as _cloneDeep,

} from 'lodash';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';

import { PageCanvasComponent } from '@app-common/page-canvas/page-canvas.component';
import { createInviteSetupDialogWindow } from '@app-dialogs/invite-setup-dialog/invite-setup-dialog.component';
import { GoogleMapsDialogComponent, createGoogleMapsDialogWindow } from '@app-dialogs/google-maps-dialog/google-maps-dialog.component';
import { createResendConfirmDialogWindow } from '@app/component/invitation/resend-confirm/resend-confirm.component';

import { InvitationInfo, Coming, Guest, Page, CommonItemContent, Item} from '@app/models';

import { AppService } from '@app/app.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { AppState } from '@app/stores/reducers';
import { UUID } from '@app-lib/uuid/uuid.service';

@Component({
	moduleId: module.id,
	selector: 'invitation-canvas',
	templateUrl: 'invitation-canvas.component.html',
	styleUrls: ['invitation-canvas.component.css']
})
export class InvitationCanvasComponent extends ComponentCanDeactivate implements OnInit, OnDestroy, AfterViewInit {

	@ViewChild('invitationCanvas') public invitationCanvas: ElementRef;
	@ViewChild('invitationCanvasBody') public invitationCanvasBody: ElementRef;
	@ViewChild(PageCanvasComponent) public pageCanvas: PageCanvasComponent;
	@ViewChild('canvasContainer') public canvasContainer: ElementRef;

	public _currentCanvas: number = 0; // 1: Canvas, 2: Event, 3: Message

	public item: Item;
	public itemContent: CommonItemContent<InvitationInfo>;
	public info: InvitationInfo = new InvitationInfo();
	public attendOption: FormControl = new FormControl('string');
	public pageLayout: number = 1;
	// ----------------------------------------------------------------------
	public page: Page = new Page();
	public viewInited: boolean = false;
	public comings: Coming[] = [{reply: 'No', guests:[]},{reply: 'Yes', guests:[]},{reply: 'Maybe', guests:[]}]; //0 = NO, 1 = YES, 2 = MAYBE, 3 = NOT REPLIED

	private resendFlag: boolean = false;
	private _subs: Subscription[] = [];

	constructor(
		private elementRef: ElementRef,
		private sanitizer: DomSanitizer,
		private renderer: Renderer,
		private fb: FormBuilder,
		private route: ActivatedRoute,
		private windowService: WindowService,
		private appService: AppService,
		private store:Store<AppState>
	) {
		super();
	}

	ngOnInit() {
		this.downPage();

		this._subs = [
			this.route.queryParams.subscribe(params => {
				if (params.setupDialog)
					setTimeout(() => {
						this.clickTool('EventSetupItem');
					});
			})
		];
		this.renderer.setElementClass((this.canvasContainer.nativeElement as HTMLElement).parentElement, this.info.position, true);
	}

	ngAfterViewInit() {
		this.viewInited = true;
	}

	canDeactivate(nextState: RouterStateSnapshot) {
		return this.appService._changed && (!nextState || nextState.url.indexOf(this.page.service + '/3') < 0);
	}

	processState(nextState: RouterStateSnapshot) {
		this.clickTool('Save', nextState);
	}

	downPage() {
		if (!this.appService._currentPage || this.appService._currentPage.service != 15) {
			this.page = this.appService.newPage(false, false);
		} else {
			this.page = this.appService._currentPage;
		}

		this.pageLayout = this.page.display == 'Mobile' ? 2 : 1;
		this.page.items = this.page.items.filter(item=> item.itemType == 'HFItem' || item.hf == 0 && !item.global);
		let serviceItems = this.appService.getServiceItem(this.page, 15);

		if (!serviceItems || serviceItems.length == 0) return;

		this.item = serviceItems[0];
		this.info = new InvitationInfo();
		this.info.uid = UUID.UUID();

		if (this.item) {
			this.itemContent = this.item.content as CommonItemContent<InvitationInfo>;
			if (this.page.serviceObject && Object.keys(this.page.serviceObject).length > 0) {
				this.info = _assign(this.itemContent.info.value, this.page.serviceObject);
				if (this.page.serviceObject.status && this.page.serviceObject.status == 1)
					this.resendFlag =  true;
			} else {
				this.info.uid = this.item.uid;
			}
		} else {
			if (this.appService._currentSite)
				this.info.siteUid = this.appService._currentSite.uid;

			this.itemContent = new CommonItemContent<InvitationInfo>(Maybe.just(this.info)).setBox(new Box(0,0,0,0));
			this.item = new Item().setContent(this.itemContent).setItemType('InvitationItem').setLocked(true).setUID(this.info.uid);
			this.page.items.push(this.item);
		}

		if (!!this.appService._themePage && (!this.appService._currentSite || this.appService._currentSite.roleId != 3)) {
			this.info.uid = UUID.UUID();
			this.item = this.item.setUID(this.info.uid);
			this.page.uid = '';
			// this.appService._changed = true;
		}
		this.appService._originalPage = _cloneDeep(this.page);
	}

	clickTool(tool: string, nextState: RouterStateSnapshot = null) {
		switch(tool) {
			case 'Save':
				if (this.resendFlag)
					this.openConfirmResend();
				else {
					// if (this.pageLayout == 2) {
					//	 this.pageLayout = 1;
					//	 setTimeout(() => {
					//		 this.pageCanvas.onSave(nextState);
					//	 },500);
					// }
					// else {
					//	 this.pageCanvas.onSave(nextState);
					// }
					this.pageCanvas.onSave(nextState);
				}
				break;
			case 'EventSetupItem':
				this.openSetupEvent();
				break;
			case 'PageLayout1':
				this.pageLayout = 1;
				this.pageCanvas.clickCanvasTool(tool);
				break;
			case 'PageLayout2':
				this.pageLayout = 2;
				this.pageCanvas.clickCanvasTool(tool);
				break;
			default:
				this.pageCanvas.clickCanvasTool(tool);
		}
	}

	onCanvasClick(event: MouseEvent, n: number = 0) {
		if (event)
			event.stopPropagation();
		this._currentCanvas = n;
		if (n != 1 && this.pageCanvas.currentState && this.pageCanvas.currentState.selectedItems.length > 0)
			this.pageCanvas._deselectionAllItems.next();
	}

	get isSaving(): boolean {
		return this.appService._changed && !!this.info;
	}

	drag(event: any) {
		if (event[0] != 0) {
			if (this.info.position == 'left') {
				this.info.position = 'right';
				this.renderer.setElementClass((this.canvasContainer.nativeElement as HTMLElement).parentElement, 'right', true);
			}
			else {
				this.info.position = 'left';
				this.renderer.setElementClass((this.canvasContainer.nativeElement as HTMLElement).parentElement, 'right', false);
			}
		}
		this.updatePage();
	}

	openSetupEvent() {
		const setupEventWin = createInviteSetupDialogWindow(this.windowService, this.info);
		setupEventWin.componentRef.instance.submit.subscribe(res => {
			this.info = res;
			this.updatePage();
			setupEventWin.destroy();
		});
		setupEventWin.componentRef.instance.close.subscribe(() => {
			setupEventWin.destroy();
		});
		setupEventWin.open();
	}

	onShowClick(target: number, show: boolean) {
		if (target == 1)
			this.info.showMessage = show;
		else
			this.info.showComing = show;
		this.updatePage();
	}

	updatePage() {
		const serviceItems = this.pageCanvas.currentState.items.filter(item => item.itemType == 'InvitationItem');
		if (serviceItems.length > 0) {
			this.pageCanvas._itemChange.next([serviceItems[0], serviceItems[0].setContent((serviceItems[0].content as CommonItemContent<InvitationInfo>).setInfo(Maybe.just(this.info)))]);
		}
	}

	openConfirmResend(nextState: RouterStateSnapshot = null) {
		const updateConfirmWin = createResendConfirmDialogWindow(this.windowService);
		updateConfirmWin.componentRef.instance.submit.subscribe(res => {
			this.resendFlag = false;
			this.info.resend = res;
			this.clickTool('Save', nextState);
			updateConfirmWin.destroy();
		});
		updateConfirmWin.componentRef.instance.close.subscribe(() => {
			updateConfirmWin.destroy();
		})
		updateConfirmWin.open();
	}

	openGoogleMapsDialog() {
		let googleMaps: DialogWindow<GoogleMapsDialogComponent>;
		googleMaps = createGoogleMapsDialogWindow(this.windowService, this.info.address1 + ', ' + this.info.city + ', ' + this.info.province);
		googleMaps.componentRef.instance.outLocation.subscribe(result => {
				googleMaps.destroy();
			});
		googleMaps.componentRef.instance.close.subscribe(() => {
				googleMaps.destroy();
			});
		googleMaps.open();
	}

	ngOnDestroy() {
		this.viewInited = false;
		this._subs.forEach(s => s.unsubscribe());
	}

	@HostListener('window:resize', ['$event'])
	onWindowResize(event) {
		if (event.target.innerWidth < 768 && this.pageLayout == 1) {
			this.clickTool('PageLayout2');
		} else if (event.target.innerWidth >= 768 && this.pageLayout == 2) {
			this.clickTool('PageLayout1');
		}
	}
}
