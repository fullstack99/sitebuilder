import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, ViewChildren, ElementRef, HostListener, Input, QueryList, AfterViewInit, Renderer } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box, Rect } from '@app-lib/rect/rect';
import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { CommonCanvasComponent } from '@app-common/common-canvas/common-canvas.component';
import { Page,
		Item, ItemContent,
		ImageItemContent, TextItemContent, ItemGroupContent,
		SurveyItemContent, CommonItemContent,
		SurveyInfo, Branch, Question, SurveySingleTextInfo, EndSurveyInfo } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { WSService, SitemapService, FeedbackService } from '@app/services';
import { AppService } from '@app/app.service';
import { environment } from "@app-environments/environment";

export function createProductVideoFeedbackDialogWindow(
	windowService: WindowService,
	width: number = 860,
	height: number = 750
): DialogWindow<ProductVideoFeedbackDialogComponent> {
	return windowService.create<ProductVideoFeedbackDialogComponent>(
		ProductVideoFeedbackDialogComponent,
		{
			width: width,
			height: height,
			modal: true,
			draggable: true,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	templateUrl: './product-video-feedback-dialog.component.html',
	styleUrls: ['./product-video-feedback-dialog.component.css']
})

export class ProductVideoFeedbackDialogComponent implements OnInit, OnDestroy, AfterViewInit{

	@Output() submit = new EventEmitter<SurveyItemContent>();
	@Output() close = new EventEmitter<void>();

  @ViewChild(CommonCanvasComponent) commonCanvas: CommonCanvasComponent;

	public survey_info: SurveyInfo = new SurveyInfo();
	public _page: Page = new Page();

	private viewInited: boolean = false;
	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private elementRef: ElementRef,
		private sitemapService: SitemapService,
		private windowService: WindowService,
		private wsService: WSService,
		private appService: AppService,
		private sanitizer: DomSanitizer,
		private renderer: Renderer
	) { }

	ngOnInit() {

		this._page.items = [];

		this.getCategories();

		this.subs = [
		  this.appService.closeDialog.subscribe(() => {
				this.onClose(null);
		  })
		];
	}

	ngAfterViewInit() {
		this.viewInited = true;
		// this.postFormData();
		// this.subs.push(
		// 	this.commonCanvas.history.value.subscribe(r=> {
		// 		this.refreshView();
		// 	})
		// )
  	}

  	getCategories() {
		const suid = environment.ProductVideo1;
		const categories = this.wsService.getCategories(null, suid);
		categories.subscribe(
			(res: any) => {
				if (res && res[0]) {
				  this.getProductVideo(res[0]['uid'])
						.pipe()
						.subscribe(
						  (r: any) => {
								if (r && r.data) {
								  console.log(r.data)
								  this._page = this.appService.createPage(r.data[0], false, false);
								  this._page.items.forEach(item => {
										if (item.itemType != 'HFItem')
										  item.content.box = item.content.box.moveBy(-150, 0);
								  })
								}
								this.refreshView();
						  },
						  error => [

						  ]
						)
				  }
			},
			error => {
				console.log('category', error);
			},
			() => {
			}
		);
  	}

  	getProductVideo(uid) {
		let suid = environment.ProductVideo1;
		return this.wsService.getThemePage(uid, null, null, null, true, true, suid);
  	}
	onSubmit(event: MouseEvent) {

  	}

	openFeedbackDialog(e: MouseEvent) {
		createFeedbackDialogWindow(this.windowService, '').open();
	}

	onClose(e: MouseEvent) {
		if (e)
		  e.stopPropagation();
		this.close.emit();
	}

	refreshView() {
		if (this.viewInited)
			this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
		this.viewInited = false;
		this.subs.forEach(s => s.unsubscribe());
	}
}
