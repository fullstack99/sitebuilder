import {
	ViewChild, Component, ElementRef, HostListener,
	OnInit, AfterViewInit, OnDestroy, Renderer, ContentChildren, ChangeDetectorRef
} from '@angular/core';
import { Location } from '@angular/common';
import { RouterStateSnapshot } from '@angular/router';
import { ComponentCanDeactivate } from '@app/component/can-deactivate/component-can-deactivate';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from "@ngrx/store";
import { GoogleMapsDialogComponent, createGoogleMapsDialogWindow } from '@app-dialogs/google-maps-dialog/google-maps-dialog.component';
import { InvitationInfo, Coming, Guest, Page, CommonItemContent, Item, Link } from '@app/models';
import { EmailService, SitemapService } from '@app/services' ;
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { AppService } from '@app/app.service';
import { AppState } from '@app/stores/reducers';

@Component({
	moduleId: module.id,
	selector: 'invitation-canvas-preview',
	templateUrl: 'invitation-canvas-preview.component.html',
	styleUrls: ['invitation-canvas-preview.component.css',
				'../../../../assets/styles/canvas-nav.css']
})
export class InvitationCanvasPreviewComponent extends ComponentCanDeactivate implements OnInit, AfterViewInit, OnDestroy {

	@ViewChild('container') public container: ElementRef;
	@ViewChild('canvasContainer') public canvasContainer: ElementRef;
	@ViewChild('replyContainer') public replyContainer: ElementRef;
	@ViewChild('eventOption') public eventOption: ElementRef;

	public elem: HTMLElement;
	public containerWidth = 1100;
	public pageLayout: number = 1;
	public page: Page = new Page();
	public info: InvitationInfo = new InvitationInfo();
	public current_screen: number = 0;
	public screen = new Rx.Subject<number>();
	public canvasWidth: number = 700;

	public devices = [
			{ width: 1100, height: '100%', min_height: '400px' },
			{ width: 768, height: '100%', min_height: '400px' },
			{ width: 320, height: '480px', min_height: '480px' }
		];

	public _loading: boolean = false;
	public attendOption: string = '';
	public comings: Coming[] = [{reply: 'No', guests:[]},{reply: 'Yes', guests:[]},{reply: 'Maybe', guests:[]}]; //0 = NO, 1 = YES, 2 = MAYBE, 3 = NOT REPLIED

	private subs: Rx.Subscription[] = [];

   constructor(
		private changeDetector: ChangeDetectorRef,
		private windowService: WindowService,
		private renderer: Renderer,
		private elementRef: ElementRef,
		private route: ActivatedRoute,
		private router: Router,
		private location: Location,
		private emailService: EmailService,
		private sitemapService: SitemapService,
		private appService: AppService,
		private store:Store<AppState>
	) {
		super();
	}

	ngOnInit() {
		this.elem = this.elementRef.nativeElement;

		this.setPage(this.appService._currentPage);

		this.subs = [
			this.screen.subscribe(n=> {
				this.current_screen = n;
				this.setCanvasContainerSize();
			}),
		];
		this.canvasWidth = (this.canvasContainer.nativeElement as HTMLElement).offsetWidth;
	}

	ngAfterViewInit() {
		setTimeout(() => {
			this.setCanvasContainerSize();
		});
	}

	canDeactivate(nextState: RouterStateSnapshot) {
		return this.appService._changed && (!nextState || nextState.url.indexOf(this.page.service + '/2') < 0);
	}

	processState(nextState: RouterStateSnapshot) {
		this.router.navigate(['/detail', this.page.service, 2], {queryParams: {save: true, nextUrl: encodeURIComponent(nextState.url)}});
	}

	setPage(page: Page) {
		if (page && page.service == 15)
			this.page = lodash.cloneDeep(page);
		else
			this.page = this.appService.newPage(false);

		let index = this.page.items.findIndex(item=>item.itemType == 'InvitationItem');

		if (index>=0) {
			this.info = (this.page.items[index].content as CommonItemContent<InvitationInfo>).info.value;
			this.page.items.splice(index,1);
		}
	}

	goBack() {
		this.location.back();
	}

	setCanvasContainerSize() {
		this.containerWidth = Math.min(this.devices[this.current_screen].width, this.elem.offsetWidth);
		this.renderer.setElementStyle((this.container.nativeElement as HTMLElement), 'width', this.containerWidth + 'px');
		this.renderer.setElementStyle((this.container.nativeElement as HTMLElement), 'height', this.devices[this.current_screen].height);
		this.renderer.setElementStyle((this.container.nativeElement as HTMLElement), 'min-height', this.devices[this.current_screen].min_height + 'px');

		if (this.containerWidth < 768) {
			this.pageLayout = 1;
			this.renderer.setElementClass((this.container.nativeElement as HTMLElement), 'mobile', true);
			this.setPage(this.appService._currentPage);
			// this.setPage(this.appService._mobilePage);
		}
		else {
			this.pageLayout = 1;
			this.renderer.setElementClass((this.container.nativeElement as HTMLElement), 'mobile', false);
			this.setPage(this.appService._currentPage);
		}
		this.canvasWidth = (this.canvasContainer.nativeElement as HTMLElement).offsetWidth;
		this.setPostionReply();
	}

	setPostionReply() {
		let reply = this.replyContainer.nativeElement as HTMLElement;
		if (this.attendOption!='') {
			reply.style.display = 'block';

			let options = ['yes','no','maybe'];
			let optionElems = (this.eventOption.nativeElement as HTMLElement).getElementsByTagName('li');
			let i = options.indexOf(this.attendOption);
			let containerWidth = (this.eventOption.nativeElement as HTMLElement).offsetWidth;

			if (optionElems.item(i).offsetLeft + reply.offsetWidth > containerWidth) {
				reply.style.left = containerWidth - reply.offsetWidth + 'px';
			} else {
				reply.style.left = optionElems.item(i).offsetLeft + 'px';
			}
			reply.style.top = optionElems.item(i).offsetTop + 30 + 'px';
		} else {
			reply.style.display = 'none';
		}
	}

	onOutLink(link: Link) {
		let target: any = link;
		switch(target.type) {
			case 'page':
			case 'lookup':
				if (!target.pageUid) return;
				this._loading = true;
				this.sitemapService.getPage(target.pageUid, !!this.appService._themePage).subscribe(
					res => {
						if (res) {
							this.setPage(this.appService.downPage(res));
						}
					},
					error => { this.refreshView(false); },
					() => { this.refreshView(false); }
				);
				break;
			case 'sitemap':
				let s = this.router.url.split('/');
				let parent_url = s.length > 2 ? s[s.length - 2] : '';
				this.router.navigate(['/sitemap'], { queryParams: { preview: true }});
				break;
			case 'anchor':
				let scrollEle=document.getElementById(target.item);
				if (scrollEle)
					scrollEle.scrollIntoView();
				break;
			case 'website':
				window.open('https://'+target.website, '_blank');
				break;
			case 'email':
				window.open('https://'+target.email, '_blank');
				break;
			case 'maps':
				window.open('https://'+target.address, '_blank');
				break;
			case 'download':
				this.appService.downloadFile(target.linkFile.location + '/' + target.linkFile.name, target.linkFile.name);
				break;
		}
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

	refreshView(loading: boolean = false) {
		this._loading = loading;
	}

	onCloseReply() {
		this.attendOption = '';
		(this.replyContainer.nativeElement as HTMLElement).style.display = 'none';

		this.emailService.replyInvitation({invitationUid: '306853d9-5480-08f9-b7fd-662df6b0c0b8', contactUid: null, totalGuests: 10, email: 'test@glogood.com', firstName: '', lastName: '', comment: 'This is the response to test Invitaion Reply.', responseType: 1}).subscribe(res => {

		})
	}

	optionChanged(event: any) {
		this.attendOption = event;
		this.setPostionReply();
	}

	@HostListener('window:resize', ['$event'])
	onWindowResize(event) {
		this.setCanvasContainerSize();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}
