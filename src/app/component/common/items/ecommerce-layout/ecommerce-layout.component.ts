import { Component, Output, AfterViewInit, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, Input } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import * as Rx from 'rxjs/Rx';
import { SwiperComponent, SwiperDirective, SwiperConfigInterface,
	SwiperScrollbarInterface, SwiperPaginationInterface } from 'ngx-swiper-wrapper';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { Item, CommonItemContent, EcommerceInfo } from '@app/models';

import { WindowService, DialogWindow } from '@app-common/window/window.service';

/** */
export function createEcommerceLayoutWindow(
	windowService: WindowService,
	item: Item,
	containerWidth: number
): DialogWindow<EcommerceLayoutComponent> {
	return windowService.create<EcommerceLayoutComponent>(
		EcommerceLayoutComponent,
		{
			width: 450,
			height: 350,
			modal: true,
			draggable: true,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.item = item;
		comp.containerWidth = containerWidth;
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
	});
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
	moduleId: module.id,
	templateUrl: 'ecommerce-layout.component.html',
	styleUrls: ['ecommerce-layout.component.css']
})
export class EcommerceLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
	@Input() item: Item = new Item();
	@Input() containerWidth: number = 1100;

	@Output() close = new EventEmitter<void>();
	@Output() submit = new EventEmitter<Item>();

	@ViewChild('usefulSwiper') usefulSwiper: any;
	@ViewChild(SwiperDirective) directiveRef: SwiperDirective;

	public itemContent: CommonItemContent<EcommerceInfo>;
	public info: EcommerceInfo = new EcommerceInfo;

	public styles: Array<string> = ['assets/images/canvas/ecommerce-style/ecom-page-mocup-1.png', 'assets/images/canvas/ecommerce-style/ecom-page-mocup-2.png', 'assets/images/canvas/ecommerce-style/ecom-page-mocup-3.png', 'assets/images/canvas/ecommerce-style/ecom-page-mocup-4.png'];

	public isBeginning: boolean = true;
	public isEnd: boolean = false;
	public config: Object = {
		pagination: '.swiper-pagination',
		paginationClickable: true,
		slidesPerView: 1,
		nextButton: '.swiper-button-next',
		prevButton: '.swiper-button-prev',
	};;

	public activeIndex: number = 0;
	private _subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private sanitizer: DomSanitizer,
		private windowService: WindowService
	) {}

	ngOnInit() {
		this.itemContent = this.item.content as CommonItemContent<EcommerceInfo>;
		this.info = this.itemContent.info.value;

		this._subs = [
		];

		setTimeout(() => {
			if (!this.directiveRef) return;
			this.directiveRef.setIndex(this.info.layoutType);
			this.directiveRef.update();
		})
	}

	ngAfterViewInit() {
	}

	onClose() {
		this.close.emit();
	}

	onSubmit(val: number) {
		let width = 1040;
		
		switch (val) {
			case 1:
				width = 850;
				break;
			case 3:
				width = 300;
				break;
		}

		width = Math.min(this.containerWidth, width);
		const left = Math.max((this.containerWidth - width) / 2, 0);
		const top = val < 3 ? Math.max(10, this.itemContent.box.top) : this.itemContent.box.top;
		this.info.layoutType = val;
		this.itemContent = this.itemContent.setInfo(Maybe.just<EcommerceInfo>(this.info));
		this.itemContent = this.itemContent.setBox(new Box(left, left + width, top, top + 200));
		this.submit.emit(this.item.setContent(this.itemContent));
	}

	onIndexChange(event) {
		this.activeIndex = event;
		this.isBeginning = this.activeIndex == 0;
		this.isEnd = this.activeIndex == this.styles.length - 1;
		this.changeDetector.detectChanges();
	}

	backgroundImage(url: string): SafeStyle {
		return url ? this.sanitizer.bypassSecurityTrustStyle(`url('${encodeURIComponent(url)}')`) : '';
	}

	openFeedbackDialog(): void {
		createFeedbackDialogWindow(this.windowService, 'em.t.110').open();
	}

	ngOnDestroy() {
		this._subs.forEach(s => s.unsubscribe());
	}
}
