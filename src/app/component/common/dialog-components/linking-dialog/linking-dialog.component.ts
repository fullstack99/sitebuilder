

import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, AfterViewInit,
		 Renderer, ViewChild, ElementRef
	   } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UploadFile, UploadEvent } from 'ngx-file-drop';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import * as lodash from 'lodash';
import * as imageUrl from '@app-lib/functions/image-url';

import { createPickItemDialogComponentWindow } from '@app-dialogs/linking-dialog/pick-item-dialog.component';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { createEcommNavigationDialogWindow } from '@app-dialogs/ecomm-navigation-dialog/ecomm-navigation-dialog.component';
import { createSitemapActivePageDialogWindow } from '@app-common/sitemap/active-page/sitemap-active-page.component';

import { GoogleMapsDialogComponent, createGoogleMapsDialogWindow } from '@app-dialogs/google-maps-dialog/google-maps-dialog.component';
import { Item, FileInfo,
	LinkFormData, Link, LinkTargetType, LinkPage, LinkLookup, LinkSiteMap, LinkAnchor, LinkWebsite, LinkEmail, LinkMaps, LinkDownload, LinkingFormJson,
	LinkSource, LinkSourceType
} from '@app/models';

import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { AlertService, SitemapService, TreeService } from '@app/services';
import { AppService } from '@app/app.service';

export { Item,
	LinkFormData, Link, LinkTargetType, LinkPage, LinkLookup, LinkSiteMap, LinkAnchor, LinkWebsite, LinkEmail, LinkMaps, LinkingFormJson,
	LinkSource, LinkSourceType
} from '@app/models';

export { WindowService, DialogWindow } from '@app-common/window/window.service';

/** */
export function createLinkingDialogWindow(
	windowService: WindowService,
	form: LinkingForm,
	linkMode: number = 0
): DialogWindow<LinkingDialogComponent> {
	return windowService.create<LinkingDialogComponent>(
		LinkingDialogComponent,
		{
			width: 320,
			minHeight: 520,
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	)
	.changeInputs((comp, window) => {
		comp.form = form;
		comp.linkMode = linkMode;
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
	});
}

/** */
export class LinkingForm extends FormGroup {

	constructor(value = new LinkFormData()) {
		const json = LinkingForm.valueToJson(value);
		super({
			source    : new FormControl(json.source),
			type      : new FormControl(json.target ? json.target.type : null),
			pageNo    : new FormControl(json.target ? json.target.pageNo : ''),
			pageUid  : new FormControl(json.target ? json.target.pageUid : ''),
			listingUid   : new FormControl(json.target ? json.target.listingUid : ''),
			website  : new FormControl(json.target ? json.target.website : null, [Validators.required, Validators.pattern("(http(s)?://)?([\\w-]+\\.)+[\\w-]+(/[\\w- ;,./?%&=]*)?")]),
			email   : new FormControl(json.target ? json.target.email : null, Validators.pattern('[\\w\\d-\\+]+@[\\w\\d-]+\\.[\\w\\d]+')),
			address  : new FormControl(json.target ? json.target.address : null, Validators.required), // , Validators.pattern("[\\w\\d,\\s'-]+$"
			item      : new FormControl(json.target ? json.target.item : null),
			linkFile  : new FormControl(json.target ? json.target.linkFile : null),
		});
	}

	static valueToJson(value: LinkFormData): LinkingFormJson {
		const res: LinkingFormJson = {
				source    : value.source,
				target    : value.target
			};
		const target = value.target;

		if      (target instanceof LinkPage  ) { res.target.pageUid    = target.pageUid; res.target.listingUid = target.listingUid; }
		else if (target instanceof LinkLookup)  { res.target.pageUid    = target.pageUid; res.target.listingUid = target.listingUid; }
		else if (target instanceof LinkWebsite) { res.target.website    = target.website; }
		else if (target instanceof LinkEmail  ) { res.target.email      = target.email;  }
		else if (target instanceof LinkMaps  ) { res.target.address    = target.address; }
		else if (target instanceof LinkAnchor ) { res.target.item    = target.item;    }
		else if (target instanceof LinkDownload ) { res.target.linkFile = target.linkFile;}

		return res;
	}

	static jsonToValue(json: LinkingFormJson): LinkFormData {
		const source =
				json.source ? new LinkSource(json.source.linkSourceType, json.source.source) : null;
		const target: Link = (
			json.target.type === 'page'
				? new LinkPage(json.target.pageUid, json.target.listingUid) :
			json.target.type === 'lookup'
				? new LinkLookup(json.target.pageUid, json.target.listingUid) :
			json.target.type === 'sitemap'
				? new LinkSiteMap(json.target.pageUid) :
			json.target.type === 'anchor'
				? new LinkAnchor(json.target.item) :
			json.target.type === 'website'
				? new LinkWebsite(json.target.website) :
			json.target.type === 'email'
				? new LinkEmail(json.target.email) :
			json.target.type === 'maps'
				? new LinkMaps(json.target.address) :
			json.target.type === 'download'
				? new LinkDownload(json.target.linkFile) :
			null
		);

		return new LinkFormData(source, target);
	}

	static fromJson(json: LinkingFormJson): LinkingForm {
		return new LinkingForm(LinkingForm.jsonToValue(json));
	}

	get LinkValue(): LinkFormData {
		return LinkingForm.jsonToValue({
			source    : this.controls.source.value,
			target: {
				type      : this.controls.type.value,
				pageUid  : this.controls.pageUid.value,
				listingUid   : this.controls.listingUid.value,
				website  : this.controls.website.value,
				email   : this.controls.email .value,
				address  : this.controls.address.value,
				item      : this.controls.item   .value,
				linkFile  : this.controls.linkFile.value,
			}
		});
	}

	setLinkValue(value: LinkFormData, options?:any) {
		this.setJson(LinkingForm.valueToJson(value), options);
	}

	setJson(json: LinkingFormJson, options?: any) {
		this.patchValue({
			source    : json.source,
			type      : json.target ? json.target.type : null,
			pageNo    : json.target ? json.target.pageNo : '',
			pageUid  : json.target ? json.target.pageUid : '',
			listingUid   : json.target ? json.target.listingUid : null,
			website  : json.target ? json.target.website : null,
			email   : json.target ? json.target.email : null,
			address  : json.target ? json.target.address : null,
			item      : json.target ? json.target.item : null,
			linkFile  : json.target ? json.target.linkFile : null
		}, options);
	}

	reset() {
		this.setLinkValue(new LinkFormData(), { emitEvent: true });
	}
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
	moduleId: module.id,
	templateUrl: 'linking-dialog.component.html',
	styleUrls: ['linking-dialog.component.css']
})
export class LinkingDialogComponent implements OnInit, OnDestroy, AfterViewInit {
	@Input() form: LinkingForm;
	@Input() linkMode: number = 0; //0 => link, 1 => download

	@Output() close = new EventEmitter<void>();
	@Output() submit = new EventEmitter<Link>();

	@ViewChild('linkSourceText') public _linkSourceText: ElementRef;
	@ViewChild('componentView') public _componentView: ElementRef;
	@ViewChild('linkTarget') public _linkTarget: ElementRef;
	@ViewChild('pageNumEle') public _pageNumEle: ElementRef;
	@ViewChild('importFile') public _importFile: ElementRef;
	@ViewChild('linkingOptionContainer') public _linkingOptionContainer: ElementRef;

	public enableCall = true;
	public _files: FileInfo[];
	public _thumb: string = '';
	public _linkingOptionContainerScroll = new Subject<void>();
	public uploadedFiles                 = new Subject<FileInfo[]>();
	public _uploading = false;

	public serviceId: number;
	public originPageNo = 0;

	private pageType = '';
	private pageUid = '';

	private viewInited = false;
	private displayedSource: boolean;
	private dragEle: HTMLElement;
	private subs: Subscription[];

	// ---------------------------------------------------------------
	constructor(
		private changeDetector: ChangeDetectorRef,
		private elementRef: ElementRef,
		private sanitizer: DomSanitizer,
		private windowService: WindowService,
		private sitemapService: SitemapService,
		private appService: AppService,
		private treeService: TreeService
	) {}

	ngOnInit() {
		this.serviceId = this.appService._currentService;

		this._thumb = '';
		const initialFiles = this.getFiles(0, 9).publish().refCount();
		const moreFiles = this._linkingOptionContainerScroll.map(() => {
				const el = this._linkingOptionContainer.nativeElement as HTMLElement;
				return el.scrollHeight - el.offsetHeight - el.scrollTop;
			})
			.filter(scrollBottom => scrollBottom === 0 && this.linkMode == 1)
			.map(() =>
				this.getFiles(Math.ceil(this._files.length/10)*9, 9))
			.switch().publish().refCount();

		this.subs = [
			initialFiles.subscribe(r => {
				this._files = r;
				this.refreshView();
			}),
			moreFiles.subscribe((r: any) => {
				this._files = this._files.concat(r);
				this.refreshView();
			}),
			this.uploadedFiles.subscribe(r=> {
				this._files = this._files.concat(r);
				this.refreshView();
			}),

			this.form.controls['pageNo'].valueChanges.subscribe(res => {
				this._thumb = '';
			}),

			this.form.controls['type'].valueChanges.subscribe(res => {
				this.pageType = res;
				this.getPage();
			}),

			this.form.controls['pageUid'].valueChanges.subscribe(res => {
				this.pageUid = res;
				this.getPage();
			}),

			this.form.valueChanges.subscribe(v => {
				try {
					if (!!v.source) {
						this.displayedSource = true;
						if (v.source && v.source.linkSourceType === 'LinkSourceText') {
							this._linkSourceText.nativeElement.innerHTML = v.source.source;
						} else if (v.source.linkSourceType === 'LinkSourceComponent') {
							let ele = this._componentView.nativeElement as HTMLElement;
							// ele.style.width = v.source.source.content.box.width() + 'px';
							ele.style.height = v.source.source.content.box.height() + 'px';
						}
					}

					// if (v.type === 'lookup' && v.pageUid) {
					// 	if (v.pageUid != '00000000-0000-0000-0000-000000000000')
					// 		this._thumb = 'https://' + this.appService._currentSite.url + '/pages/' + v.pageUid + '/thumbnail.png';
					// 	else
					// 		this._thumb = '';
					// 	this.refreshView();
					// }
					// else if (v.type === 'page' && v.pageNo) {
					// 	if (!v.pageUid) {
					// 		this._thumb = '';
					// 	} else if (this.appService._currentSite.url && v.pageUid !== '00000000-0000-0000-0000-000000000000') {
					// 		this._thumb = 'https://' + this.appService._currentSite.url + '/pages/' + v.pageUid + '/thumbnail.png';
					// 	}
					// 	this.refreshView();
					// }
					// else if (v.type === 'page' && v.pageUid && v.pageUid != '00000000-0000-0000-0000-000000000000' && !v.pageNo && this.enableCall) {
					// 	this.sitemapService.getPage(v.pageUid, false, false).subscribe(
					// 		res => {
					// 			this._thumb = 'https://' + this.appService._currentSite.url + '/pages/' + v.pageUid + '/thumbnail.png';
					// 			if (res)
					// 				this.form.controls['pageNo'].setValue(res.num, {emitEvent: false});
					// 			this.enableCall = true;
					// 			this.refreshView();
					// 		},
					// 		error => { this.enableCall = true; this.refreshView(); }
					// 	);
					// }
					if (v.type == 'download') {
						this.form.controls.linkFile.setValue(v.linkFile, {emitEvent: false});
						this.linkMode = 1;
						this.refreshView();
					} else {
						this.refreshView();
					}
				} catch(e) {
				}
			}),
		];
	}

	ngAfterViewInit() {
		this.viewInited = true;
		this.originPageNo = this.form.value.pageNo;

		if (this.form.value.type === 'page' && this.originPageNo) {
			if (this.form.value.pageUid) {
				this.onViewPage();
			}
		}
		// (this.elementRef.nativeElement as HTMLElement).parentElement.style.width = '700px';
	}

	get isValid() {
		if (!this.form.LinkValue.source)
			return false;
		if (this.form.value.pageNo > 0 && this.originPageNo !== this.form.value.pageNo)
			return false;

		switch(this.form.controls.type.value) {
			case 'page':
				return parseInt(this.form.controls.pageNo!.value) > 0;
			case 'lookup':
				return this.form.controls.pageUid.value && this.form.controls.pageUid.value !== '';
			case 'anchor':
				return this.form.controls.item.value && this.form.controls.item.value !== '';
			case 'website':
				return this.form.controls.website.valid;
			case 'sitemap':
				return true;
			case 'email':
				return this.form.controls.email.valid;
			case 'maps':
				return this.form.controls.address.valid;
			case 'download':
				return this.form.controls.linkFile.valid;
		}
		return false;
	}

	get isDownloadValid() {
		if (!this.form.LinkValue.source)
      		return false;
		if (this.form.controls.linkFile.value)
			return true;
		return false;
	}

	get getWebSite() {
		let url = this.form.controls.website.value;
		if (!url) return '';
		if (url.indexOf('https://',0)==0)
			return url;
		return 'https://' + url;
	}

	backgroundImage(url: string): SafeStyle {
		const index = url.lastIndexOf('/');
		let location = url.substr(0, index);
		let name = url.substr(index + 1);
		return url ? this.sanitizer.bypassSecurityTrustStyle(`url('${location}/${encodeURIComponent(name)}')`) : '';
	}

	setItems(items: Item[]) {
	}

	openFeedbackDialog() {
		let feedabckWindow = createFeedbackDialogWindow(this.windowService, 'pick-link');
		feedabckWindow.open();
	}

	showPickItemDialog() {
		let pickItemDialogWindow = createPickItemDialogComponentWindow(this.windowService, this.appService._currentPage);
		pickItemDialogWindow.componentRef.instance.submit.pipe()
			.subscribe(mitem => {
				this.form.controls.type.setValue('anchor', { emitEvent: false });
				this.form.controls.item.setValue(mitem.uid, { emitEvent: false });
				this.form.updateValueAndValidity({ emitEvent: false });
				this.submit.emit(this.form.LinkValue.target);
			});
		pickItemDialogWindow.componentRef.instance.close.pipe()
			.subscribe(() => {
				this.form.controls.type.setValue('anchor', { emitEvent: false });
				this.form.controls.item.setValue('', { emitEvent: false });
				this.form.updateValueAndValidity({ emitEvent: true });
			});
		pickItemDialogWindow.open();
	}

	openSitemapDialog(e: MouseEvent, viewSitemapPage = false) {
		const sitemapWindow = createSitemapActivePageDialogWindow(this.windowService, viewSitemapPage);
		sitemapWindow.componentRef.instance.choose.pipe()
			.subscribe(res => {
				if (res.service == 20) {
					this.openEcommNavDialog(res.uid, null);
				} else {
					this._thumb = 'https://' + this.appService._currentSite.url + '/pages/' + res.uid + '/thumbnail.png';
					this.form.controls.pageUid.setValue(res.uid);
				}
			});
		sitemapWindow.componentRef.instance.close.pipe()
			.subscribe(res => {
				if (this.form.value.type === 'sitemap') {
					this._thumb = 'https://' + this.appService._currentSite.url + '/pages/' + res + '/thumbnail.png';
					this.form.controls.pageUid.setValue(res);
				}
			});
		sitemapWindow.open();
	}

	getPage() {
		const pageNo = this.form.value.pageNo;
		const type = this.pageType;
		const pageUid = this.pageUid;

		if (!pageUid && !type || type !== 'page' && type !== 'lookup') {
			this._thumb = '';
			return;
		}

		if (type === 'page' && pageUid && pageUid !== '00000000-0000-0000-0000-000000000000' && this.enableCall) {
			this.enableCall = false;
			this._thumb = '';
			this.refreshView(true);
			this.sitemapService.getPage(pageUid, false, false).subscribe(
				res1 => {
					if (res1) {
						this.form.controls['pageNo'].setValue(res1.num, {emitEvent: false});
						this.originPageNo = res1.num;
					}
					this.enableCall = true;
					this._thumb = 'https://' + this.appService._currentSite.url + '/pages/' + pageUid + '/thumbnail.png';
					this.refreshView();
				},
				error => { this.enableCall = true; this.refreshView(); }
			);
		} else {
			if (pageUid !== '00000000-0000-0000-0000-000000000000')
				this._thumb = 'https://' + this.appService._currentSite.url + '/pages/' + pageUid + '/thumbnail.png';
			else
				this._thumb = '';
			this.refreshView();
		}
	}

	onViewPage() {
		if (this.form.value.pageNo < 0)
			return;
		this.originPageNo = this.form.value.pageNo;
		let listingUid = '';
		this.enableCall = false;
		this._thumb = '';
		this.refreshView(true);

		if (!!this.appService._currentSite && this.appService._currentSite.roleId > 1) {
			if (this.appService._currentPage)
				listingUid = this.appService._currentPage.listingUid;
			else
				listingUid = this.treeService._currentTrees['sitemap'] ? this.treeService._currentTrees['sitemap'].value['uid'] : '';
		}
		this.sitemapService.getPageWithNo(`${this.form.value.pageNo}`, listingUid, false).subscribe(
			res => {
				if (res) {
					if (this.viewInited && res.service == 20) {
						this.openEcommNavDialog(res.uid, `${this.form.value.pageNo}`);
					} else {
						this.form.patchValue({
							pageUid: res.uid,
						});
					}
				} else {
					this.form.patchValue({
            			pageUid: '00000000-0000-0000-0000-000000000000',
					});
				}
				this.enableCall = true;
				this.refreshView();
			},
			error=> { this.refreshView(); },
			() => {}
		);
	}

	openEcommNavDialog(pageUid: string, pageNo: string) {
		const ecommNavDiag = createEcommNavigationDialogWindow(this.windowService, pageUid);
		ecommNavDiag.componentRef.instance.submit.pipe().subscribe(res => {
			this.form.patchValue({
				pageNo: !!pageNo ? pageNo : this.form.value['pageNo'],
				pageUid: pageUid,
				listingUid: res,
			});
			ecommNavDiag.destroy();
			this._thumb = 'https://' + this.appService._currentSite.url + '/pages/' + pageUid + '/thumbnail.png';
			this.refreshView();
		});
		ecommNavDiag.componentRef.instance.close.pipe().subscribe(res => {
			this.form.patchValue({
				pageNo: !!pageNo ? pageNo : this.form.value['pageNo'],
				pageUid: pageUid,
				listingUid: null,
			});
			ecommNavDiag.destroy();
			this._thumb = 'https://' + this.appService._currentSite.url + '/pages/' + pageUid + '/thumbnail.png';
			this.refreshView();
		});
		ecommNavDiag.open();
	}

	openGoogleMapsDialog() {
		let googleMaps: DialogWindow<GoogleMapsDialogComponent>;
		googleMaps = createGoogleMapsDialogWindow(this.windowService, this.form.controls.address.value);
		googleMaps.componentRef.instance.outLocation.subscribe(result => {
				googleMaps.destroy();
			});
		googleMaps.componentRef.instance.close.subscribe(() => {
				googleMaps.destroy();
			});
		googleMaps.open();
	}

	getFileClass(file: string) {
		const ext = file.split('.').pop();
		switch (ext) {
			case 'pdf':
				return 'fa fa-file-pdf-o';
			case 'doc':
			case 'docx':
				return 'fa fa-file-word-o';
			case 'png':
				return 'fa fa-file-picture-o';
		}
	}

	getFiles(skip: number = 0, take: number = 9): Observable<FileInfo[]>{
		// if (this.linkMode === 0 && this.form.value.type !== 'download')
    //   return Rx.Observable.of([]);
		return this.appService.getFiles(skip, take);
	}

	onUploadFile(event: any) {
		let fileList = (this._importFile.nativeElement as HTMLInputElement).files;
		let files: File[] = [];

		if (fileList) {
			(Array.prototype.slice.apply(fileList) as File[]).forEach(file => {
				files.push(file);
			});
			this.callUploadFiles(files);
		}
	}

	onDeleteFile(file: FileInfo, index: number) {
		this.refreshView(true);
		this.appService.removeFile(file.name).subscribe(
			res => {
				if (res == true) {
					this._files.splice(index, 1);
				}
        		this.refreshView();
			},
			error => { this.refreshView(); }
		);
	}

	callUploadFiles(files: File[]=[]) {
		if (files.length==0) return;
		this.refreshView(true);
		this.appService.uploadFiles(files).subscribe(
			event => {
				switch (event.type) {
					case HttpEventType.Sent:
						// console.log(`Uploading file "${index}" of size ${f.size}.`);
						break;
					case HttpEventType.UploadProgress:
						// Compute and show the % done:
						break;
					case HttpEventType.Response:
						if (event.body && event.body['urls']) {
							let files: FileInfo[] = [];
							event.body['urls'].map((url: FileInfo) => {
                				files = files.concat(url);
							});
							this.uploadedFiles.next(files);
						} else {
							this.refreshView();
						}
						break;
					// default:
					//     console.log(`File "${index}" surprising upload event: ${event.type}.`);
				}
			},
			error => {
				console.log(error);
				this.refreshView();
				// this.alertService.playToast('Failed', `There is an error while uploading ${f.name}. Try again`, 1);
			},
			() => {
			}
		);
	}

	exportFile() {
		if (!this.form.controls.linkFile.value) return;
		//document.execCommand("SaveAs",true,"https://www.google.ru/logos/doodles/2016/2016-hockey-world-championship-5085766322487296.2-hp.jpg");
		this.appService.downloadFile(this.form.controls.linkFile.value.location + '/' + this.form.controls.linkFile.value.name, this.form.controls.linkFile.value.name);
	}

	onSubmit(f: number = 1) {
		if (f == 0) {
			this.submit.emit(null);
			return;
		}
		if (this.linkMode == 0) {
			this.submit.emit(this.form.LinkValue.target);
		} else {
			this.submit.emit(new LinkDownload(this.form.controls.linkFile.value));
		}
	}

	onClose() {
		this.close.emit();
	}

	refreshView(loading: boolean = false) {
		try{
			this._uploading = loading;
			this.changeDetector.detectChanges();
		} catch(e) {
    	}
	}

	dropped(event: UploadEvent) {
	  const fileEntries = this.appService.dropped(event, this.dragEle);
		  let files: File[] = [];

	  fileEntries.forEach(f=> {
		if (f.isFile) {
		  f.file(file=> {
			files.push(file);
			if (files.length == fileEntries.length)
				this.callUploadFiles(files);
		  });
		}
	  });
	}

	fileOver(event: DragEvent) {
		this.dragEle = this.appService.fileOver(event, this.dragEle);
	}

	fileLeave(event: DragEvent) {
		  this.appService.fileLeave(event, this.dragEle);
	}

	onLinkFileOptionChange(e, file) {
		const target = e.target;
		if (target.checked) {
			this.form.patchValue({linkFile: file});
			this.changeDetector.detectChanges();
		} else {

		}
	}

	ngOnDestroy() {
		this.viewInited = false;
		this.subs.forEach(s => s.unsubscribe());
	}
}
