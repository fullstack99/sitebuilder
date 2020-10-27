import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, AfterViewInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { SafeStyle, DomSanitizer } from '@angular/platform-browser';
import {
	clamp as _clamp,
	get as _get,
	range as _range,

} from 'lodash';
import { Observable, Subject, Subscription } from 'rxjs';
import * as imageUrl from '@app-lib/functions/image-url';
import { createImageImportDialogWindow } from '@app-dialogs/image-import-dialog/image-import-dialog.component';
import { createImageEditorWindow, } from '@app-dialogs/image-editor/image-editor.component';
import { createLinkingDialogWindow, LinkingForm, Link } from '@app-dialogs/linking-dialog/linking-dialog.component';
import { LoadingComponent } from '@app-ui/loading/loading.component';
import { updateArrayAt, padArray, withArray } from '@app-lib/array/array';
import { ImagePath, Slide } from '@app/models';
import { AppService } from '@app/app.service';
import { WindowService } from '@app-common/window/window.service';

@Component({
	moduleId: module.id,
	selector: 'slideshow-gallery',
	templateUrl: 'slideshow-gallery.component.html',
	styleUrls: ['slideshow-gallery.component.css']
})

export class SlideshowGalleryComponent implements OnInit, AfterViewInit, OnDestroy {

	@Input('slides') editSlides: Slide[] = [];
	@Input() invalid: boolean = false;
	@Input() maxSlidesNum: number = 9;

	@Output() result = new EventEmitter<Slide[]>();

	@ViewChild('result') public _result: ElementRef;
	@ViewChild(LoadingComponent) loadingComponent: LoadingComponent;

	public _loading: boolean = false;
	public _dragFile = new Subject<ImagePath>();
	public viewInited = true;

	public _prevSlide = new Subject<void>();
	public _nextSlide = new Subject<void>();
	public _gotoSlide = new Subject<number>();
	public _openLinkingDialog  = new Subject<void>();
	public _openImportDialog   = new Subject<void>();
	public _clearSlide = new Subject<void>();

  	public slides: Slide[] = _range(0, 9).map(() => new Slide());
	public setSlidesSub = new Subject<Slide[]>();
	public toggleThumbsGuideSub = new Subject<void>();
	public toggleDotsGuideSub   = new Subject<void>();

	// ---------------------------------------------------------------
	public slideIndexChangeSub = new Subject<number[]>();
	public activeSlideIndex: number = 0;
	public dispSlideIndex: number = 0;

	// ---------------------------------------------------------------
	public thumbDragStartSub   = new Subject<number>();
	public thumbDragEndSub	 = new Subject<number>();
	public thumbDragSub		= new Subject<[number, number]>();

	private _callingAPI: Subscription;
	private _subs: Subscription[] = [];

	constructor(
		private windowService: WindowService,
		private changeDetector: ChangeDetectorRef,
		private appService: AppService,
		private sanitizer: DomSanitizer
	) {}

  	ngOnInit() {
		this.slides = _range(0, this.maxSlidesNum).map(() => new Slide());

		this._subs = [
			this._dragFile.subscribe(r => {
				this.slides[this.activeSlideIndex].image = <ImagePath>r;
				this.emitResult();
				this.refreshView();
			}),
			this._clearSlide.subscribe(() => {
				this.slides = updateArrayAt(this.slides, this.activeSlideIndex, s => new Slide());
				this.emitResult();
				this.refreshView();
			}),
			this.setSlidesSub.subscribe(r => {
				this.slides = padArray(<Slide[]>r, this.slides.length, () => new Slide);
				this.emitResult();
				this.refreshView();
			}),
			this.slideIndexChangeSub.subscribe(r => {
				this.slides = withArray(this.slides, ar => (
							<number[]>r).forEach((di, i) => { ar[i + di] = this.slides[i];	}));
				this.emitResult();
				this.refreshView();
			}),

			this._prevSlide.subscribe(() => {
				this.activeSlideIndex = _clamp(this.activeSlideIndex - 1, 0, this.slides.length - 3);
				if (this.activeSlideIndex < this.dispSlideIndex)
					this.dispSlideIndex = this.activeSlideIndex;
				this.refreshView();
			}),
			this._nextSlide.subscribe(() => {
				this.activeSlideIndex = _clamp(this.activeSlideIndex + 1, 0, this.slides.length - 3);
				if (this.activeSlideIndex > this.dispSlideIndex)
					this.dispSlideIndex += 1;
				this.refreshView();
			}),
			this._gotoSlide.subscribe(r => {
				this.activeSlideIndex = r;
				this.refreshView();
			}),

			Observable.merge(
				this.thumbDragStartSub,
				this.thumbDragEndSub,
				this.thumbDragSub,
				this.slideIndexChangeSub
			)
			.subscribe(() => this.changeDetector.detectChanges())
		];

		if (this.editSlides && this.editSlides.length > 0)
			this.setSlidesSub.next(this.editSlides);
	}

	ngAfterViewInit() {
		this.viewInited = true;
	}

	openImageImportDialog() {
		const importDialog = createImageImportDialogWindow( this.windowService);
		importDialog.componentRef.instance.submit.subscribe(res => {
			importDialog.destroy();
			this._dragFile.next(res);
		});

		importDialog.componentRef.instance.close.subscribe(() => {
			importDialog.destroy();
		});
		importDialog.open();
	}

	openImageEditorDialog() {
		const imageEditorDialog = createImageEditorWindow(this.windowService);

		if (this.slides[this.activeSlideIndex]) {
			imageEditorDialog.componentRef.instance.openImageInEditor(this.slides[this.activeSlideIndex].image);
		} else {
			imageEditorDialog.componentRef.instance.refresh();
		}

		imageEditorDialog.componentRef.instance.newImage.subscribe(res => {
				imageEditorDialog.destroy();
				this._dragFile.next(res);
			});

		imageEditorDialog.componentRef.instance.close.subscribe(() => {
				imageEditorDialog.destroy();
			});
		imageEditorDialog.open();
	}

	openLinkDialog() { // linkMode: 0 => link, 1 => download
		const linkDialog = createLinkingDialogWindow(this.windowService, new LinkingForm(this.slides[this.activeSlideIndex].link));
		linkDialog.componentRef.instance.submit.subscribe(link => {
			this.slides[this.activeSlideIndex].link = <Link>link;
				this.emitResult();
				this.refreshView();
		});
		linkDialog.componentRef.instance.close.subscribe(() => {
			linkDialog.destroy();
		});
	}

	emitResult() {
		if (!this.viewInited) return;
		this.result.emit(this.slides);
	}

	onDragOver(e) {
		e.preventDefault();
		(this._result.nativeElement as HTMLElement).style.opacity = '0.5';
	}
	onDragEnter(e) {
		e.preventDefault();
	}
	onDragLeave(e) {
		e.preventDefault();
		(this._result.nativeElement as HTMLElement).style.opacity = '1';
	}
	onDrop(e) {
		e.preventDefault();
		(this._result.nativeElement as HTMLElement).style.opacity = '1';

		const files = e.dataTransfer.files;

		if (files.length > 0 && files[0].type.indexOf('image') >= 0) {
			this.refreshView(true);
			this._callingAPI = this.appService.uploadImages([files[0]]).subscribe(
				event => {
					switch (event.type) {
						case HttpEventType.Sent:
							// console.log(`Uploading file "${index}" of size ${f.size}.`);
							break;
						case HttpEventType.UploadProgress:
							if (this.loadingComponent)
								this.loadingComponent.set(Math.min(event.loaded / event.total * 100, 98));
							break;
						case HttpEventType.Response:
							if (this.loadingComponent)
								this.loadingComponent.complete();

							const tuid = _get(event, 'body.tuid');
							const img = _get(event, ['body', 'urls', 0]);

							if (tuid) {
								localStorage.setItem('tuid', _get(event, 'body.tuid'));
							}
							if (img) {
								this._dragFile.next(img as ImagePath);
							} else {
								this.refreshView();
							}
							break;
					}
				},
				error => {
					console.log(error);
					this.refreshView();
					// this.alertService.playToast('Failed', `There is an error while uploading ${f.name}. Try again`, 1);
				},
				() => {}
			);
		}
	}

	onCancelled() {
		if (!this._callingAPI) return;
		this._callingAPI.unsubscribe();
		this.refreshView();
	}

	backgroundImage(image: ImagePath): SafeStyle {
		return image ? this.sanitizer.bypassSecurityTrustStyle(imageUrl.imageUrl(image)) : '';
  	}

	refreshView(loading: boolean = false) {
		this._loading = loading;
		this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
		this._subs.forEach(sub => sub.unsubscribe());
	}

	@HostListener('dragover', ['$event']) onEleDragOver(e) {
		e.preventDefault();
	}

	@HostListener('drop', ['$event']) onEleDrop(e) {
		e.preventDefault();
	}
}
