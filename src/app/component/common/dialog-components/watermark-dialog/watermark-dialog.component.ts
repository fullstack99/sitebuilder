import {
	ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, AfterViewInit, Renderer2 } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as imageUrl from '@app-lib/functions/image-url';
import { SplitTextBoxComponent } from '@app-ui/split-text-box/split-text-box.component';
import { ImageImportDialogComponent, createImageImportDialogWindow } from '@app-dialogs/image-import-dialog/image-import-dialog.component';
import { ImageEditorComponent, createImageEditorWindow } from '@app-dialogs/image-editor/image-editor.component';
import { ImagePath, Watermark } from '@app/models';
import { createFeedbackDialogWindow, FeedbackDialogComponent } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

import { WindowService, DialogWindow } from '@app-common/window/window.service';
export { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createWatermarkDialogWindow(
	windowService: WindowService,
	image: ImagePath,
	watermark: Watermark = new Watermark
): DialogWindow<WatermarkDialogComponent> {
	return windowService.create<WatermarkDialogComponent>(
		WatermarkDialogComponent,
		{
			width: 450,			
			modal: true,
			draggable: false,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.image = image;
		comp.watermark = watermark;
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	templateUrl: 'watermark-dialog.component.html',
	styleUrls: ['watermark-dialog.component.css']
})
export class WatermarkDialogComponent implements OnInit, OnDestroy, AfterViewInit {

	@Input('image') image: ImagePath;
	@Input('watermark') watermark: Watermark;

	@Output('close') close = new EventEmitter<void>();
	@Output('submit') submit = new EventEmitter<Watermark>();

	@ViewChild('resultImage') resultImage: ElementRef;
	@ViewChild('setText') setText: ElementRef;	
	@ViewChild('watermarkTextBox') watermarkTextBox: ElementRef;

	public _imageWatermark = new FormControl({name: '', location: ''});	
	public _position = new FormControl('top left');

	public textEditorEnabled = false;
	private textEditorText = '';

	private canRefresh = true;
	private _subs: Rx.Subscription[] = [];

	constructor(
		private elementRef: ElementRef,
		private changeDetector: ChangeDetectorRef,
		private windowService: WindowService,
		private sanitizer: DomSanitizer,
		private _renderer: Renderer2,
	) { }

	ngOnInit() {
		this.canRefresh = true;

		if (this.watermark) {
			this._imageWatermark.setValue(this.watermark.imageWatermark);
			this.textEditorText = this.watermark.textWatermark;
			this._position.setValue(this.watermark.position);
		}

		this._subs = [
			Rx.Observable.merge(
				this._imageWatermark.valueChanges,
				)
				.subscribe(() => {
					this.changeDetector.detectChanges();
					this.getImageSize(this._imageWatermark.value, this.resultImage.nativeElement);
					// this.getImageSize(this._imageWatermark.value, (this.resultImage.nativeElement as HTMLElement).parentElement, 'contain');
				})
		];

		(this.elementRef.nativeElement as HTMLElement).parentElement.style.top = document.body.scrollTop + 50 + 'px'; 
	}

	ngAfterViewInit() {
		if (this.textEditorText) {
			(this.setText.nativeElement as HTMLElement).innerHTML = this.textEditorText;
			(this.watermarkTextBox.nativeElement as HTMLElement).innerHTML = this.textEditorText;
		}
		this.setImageWatermarkStyle();
	}

	openImageEditorDialog() {
		let imageEditorDialog = createImageEditorWindow(this.windowService);

		imageEditorDialog.componentRef.instance.openImageInEditor(this._imageWatermark.value);

		imageEditorDialog.componentRef.instance.newImage.subscribe(res => {
				imageEditorDialog.destroy();
				this._imageWatermark.setValue(res);
			});

		imageEditorDialog.componentRef.instance.close.subscribe(() => {
				imageEditorDialog.destroy();
			});
		imageEditorDialog.open();
	}

	backgroundImage(img: ImagePath): SafeStyle {
		return img && img.name ? this.sanitizer.bypassSecurityTrustStyle(`url('${img.location + '/' + img.name}')`) : '';
	}

	imageSrcUrl(img: ImagePath) {
		console.log(imageUrl.imageSrcUrl(img))
		return imageUrl.imageSrcUrl(img);
	}

	onTextEditorClick(): void {
		if (!this.textEditorEnabled) {
			this.textEditorEnabled = true;
			this.refreshView();
		}
	}

	onClearText(e: MouseEvent) {
		if (e)
			e.stopPropagation();
		this.textEditorText = '';
		this.textEditorEnabled = false;
		(this.setText.nativeElement as HTMLElement).innerHTML = this.textEditorText;
		(this.watermarkTextBox.nativeElement as HTMLElement).innerHTML = this.textEditorText;
		this.changeDetector.detectChanges();
	}

	get isValid(): boolean {
		return !this.isTextEmpty || this._imageWatermark.value &&  this._imageWatermark.value.name !='';
	}

	get isTextEmpty(): boolean {
		return !($(this.textEditorText).text().length > 0);
	}

	onTextEditorInput(event: string): void {
		this.textEditorText = event;
		this.refreshView();
	}

	onTextEditorInputText(event: string) {
		(this.setText.nativeElement as HTMLElement).innerHTML = event;
	}

	setWatermarkPosition(position: string) {
		this._position.setValue(position);
		this.setImageWatermarkStyle();
		this.refreshView();
	}

	setImageWatermarkStyle() {
		const imgEle = this.resultImage.nativeElement as HTMLElement;
		const txtEle = this.setText.nativeElement as HTMLElement;

		imgEle.style.setProperty('background-position', this._position.value);
		this.getImageSize(this._imageWatermark.value, imgEle);

		switch (this._position.value) {
			case 'top left':
				this._renderer.setStyle(txtEle, 'margin', '0 auto auto 0');
				break;

			case 'top center':
				this._renderer.setStyle(txtEle, 'margin', '0 auto 0 auto');
				break;

			case 'top right':
				this._renderer.setStyle(txtEle, 'margin', '0 0 auto auto');
				break;

			case 'left':
				this._renderer.setStyle(txtEle, 'margin', 'auto auto auto 0');
				break;

			case 'center':
				this._renderer.setStyle(txtEle, 'margin', 'auto');
				break;

			case 'right':
				this._renderer.setStyle(txtEle, 'margin', 'auto 0 auto auto');
				break;

			case 'bottom left':
				this._renderer.setStyle(txtEle, 'margin', 'auto auto 0 0');
				break;

			case 'bottom center':
				this._renderer.setStyle(txtEle, 'margin', 'auto auto 0 auto');
				break;

			case 'bottom right':
				this._renderer.setStyle(txtEle, 'margin', 'auto 0 0 auto');
				break;

			default:
				this._renderer.setStyle(txtEle, 'margin', '0 auto auto 0');
				break;
		}
	}

	removeWatermark() {
		this._imageWatermark.setValue({name: '', location: ''});
		this.onClearText(null);
	}

	openImportDialog() {
		let importDialog  : DialogWindow<ImageImportDialogComponent>; 
		importDialog = createImageImportDialogWindow(this.windowService);
		importDialog.componentRef.instance.submit.subscribe(result => {
			this._imageWatermark.setValue(result);
		});
		importDialog.open();
	}

	editImageWatermark() {
		if (this._imageWatermark.value != undefined)
			this.openImageEditorDialog();
	}

	getEditorHost() {
		return (this.watermarkTextBox.nativeElement as HTMLElement).parentElement;
	}

	getImageSize(img: ImagePath, ele: HTMLElement, result = '40%') {
		const image = new Image;
		image.onload = (ev) => {
			let width = image.width;
			let height = image.height;

			if (width > ele.offsetWidth * 0.4) {
				const temp = ele.offsetWidth * 0.4;
				height = height * temp / width;
				width = temp;
			}

			if (height > ele.offsetHeight * 0.4) {
				const temp = ele.offsetHeight * 0.4;
				width = width * temp / height;
				height = temp;
			}

			this._renderer.setStyle(ele, 'background-size', `${width}px ${height}px`);
		};
		image.src = imageUrl.imageSrcUrl(img);
	}

	openFeedbackDialog() {
		let feedbackWindow: DialogWindow<FeedbackDialogComponent>;
		feedbackWindow = createFeedbackDialogWindow(this.windowService, 'wimi.120');
		feedbackWindow.open();
	}

	refreshView() {
		if (this.canRefresh)
			this.changeDetector.detectChanges();
	}

	onClose() {
		this.canRefresh = false;
		this.close.emit();
	}

	onSubmit() {
		this.canRefresh = false;
		this.submit.emit(
			{
				position: this._position.value,
				imageWatermark: this._imageWatermark.value,
				textWatermark: this.textEditorText
			}
		);
	}

	ngOnDestroy() {
		this._subs.forEach(s => s.unsubscribe());
	}
}
