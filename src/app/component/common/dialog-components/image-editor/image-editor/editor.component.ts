import { Component, ViewChild, AfterViewInit, HostListener, ElementRef, Input,
		 OnChanges, SimpleChanges, OnInit, ChangeDetectorRef, Output, EventEmitter,
		 OnDestroy
	   } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import {
	get as _get
} from 'lodash';

import { ancestors } from '@app-lib/dom/dom';
import { Maybe } from '@app-lib/maybe/maybe';
import * as imageUrl from '@app-lib/functions/image-url';

import { ImagePath } from '@app-models/index';
import { EditorService } from '@app-dialogs/image-editor/editor/editor.service';
import { AppService } from '@app/app.service';
import { UUID } from '@app-lib/uuid/uuid.service';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';
import { whiteTheme } from '@app-shared/constants/tui-themes';
var ImageEditor = require('tui-image-editor');

@Component({
	moduleId: module.id,
	selector: 'editor',
	templateUrl: 'editor.component.html',
	styleUrls: ['editor.component.css']
})
export class EditorComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
	@Input('imageElement') imageElement: Maybe<HTMLImageElement>;
	@Input() image: ImagePath;
	@Input('visibleSave') visibleSave: boolean = false;

	@Output('imageSaved') imageSaved = new EventEmitter<string>();
	@Output('close') close = new EventEmitter<void>();

	@ViewChild('editorContainer') editorContainer: ElementRef;
  // @ViewChild('resizeEle') resizeEle: ElementRef;

	public _loading = false;
	private viewInited = false;
	public enableResize = true;
	public enableOpacity = false;
	public _editorElementWrap: HTMLElement;

	public oldWidth = 0;
	public oldHeight = 0;
	public newWidth = 0;
	public newHeight = 0;
	private opacity = 100;
	public opacityControl: FormControl = new FormControl(100);
	public applied = false;

	private changed: number = 0;
	private uploadingImages: Rx.Subscription;
  	private _imageEditor: any;
	private _subs: Rx.Subscription[] = [];

	constructor(
		private _elementRef: ElementRef,
		private _editorService: EditorService,
		private _appService: AppService,
		private _changeDetectorRef: ChangeDetectorRef
	) {}

	ngOnInit() {
	}

	ngOnChanges(changes: SimpleChanges) {
		if (!this.viewInited) return;
	}

	ngAfterViewInit() {
		this._imageEditor = new ImageEditor(document.querySelector('#tui-image-editor'), {
			includeUI: {
				// loadImage: {
				// 	path: this.image ? `${this.image.location}/${this.image.name}` : '/assets/images/apple.png',
				// 	name: 'Init Image'
				// },
				theme: whiteTheme, // or whiteTheme
				menu: ['draw', 'filter', 'mask', 'rotate', 'crop'],
				// initMenu: 'filter',
				menuBarPosition: 'top'
			},

			cssMaxWidth: 1280,
			cssMaxHeight: 800,
			// selectionStyle: {
			//	 cornerSize: 20,
			//	 rotatingPointOffset: 70
			// },
			usageStatistics: false
		});

		this._imageEditor.loadImageFromURL(this.image ? imageUrl.imageSrcUrl(this.image) : '/assets/images/apple.png', 'Init Image').then((sizeValue) => {
			  	this._imageEditor.ui.activeMenuEvent();
				//  {oldWidth: 0, oldHeight: 0, newWidth: 1600, newHeight: 1066}
				this._imageEditor.ui.resizeEditor({imageSize: sizeValue});
				this.oldWidth = sizeValue.newWidth;
				this.newWidth = sizeValue.newWidth;
				this.oldHeight = sizeValue.newHeight;
				this.newHeight = sizeValue.newHeight;
		this.refreshView();
				// this._imageEditor.resizeCanvasDimension({width: 400, height: 400});
			}).catch(e => {
				console.error(e);
			});

	  this._editorElementWrap = this._imageEditor.ui._editorElementWrap;

	// this._imageEditor.on({
	//	 endCropping: function() {
	//		 console.log('teererer')
	//	 },
	// });

	this._imageEditor.ui._menuElement.addEventListener('click', () => {
		this._editorElementWrap.style.opacity = '1';
		if (this.enableResize) {
			this.enableResize = false;
			this.refreshView();
		}

		if (this.enableOpacity) {
			this.enableOpacity = false;
			this.refreshView();
		}
	});

	this._subs = [
		this._imageEditor.on({
			undoStackChanged: () => {
				this.onSetWH();
			},
			redoStackChanged: () => {
				this.onSetWH();
			},
			objectActivated: (e) => {
				this.onSetWH();
			}
			}
		),
		this.opacityControl.valueChanges.subscribe(res => {
			this._editorElementWrap.style.opacity = '' + res / 100;
			this.refreshView();
		})
	]

		this.viewInited = true;
	}

	onCancelled() {
		if (!this.uploadingImages) return;
		this.uploadingImages.unsubscribe();
		this.refreshView();
	}

	onClose() {
		this.close.emit();
	}

	onSave() {
		const dataURL = this._imageEditor.toDataURL();
		const imageFile = this._appService.dataURLtoFile(dataURL, 'image_' + UUID.UUID() + '.png');
		this.refreshView(true);
		this.uploadingImages = this._appService.uploadImages([imageFile]).subscribe(
			event => {
				switch (event.type) {
					case HttpEventType.Sent:
						// console.log(`Uploading file "${index}" of size ${f.size}.`);
						break;
					case HttpEventType.UploadProgress:
						// Compute and show the % done:
						break;
					case HttpEventType.Response:
						const img = _get(event, ['body', 'urls', 0]);
						if (img) {
							// this.refreshView(false);
							this.imageSaved.emit(img);
						}
						break;
				}
			},
			error => {
				console.log(error);
				this.refreshView(false);
				// this._alertService.playToast('Failed', `There is an error while uploading ${f.name}. Try again`, 1);
			},
			() => {
			}
		);
	}

	onSetWH() {
		let changed = false;
		const size = this._imageEditor.getCanvasSize();
		if (size.width != this.newWidth) {
			this.oldWidth = size.width;
			this.newWidth = size.width;
			changed = true;
		}
		if (size.height != this.newHeight) {
			this.oldHeight = size.height;
			this.newHeight = size.height;
			changed = true;
		}

		if (changed)
			this.refreshView();
	}

	onClickResizeTool() {
		this.enableResize = !this.enableResize;
		this.enableOpacity = false;
		// this._imageEditor.removeActiveObject();
		this.refreshView();
	}

	onClickOpacityTool() {
		this.enableOpacity = !this.enableOpacity;
		this.enableResize = false;
		// this._imageEditor.removeActiveObject();
		this.refreshView();
	}

	onChangeWidth(e) {
		if (!e || e == this.newWidth) return;
			this.newWidth = e;
		this._imageEditor.ui.resizeEditor({imageSize: {oldWidth: this.oldWidth, oldHeight: this.oldHeight, newWidth: this.newWidth, newHeight: this.newHeight}});
		// this._imageEditor.resizeCanvasDimension({width: this.newWidth, height: this.newHeight});
		this.refreshView();
	}

	onChangeHeight(e) {
		if (!e || e == this.newHeight) return;
			this.newHeight = e;
		this._imageEditor.ui.resizeEditor({imageSize: {oldWidth: this.oldWidth, oldHeight: this.oldHeight, newWidth: this.newWidth, newHeight: this.newHeight}});
		this.refreshView();
	}

	onApply(applied = true) {
		if (this.enableOpacity) {
			if (applied) {
				// this._els.filterTintColor.color;
				// this._imageEditor.ui.filter._els.tintOpacity.events.change[0].handler(res/100);
				this.opacity = this.opacityControl.value;
				this._imageEditor.ui.activeMenuEvent();
				this._imageEditor.applyFilter('tint', {color: "#ffffff", opacity: (100 - this.opacity) / 100});
				this._editorElementWrap.style.opacity = '1';
			} else {
				this._imageEditor.ui.activeMenuEvent();
				this._imageEditor.applyFilter('tint', {color: "#ffffff", opacity: (100 - this.opacity) / 100});
				this._editorElementWrap.style.opacity = '1';
				this.opacityControl.setValue(this.opacity);
			}
		} else if (this.enableResize) {
			if (this.oldWidth == this.newWidth && this.oldHeight == this.newHeight)
				return;
			// create an off-screen canvas
			let canvas = document.createElement('canvas'),
				ctx = canvas.getContext('2d');
			const dataURL = this._imageEditor.toDataURL();
			// set its dimension to target size
			canvas.width = this.newWidth;
			canvas.height = this.newHeight;

			const i = new Image();
			i.onload = () => {
				ctx.drawImage(i, 0, 0, this.newWidth, this.newHeight);
				this._imageEditor.loadImageFromURL(canvas.toDataURL(), 'Init Image').then((sizeValue) => {
					this._imageEditor.ui.activeMenuEvent();
					this._imageEditor.ui.resizeEditor({imageSize: sizeValue});
					this.oldWidth = sizeValue.newWidth;
					this.newWidth = sizeValue.newWidth;
					this.oldHeight = sizeValue.newHeight;
					this.newHeight = sizeValue.newHeight;
					this.applied = applied;
				}).catch( e => {
					console.log(e);
				});

				// const imageFile = this._appService.dataURLtoFile(canvas.toDataURL(), 'image_' + UUID.UUID() + '.png');
				// this._imageEditor.loadImageFromFile(imageFile, 'SampleImage').then((sizeValue) => {
				// 		this._imageEditor.ui.activeMenuEvent();
				// 		this._imageEditor.ui.resizeEditor({imageSize: sizeValue});
				//	 this.oldWidth = sizeValue.newWidth;
				//	 this.newWidth = sizeValue.newWidth;
				//	 this.oldHeight = sizeValue.newHeight;
				//	 this.newHeight = sizeValue.newHeight;
				//	 this.applied = applied;
				// 	}).catch( e => {
				// 			console.log(e);
				// 	});
			};
			i.src = dataURL;
		}
	}

  onCancel() {
	if (this.enableOpacity) {
	  this.onApply(false);
	} else if (this.enableResize) {
	  this.newWidth = this.oldWidth;
	  this.newHeight = this.oldHeight;
	  if (this.applied) {
		this.onApply(false);
	  } else {
		this._imageEditor.ui.resizeEditor({imageSize: {oldWidth: this.oldWidth, oldHeight: this.oldHeight, newWidth: this.newWidth, newHeight: this.newHeight}});
	  }
	}
	this.refreshView();
  }

	// onSave() {
	// 	this._imageEditor.ui.activeMenuEvent();
	// 			//  {oldWidth: 0, oldHeight: 0, newWidth: 1600, newHeight: 1066}

	// 			this._imageEditor.ui.resizeEditor({imageSize: {oldWidth: 1600, oldHeight: 1066, newWidth: 400, newHeight: 400}});
	// 		// this._imageEditor.resizeCanvasDimension({width: 400, height: 400});
	// 		// const dataURL = this._imageEditor.toDataURL();
	// 		// var i = new Image();
	// 	// i.onload = () => {
	// 	//   (this.resizeEle.nativeElement as HTMLElement).style.left = 5 + 'px';
	// 	//   (this.resizeEle.nativeElement as HTMLElement).style.top = 5 + 'px';
	// 	//   (this.resizeEle.nativeElement as HTMLElement).style.width = i.width + 'px';
	// 	//   (this.resizeEle.nativeElement as HTMLElement).style.height = i.height + 'px';
	// 	//   (this.resizeEle.nativeElement as HTMLElement).style.backgroundImage = `url(${dataURL})`;
	// 	// }

	// 	// i.src = dataURL;
	// }

	onImageResize(e) {
		// (this.resizeEle.nativeElement as HTMLElement).style.top = e.top + 'px';
		// (this.resizeEle.nativeElement as HTMLElement).style.width = (e.right - e.left) + 'px';
		// (this.resizeEle.nativeElement as HTMLElement).style.left = e.left + 'px';
		// (this.resizeEle.nativeElement as HTMLElement).style.height = (e.bottom - e.top) + 'px';

	}

	refreshView(loading: boolean = false) {
		this._loading = loading;
		this._changeDetectorRef.detectChanges();
	}

	ngOnDestroy() {
		this._subs.forEach(s => {
	  if (s)
		s.unsubscribe();
	});
	}
}
