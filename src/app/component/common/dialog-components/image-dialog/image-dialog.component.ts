import { Component, ViewChild, AfterViewInit, ElementRef, Input, Output, OnInit, ChangeDetectorRef, EventEmitter, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import * as imageUrl from '@app-lib/functions/image-url';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { createImageImportDialogWindow } from "@app-dialogs/image-import-dialog/image-import-dialog.component";
import { ImagePath, ImageInfo } from '@app/models';
import { WSService, ImageService } from '@app/services';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

import { environment } from '@app-environments/environment';

export function createImageDialogWindow(
	windowService: WindowService,
	imageInfo: ImageInfo = ImageInfo.empty()
): DialogWindow<ImageDialogComponent> {
	return windowService.create<ImageDialogComponent>(
		ImageDialogComponent,
		{
			width: 400,
			position: {
				left: 'calc(50% - 200px)',
				top: '0px'
			},
			maxHeight: 1000,
			modal: true,
			draggable: false,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.imageInfo = imageInfo;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	selector: 'image-dialog',
	templateUrl: 'image-dialog.component.html',
	styleUrls: ['image-dialog.component.css']
})
export class ImageDialogComponent implements OnInit, OnDestroy {
	@Input('imageInfo') imageInfo: ImageInfo = ImageInfo.empty();
	@ViewChild('importFile') public _importFile: ElementRef;
	@ViewChild('imagesContainer') public _imagesContainer: ElementRef;

	@Output('submit') submit = new EventEmitter<ImageInfo>();
	@Output('close') close = new EventEmitter<void>();
	// ------------------------------------------------------------------------
	public _size: number[] = [10, 100];
	public _imagesContainerScroll = new Rx.Subject<void>();
	public _images: ImagePath[] = [];
	public _openImageEditor = new Rx.Subject<void>();
	public _openImportDialog = new Rx.Subject<void>();

	public sizeControl: FormControl = new FormControl(10);
	public whichImage: FormControl = new FormControl(undefined);

	private categories: any = [];
	private viewInited: boolean = false;
	private subs: Rx.Subscription[] = [];

	@ViewChild('imageNavigator') imageNavigator: ElementRef;

	constructor(
		private imageService: ImageService,
		private changeDetector: ChangeDetectorRef,
		private sanitizer: DomSanitizer,
		private windowService: WindowService,
		private wsService: WSService,
	) { }

	ngOnInit() {
		// const initialImages = this.getImages();
		// const moreImages = this._imagesContainerScroll.map(() => {
		//	 const el = this._imagesContainer.nativeElement as HTMLElement;
		//	 return el.scrollHeight - el.offsetHeight - el.scrollTop;
		//	 })
		//	 .filter(scrollBottom => scrollBottom === 0)
		//	 .map(() =>
		//		 this.getImages(this._images.length))
		//	 .switch().publish().refCount();

		this.whichImage.setValue(this.imageInfo.image);
		this.sizeControl.setValue(this.imageInfo.size);

		this.subs = [
			// initialImages.subscribe(r=> {
			//	 this._images = [];
			//	 if (r && r.data) {
			//	   r.data.forEach(r=> {
			//		 let imageItems = r.items.filter(i=>i.itemType == 'ImageItem');
			//		 imageItems.forEach(ii => {
			//		   this._images.push(ii.content.image)
			//		 })
			//	   });
			//	 }
			//	 this.changeDetector.detectChanges();
			// }),
			// moreImages.subscribe(r=> {
			//	 this._images = [...this._images, ...r];
			//	 this.changeDetector.detectChanges();
			// }),
			this.sizeControl.valueChanges.subscribe(value=> {
				this.imageInfo.size = Math.floor(value);
				this.changeDetector.detectChanges();
			}),
			this.whichImage.valueChanges.subscribe(value=> {
				this.imageInfo.image = value == 'undefined' ? undefined : value;
				this.changeDetector.detectChanges();
			})
		];
		this.viewInited = true;
		this.getCategories();
	}

	isChecked(img) {
		return lodash.isEqual(this.whichImage.value, img);
	}

	getCategories() {
	  const categories = this.wsService.getCategories(null, environment.NavigationImages);
	  categories.subscribe(
		res => {
		  this.categories = res;
		  this.getImages();
		},
		error => {
		  console.log('category', error);
		},
		() => {
		}
	  );
	}

	getImages(skip?: number, take?: number) {
		this.wsService.getThemePage(this.categories[0].uid, null, null, null, true, true, environment.NavigationImages)
		  .pipe()
		  .subscribe(
			r => {
			  this._images = [];
			  if (r && r['data']) {
				r['data'].forEach(r=> {
				  let imageItems = r.items.filter(i=>i.itemType == 'ImageItem');
				  imageItems.forEach(ii => {
					this._images.push(ii.content.image)
				  })
				});
			  }
			  if (this.viewInited)
				this.changeDetector.detectChanges();
			},
			error => {}
		  )
		//return this.imageService.getImages('64713d47-e785-497d-adf4-f7828d4be41e', skip ? skip : 0, take ? take : 9);
	}

	getbackImage(img: ImagePath): SafeStyle {
		if (img) {
			return this.sanitizer.bypassSecurityTrustStyle(imageUrl.imageUrl(img));
		}
		else {
			return '';
		}
	}

	getbackImageString(img: ImagePath): string{
		return imageUrl.imageUrl(img);
	}

	openImportDialog() {
		const importDialog = createImageImportDialogWindow(this.windowService);
		importDialog.componentRef.instance.submit.subscribe(s => {
			importDialog.destroy();
			this._images = [...this._images, s];
			this.whichImage.setValue(s);
		});

		importDialog.componentRef.instance.close.subscribe(s => {
			importDialog.destroy();
		});
		importDialog.open();
	}

	openFeedbackDialog() {
		createFeedbackDialogWindow(this.windowService, 'ca.n.117').open();
	}

	onAdd(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		this.submit.emit(this.imageInfo);
	}

	onClose() {
		this.close.emit();
	}

	ngOnDestroy() {
		this.viewInited = false;
		this.subs.forEach(s => s.unsubscribe());
	}
}
