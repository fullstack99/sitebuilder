
import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
		 ViewChild, ElementRef, HostListener, Input, OnChanges, SimpleChanges
	   } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { FormControl, FormGroup } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box } from '@app-lib/rect/rect';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { ItemContent, CommonItemContent, DefaultRibbons, SocialInfo } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export { WindowService, DialogWindow } from '@app-common/window/window.service';

/** */
export function createSocialBarWindow(
	windowService: WindowService,
	itemContent: CommonItemContent<SocialInfo>,
	socialInfo: SocialInfo = SocialInfo.empty()
): DialogWindow<SocialBarComponent> {
	return windowService.create<SocialBarComponent>(
		SocialBarComponent,
		{
			width: 320,
			height: 500,
			position: {
				left: 'calc(50% - 120px)',
				top: 'calc(50% - 163px)'
			},
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		if (itemContent)
			comp.itemContent = itemContent;
		comp.socialInfo = socialInfo
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
	});
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
	moduleId: module.id,
	templateUrl: 'social-bar.component.html',
	styleUrls: ['social-bar.component.css']
})
export class SocialBarComponent implements OnInit, OnDestroy {
	@Input() itemContent: CommonItemContent<SocialInfo> = new CommonItemContent<SocialInfo>(Maybe.just(SocialInfo.empty()), new Box(0,240,0,40));
	@Input() socialInfo: SocialInfo = SocialInfo.empty();

	@Output() close = new EventEmitter<void>();
	@Output() submit = new EventEmitter<CommonItemContent<SocialInfo> | SocialInfo>();

	// ---------------------------------------------------------------

	public _defaultRibbons = DefaultRibbons;
	public _type = new FormControl('color');

	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private windowService: WindowService,
		private sanitizer: DomSanitizer
	) {}

	ngOnInit() {
		if (this.itemContent)
			this.socialInfo = this.itemContent.info.get();

		this._type.setValue(this.socialInfo.type);

		this.subs = [
			Rx.Observable.merge(
					this._type.valueChanges,
				)
				.subscribe(() => {
					this.changeDetector.detectChanges();
				})
		];
	}

	onClose() {
		this.close.emit();
	}

	onSubmit() {
		if (this.itemContent)
			this.submit.emit(
				this.itemContent.setInfo(
					Maybe.just<SocialInfo>(new SocialInfo(
						this._type.value,
						this.socialInfo.ribbons)
				))
				.setBox(this.itemContent.box.setRight(this.itemContent.box.left + this.socialInfo.ribbons.length*36))
			);
		else
			this.submit.emit( new SocialInfo( this._type.value, this.socialInfo.ribbons));
	}

	openFeedbackDialog(): void {
		createFeedbackDialogWindow(this.windowService, 'em.t.110').open();
	}

	backgroundRibbon(index: number): SafeStyle {
		let url: string;
		if (this._type.value == 'color')
			url = DefaultRibbons[index].color;
		else
			url = DefaultRibbons[index].gray;
		return this.sanitizer.bypassSecurityTrustStyle(`url('${url}')`);
	}

	backgroundImage(url: string): SafeStyle {
		return this.sanitizer.bypassSecurityTrustStyle(`url('${url}')`);
	}

	addItem(index: number) {
		if (this.socialInfo.ribbons.indexOf(index)>=0) return;

		this.socialInfo.ribbons.push(index);
		this.changeDetector.detectChanges();
	}

	deleteItem() {
		this.socialInfo.ribbons.splice(this.socialInfo.ribbons.length-1, 1);
		this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}
