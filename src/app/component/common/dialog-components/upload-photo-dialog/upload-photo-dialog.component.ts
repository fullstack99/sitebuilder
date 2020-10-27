import { Component, Output, EventEmitter, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy,
		 ViewChild, ElementRef, Input, Renderer
	   } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { get as _get } from 'lodash';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { PhotoInfo, PhotoImage, Watermark, ImagePath } from '@app/models';
import { AlertService } from '@app/services';
import { AppService } from '@app/app.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createUploadPhotoDialogWindow(
	windowService: WindowService,
	files: File[] = []
): DialogWindow<UploadPhotoDialogComponent> {
	return windowService.create<UploadPhotoDialogComponent>(
		UploadPhotoDialogComponent,
		{
			width: 650,
			minHeight: 300,
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.files = files;
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	templateUrl: 'upload-photo-dialog.component.html',
	styleUrls: ['upload-photo-dialog.component.css']
})

export class UploadPhotoDialogComponent implements OnInit, AfterViewInit, OnDestroy {

	@Input('files') files: File[] = [];

	@Output('close') close = new EventEmitter<void>();
	@Output('submit') submit = new EventEmitter<PhotoInfo>();

	@ViewChild('progressEle') progressEle: ElementRef;
	@ViewChild('image') private _image: ElementRef;

	private fileReader = new FileReader();
	private import_files: any = [];
	public selected = 'one';
	public index: number = 0;
	public showIndex: number = 0;
	public isValid = new FormControl(false);
	public latest =  new FormControl(false);

	public loading: boolean = false;
	public progress: number = 0;
	private uploadingImages: Subscription;

	private subs: Subscription[] = [];

	constructor(
		private elementRef: ElementRef,
		private changeDetector: ChangeDetectorRef,
		private windowService: WindowService,
		private renderer: Renderer,
		private appService: AppService,
		private alertService: AlertService
	) {}

	ngOnInit() {
		this.subs = [
			Observable.merge(
				this.latest.valueChanges,
				this.isValid.valueChanges
			).subscribe(() => this.changeDetector.detectChanges())
		];
	}

	ngAfterViewInit() {
		this.imageView();
	}

	onSelect(event: any) {
		this.selected = event.target['value'];
		this.checkValid();
	}

	nextImg(skip: boolean = false) {
		if (this.index >= this.files.length) {
			this.checkValid();
			return;
		}

		// var reader = new FileReader();

		if (!skip) {
			this.import_files.push(this.files[this.index]);
			this.showIndex++;
		}

		this.index++;
		this.imageView();
		this.refreshView();
	}

	imageView() {
		let viewIndex: number = 0;
		viewIndex = this.index == 0 ? this.index : this.index >= this.files.length - 1 ? this.files.length - 1 : this.index + 1;
		this.fileReader.onload = (e) => {
			const src: any = e.target['result'];
			this.renderer.setElementAttribute(this._image.nativeElement, 'src', src);
		};
		this.fileReader.readAsDataURL(this.files[viewIndex]);
	}

	checkValid() {
		if (this.index == this.files.length) this.latest.setValue(true);
		if (this.selected == 'all' || this.index == this.files.length)
			this.isValid.setValue(true);
		else
			this.isValid.setValue(false);
	}

	onClose() {
		this.close.emit();
	}

	onSubmit() {
		const files: File[] = (this.selected == 'one') ? this.import_files : this.files;
		// let random = Math.floor(Math.random() * (9999 - 0 + 1)) + 0;
		// let imagePath = "Album_" + ("000" + random).slice(-4);
		this.refreshView(true);
		this.uploadingImages = this.appService.uploadImages(files).subscribe(
			event => {
				switch (event.type) {
					case HttpEventType.Sent:
						// console.log(`Uploading file "${index}" of size ${f.size}.`);
						break;
					case HttpEventType.UploadProgress:
						this.progress = Math.min(event.loaded / event.total * 100, 98);
						if (this.progressEle) {
							this.renderer.setElementStyle(this.progressEle.nativeElement, 'width', Math.max(this.progress, 10).toFixed(1) + '%');
							this.progressEle.nativeElement.innerText = this.progress.toFixed(1) + '%';
						}
						break;
					case HttpEventType.Response:
						// this.renderer.setElementClass((this.elementRef.nativeElement as HTMLElement).parentElement.parentElement, 'disable', false);
						const urls = _get(event, ['body', 'urls']);
						if (urls) {
							const photoImages: PhotoImage[] = urls.map(url => ({image: url, desc: ''}));
							this.submit.emit(
								{
									imgs: photoImages,
									watermark: null,
									isLabel: 'Show Label',
									layout: 'side',
									index: 0
								}
							);
						}
						break;
				  }
			},
			error => {
				console.log(error);
				this.renderer.setElementClass((this.elementRef.nativeElement as HTMLElement).parentElement.parentElement, 'disable', false);
				this.refreshView(false);
				this.alertService.playToast('Failed', `There is an error while uploading. Try again`, 1);
			},
			() => {
			}
		);
	}

	openFeedbackDialog() {
		  createFeedbackDialogWindow(this.windowService, 'wimi.120').open();
	}

	refreshView(loading: boolean = false) {
		this.loading = loading;
		this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
		if (this.uploadingImages) {
			this.uploadingImages.unsubscribe();
		}
		this.subs.forEach(s => s.unsubscribe());
	}
}
