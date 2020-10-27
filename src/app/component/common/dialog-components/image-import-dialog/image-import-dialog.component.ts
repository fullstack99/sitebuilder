import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, AfterViewInit, ViewChild, ElementRef, Input	} from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import * as Rx from 'rxjs';
import {
		clamp as _clamp,
		get as _get
	} from 'lodash';
import { createImageEditorWindow, } from '@app-dialogs/image-editor/image-editor.component';
import { createUploadPhotoDialogWindow } from '@app-dialogs/upload-photo-dialog/upload-photo-dialog.component';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { LoadingComponent } from '@app-ui/loading/loading.component';
import { ImagePath, PhotoInfo, PhotoImage } from '@app/models';
import { AppService } from '@app/app.service';
import { ImageService } from '@app/services';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

/** */
export function createImageImportDialogWindow(
	windowService: WindowService,
	directory: boolean = false,
	type: string = 'url',
	enableFolderPlace: boolean = false,
): DialogWindow<ImageImportDialogComponent> {
	return windowService
		.create<ImageImportDialogComponent>(ImageImportDialogComponent, {
			width: 250,
			modal: true,
			draggable: true,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		})
		.changeInputs((comp, window) => {
			comp.directory = directory;
			comp.type = type;
			comp.enableFolderPlace = enableFolderPlace;
			comp.close.subscribe(() => window.close());
			comp.submit.subscribe(() => window.close());
		});
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
	moduleId: module.id,
	templateUrl: 'image-import-dialog.component.html',
	styleUrls: ['image-import-dialog.component.css']
})
export class ImageImportDialogComponent	implements OnInit, OnDestroy, AfterViewInit {
	@Input() directory = false;
	@Input() type = 'url';
	@Input() enableFolderPlace = false; // For only Photo Album

	@Output() close = new EventEmitter<void>();
	@Output() submit = new EventEmitter<any>();
	@Output() window: DialogWindow<ImageImportDialogComponent>;

	@ViewChild(LoadingComponent) loadingComponent: LoadingComponent;
	@ViewChild('importFile') public _importFile: ElementRef;
	// ---------------------------------------------------------------
	public _ribbonPrev = new Rx.Subject<void>();
	public _ribbonNext = new Rx.Subject<void>();
	public _ribbonItemIndex = 0;
	public _loading = false;
	public _loadingText = 'Uploading...';

	// ---------------------------------------------------------------
	public readonly _importSources = [
		{ name: 'Facebook', imageUrl: '/assets/images/canvas/facebook.png' },
		{ name: 'Instagram', imageUrl: '/assets/images/canvas/instagram.png' },
		{ name: 'Dropbox', imageUrl: '/assets/images/canvas/dropbox.png' },
		{
			name: 'Google Drive',
			imageUrl: '/assets/images/canvas/google-drive.png'
		},
		{ name: 'Google +', imageUrl: '/assets/images/canvas/google-plus.png' },
		{ name: 'Flickr', imageUrl: '/assets/images/canvas/flickr.png' },
		{
			name: 'iCloud Apple',
			imageUrl: '/assets/images/canvas/icloud-apple.png'
		},
		{ name: 'Picasa', imageUrl: '/assets/images/canvas/picasa.png' }
	];

	private callingAPI: Rx.Subscription;
	private subs: Rx.Subscription[] = [];

	constructor(
		private elementRef: ElementRef,
		private changeDetector: ChangeDetectorRef,
		private sanitizer: DomSanitizer,
		private windowService: WindowService,
		private appService: AppService,
		private _imageService: ImageService,
	) { }

	ngOnInit() {
		this.subs = [
			this._ribbonPrev.subscribe(() => {
				this._ribbonItemIndex = _clamp(
					this._ribbonItemIndex - 1,
					0,
					this._importSources.length - 3
				);
				this.changeDetector.detectChanges();
			}),
			this._ribbonNext.subscribe(() => {
				this._ribbonItemIndex = _clamp(
					this._ribbonItemIndex + 1,
					0,
					this._importSources.length - 3
				);
				this.changeDetector.detectChanges();
			})
		];
		(this.elementRef.nativeElement as HTMLElement).parentElement.style.top = document.body.scrollTop + 50 + 'px';
	}

	ngAfterViewInit() { }

	backgroundImage(url: string): SafeStyle {
		return url ? this.sanitizer.bypassSecurityTrustStyle(`url('${url}')`) : '';
	}

	onSelect(event: any) {
		let files: File[] = [];
		files = [].slice.apply(event.target.files) as File[];
		if (this.directory) {
			this.openUploadPhotoWin(files);
		} else {
			this.uploadFiles(files);
		}
	}

	openUploadPhotoWin(files: File[]) {
		if (this.type === 'file')
			this.submit.emit({
				type: 'file',
				data: files
			});
		else {
			const uploadPhotoWin = createUploadPhotoDialogWindow(
				this.windowService,
				files
			);
			uploadPhotoWin.componentRef.instance.submit.subscribe(res => {
				uploadPhotoWin.destroy();
				this.submit.emit(res);
			});
			uploadPhotoWin.componentRef.instance.close.subscribe(() => {
				uploadPhotoWin.destroy();
				this.close.emit();
			});
			uploadPhotoWin.open();
		}
	}

	uploadFiles(files: File[]) {
		this.refreshView(true);
		if (this.type == 'file')
			this.submit.emit({
				type: 'file',
				data: files
			});
		else
			this.callingAPI = this.appService.uploadImages(files).subscribe(
				event => {
					switch (event.type) {
						case HttpEventType.Sent:
							// console.log(`Uploading file '${index}' of size ${f.size}.`);
							break;
						case HttpEventType.UploadProgress:
							if (this.loadingComponent)
								this.loadingComponent.set(Math.min(event.loaded / event.total * 100, 98));
							break;
						case HttpEventType.Response:
							const tuid = _get(event, 'body.tuid');
							const img = _get(event, ['body', 'urls', 0]);

							if (tuid) {
								localStorage.setItem('tuid', _get(event, 'body.tuid'));
							}
							if (img) {
								this.submit.next(img as ImagePath);
							} else {
								this.submit.next(undefined);
							}
							break;
					}
				},
				error => {
					console.log(error);
					this.submit.next(undefined);
					// this.alertService.playToast('Failed', `There is an error while uploading ${f.name}. Try again`, 1);
				},
				() => {}
			);
	}

	onCancelled() {
		if (!this.callingAPI) return;
		this.callingAPI.unsubscribe();
		this.refreshView();
	}

	onClose() {
		this.close.emit();
	}

	openFeedbackDialog() {
		createFeedbackDialogWindow(this.windowService, 'wimi.120').open();
	}

	openImageDialog() {
		const imageEditorDialog = createImageEditorWindow(this.windowService, this.enableFolderPlace);
		imageEditorDialog.componentRef.instance.newImage.subscribe(image => {
			if (this.type === 'file')
				this.submit.next({
					type: 'url',
					data: image
				});
			else
				this.submit.next(image);
			imageEditorDialog.destroy();
		});
		imageEditorDialog.componentRef.instance.setFolder.subscribe(path => {
			this._imageService.getFolderImages(1, path)
				.pipe()
				.subscribe(res => {
					const photoImages: PhotoImage[] = res.map(url => ({image: url, desc: ''}));
					this.submit.emit(
						{
							imgs: photoImages,
							watermark: null,
							isLabel: 'Show Label',
							layout: 'side',
							index: 0
						}
					);
				});
			imageEditorDialog.destroy();
		});
		imageEditorDialog.componentRef.instance.close.subscribe(() => {
			imageEditorDialog.destroy();
		});
		imageEditorDialog.componentRef.instance.refresh();
		imageEditorDialog.open();
	}

	refreshView(loading: boolean = false, text: string = 'Saving...') {
		this._loading = loading;
		this._loadingText = text;
		this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}
