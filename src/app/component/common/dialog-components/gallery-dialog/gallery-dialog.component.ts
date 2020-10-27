import {
	Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
	ViewChild, ViewChildren, ElementRef, HostListener, Input,
	QueryList, AfterViewInit, Renderer
} from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import * as Rx from 'rxjs/Rx';
import {
	cloneDeep as _cloneDeep,
	debounce as _debounce,
	get as _get,
	findIndex as _findIndex,
	take as _take
} from 'lodash';
import { Lazy, forwardObs } from '@app-lib/rx/rx';
import '@app-lib/rx/rx';
import * as differenceDeep from "@app-lib/functions/difference-deep";

import { Maybe } from '@app-lib/maybe/maybe';
import { History } from '@app-lib/history/history';
import * as imageUrl from '@app-lib/functions/image-url';

import { createLinkingDialogWindow, LinkingForm, LinkFormData, Link, LinkSource } from '@app-dialogs/linking-dialog/linking-dialog.component';
import { createImageEditorWindow } from '@app-dialogs/image-editor/image-editor.component';
import { createImageImportDialogWindow } from '@app-dialogs/image-import-dialog/image-import-dialog.component';
import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { ImagePath, GalleryInfo, GImage, CommonItemContent } from '@app/models';
import { LoadingComponent } from '@app-ui/loading/loading.component';

import { DEFAULT_ANIMATION, DEFAULT_ANIMATION_SPEED, ANIMATIONS } from '@app-shared/constants';

import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { AppService } from '@app/app.service';

/** */
export function createGalleryDialogWindow(
	windowService: WindowService,
	itemContent: CommonItemContent<GalleryInfo>
): DialogWindow<GalleryDialogComponent> {
	return windowService.create<GalleryDialogComponent>(
		GalleryDialogComponent,
		{
			width: 950,
			height: 640,
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.itemContent = itemContent;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

class State {
	constructor(
		public selectedItem: number = 0,
		public gImages: GImage[] = [],
		public rows: number = 4,
		public cols: number = 5,
		public spacing: number = 10,
		public animation: string = 'None'
	) {
	}
}

class AllGImages { }
class SelectedItem { constructor(public i: number) { } }
class SetImageNum { constructor(public i: number) { } }
class SetRows { constructor(public i: number) { } }
class SetCols { constructor(public i: number) { } }
class SetSpace { constructor(public space: number) { } }
class SetAnimation { constructor(public animation: string) { } }
class SetImage { constructor(public image: ImagePath) { } }
class SetDescrption { constructor(public desc: string) { } }
class SetLink { constructor(public link: Link) { } }
class RemoveGImage { constructor(public i: number) { } }
class Refresh { constructor(public s: State) { } }
class Undo { }
class Redo { }
class EmptyCommand { }

type Command =
	SelectedItem
	| SetRows
	| SetCols
	| SetSpace
	| SetAnimation
	| SetImage
	| SetDescrption
	| RemoveGImage
	| Undo
	| Redo

// Hotkeys
// ----------------------------------------------------------------
type ModKeys = 'ctrl';

const MOD_KEY_SELECTORS: { [k: string]: (e: MouseEvent | KeyboardEvent) => boolean } = {
	ctrl: (e: MouseEvent) => e.ctrlKey
};

const MOD_KEYS = {
	addOrRemoveFromSelection: 'ctrl'
};

interface CommandHotkey {
	key: string;
	modKeys: string[];
}

const COMMAND_HOTKEYS = {
	removeItems: [{ key: 'Delete', modKeys: [] as string[] },
	{ key: 'Del', modKeys: [] as string[] }],
	undo: [{ key: 'z', modKeys: ['ctrl'] },
	{ key: 'Z', modKeys: ['ctrl'] }],
	redo: [{ key: 'y', modKeys: ['ctrl'] },
	{ key: 'Y', modKeys: ['ctrl'] }]
};

function checkCommandHotkey(hotkeys: CommandHotkey[], event: KeyboardEvent) {
	if (hotkeys.some(hotkey =>
		hotkey.key === event.key
		&& hotkey.modKeys.every(modKey => MOD_KEY_SELECTORS[modKey](event)))
	) {
		event.preventDefault();
		return true;
	} else {
		return false;
	}
}

// ----------------------------------------------------------------
// History & state
// ----------------------------------------------------------------
class HistoryEntry<C, S> {
	constructor(
		public command: C,
		public state: S
	) { }
}

const HISTORY_LENGTH = 20;

/** Don't save these commands in history. */
const DROP_FROM_HISTORY: Command[] = [
	SelectedItem, Undo, Redo
];
// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
	moduleId: module.id,
	templateUrl: 'gallery-dialog.component.html',
	styleUrls: ['gallery-dialog.component.css']
})
export class GalleryDialogComponent implements OnInit, OnDestroy, AfterViewInit {

	@Input('itemContent') itemContent: CommonItemContent<GalleryInfo> = new CommonItemContent<GalleryInfo>(Maybe.just(GalleryInfo.empty()));
	@Output('submit') submit = new EventEmitter<CommonItemContent<GalleryInfo>>();
	@Output('close') close = new EventEmitter<void>();

	@ViewChild(LoadingComponent) loadingComponent: LoadingComponent;
	@ViewChildren('imageElems') public _imageElems: QueryList<ElementRef>;
	@ViewChild('thumbnails') public _thumbnails: ElementRef;
	@ViewChild('result') public _result: ElementRef;
	@ViewChild('description') public _descriptionEle: ElementRef;
	// ---------------------------------------------------------------

	public info: GalleryInfo = GalleryInfo.empty();

  	public _removeGImage = new Rx.Subject<number>();
	public _dragFile = new Rx.Subject<ImagePath>();
	public _setLink = new Rx.Subject<Link>();
	public _selectItem = new Rx.Subject<number>();
	public _setDescription = new Rx.Subject<string>();

	// public _openImageEditor	= new Rx.Subject<void>();
	// public _openImportDialog   = new Rx.Subject<void>();

	private _allowView = false;

	// ---------------------------------------------------------------
	public _animations = ANIMATIONS;
	public _minImages = 1;
	public _maxImages = 100;
  	public _minSpace = 0;
	public _maxSpace = 100;
  	public _minRows = 1;
	public _maxRows = 100;
	public _minCols = 1;
	public _maxCols = 100;

	public _images = new FormControl(8);
	public _space = new FormControl(10);
	public _rows = new FormControl(2);
	public _cols = new FormControl(4);
	public _description = new FormControl('');
	public _animationType  = new FormControl(DEFAULT_ANIMATION);

	// ---------------------------------------------------------------
	public b_images: GImage[] = [];
	public b_selectedItem: number = 0;
	public _loading: boolean = false;
	public _loadingText: string = 'Uploading...';
	public _themes: GImage[] = [];

	public _undo = new Rx.Subject<void>();
	public _redo = new Rx.Subject<void>();
	public _keyboardEvent = new Rx.Subject<KeyboardEvent>();

	textEditorEnabled = false;
	public _refreshHistory = new Rx.Subject<State>();
	private history: Lazy<Rx.Observable<History<HistoryEntry<Command, State>>>>;
	private _newHistoryEntry: Rx.Observable<HistoryEntry<AllGImages, State>>;

	// private _imageEditor   : DialogWindow<ImageEditorComponent>;
	// private _importDialog  : DialogWindow<ImageImportDialogComponent>;

	private originInfo: GalleryInfo;
	private currentState: State = new State();
	private callingAPI: Rx.Subscription;
	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private elementRef: ElementRef,
		private windowService: WindowService,
		private appService: AppService,
		private sanitizer: DomSanitizer,
		private renderer: Renderer
	) { }

	getValue(n: number): number { return Math.round(n); }

	ngOnInit() {
		this.info = this.itemContent.info.value;
		this.originInfo = _cloneDeep(this.info);

		this._images.setValue(this.info.gImages.length, {emitEvent: false});
		this._space.setValue(this.info.spac,{emitEvent: false});
		this._rows.setValue(this.info.rows,{emitEvent: false});
		this._cols.setValue(this.info.cols,{emitEvent: false});
		this._animationType.setValue(this.info.animationType, {emitEvent: false});

		if (this.info.gImages && this.info.gImages[0]) {
			this._description.setValue(this.info.gImages[0].desc, {emitEvent: false});
			(this._descriptionEle.nativeElement as HTMLElement).innerHTML = this.info.gImages[0].desc;
		}

		this.b_images = this.info.gImages;
		this.currentState = new State(0, this.info.gImages, this.info.rows,this.info.cols,this.info.spac,this.info.animationType);

		const initialHistoryEntry = new HistoryEntry<Command, State>(new EmptyCommand(), this.currentState);
		const initialHistory = new History(initialHistoryEntry, [], [], HISTORY_LENGTH);
		const undo = this._undo
			.merge(this._keyboardEvent
				.filter(e => checkCommandHotkey(COMMAND_HOTKEYS.undo, e)))
			.map(() => new Undo)
			.publish().refCount();

		const redo = this._redo
			.merge(this._keyboardEvent
				.filter(e => checkCommandHotkey(COMMAND_HOTKEYS.redo, e)))
			.map(() => new Redo)
			.publish().refCount();

		// const removeImage = Rx.Observable
		// 	.merge(
		// 	this._keyboardEvent
		// 		.filter(e => checkCommandHotkey(COMMAND_HOTKEYS.removeItems, e))
		// 		.map(_e => new RemoveGImage(state.selectedItem)),
		// 	this._removeGImage.map(i => new RemoveGImage(i)))
		// 	.publish().refCount();

		const stateCommands = Rx.Observable.merge(
			this._selectItem.map(n => new SelectedItem(n)),
			this._dragFile.map(url => new SetImage(url)),
			this._images.valueChanges.map(n => Math.round(n) != this.currentState.gImages.length ? Math.round(n) > 0 ? new SetImageNum(Math.round(n)) : null : null),
			this._space.valueChanges.map(n => Math.round(n) != this.currentState.spacing ? Math.round(n) >= 0 ? new SetSpace(Math.round(n)) : null : null),
			this._rows.valueChanges.map(n => Math.round(n) != this.currentState.rows ? Math.round(n) > 0 ? new SetRows(Math.round(n)) : null : null),
			this._cols.valueChanges.map(n => Math.round(n )!= this.currentState.cols ? Math.round(n) > 0 ? new SetCols(Math.round(n)) : null : null),
			this._animationType.valueChanges.map(v => new SetAnimation(v)),
			this._setDescription.map(desc => new SetDescrption(desc)),
			this._setLink.map(link => new SetLink(link))
		).filter(r => !!r).publish().refCount();

		this.history = new Lazy(() =>
			this._newHistoryEntry
				.merge(undo)
				.merge(redo)
				.scan<any, History<HistoryEntry<Command, State>>>((history, x) =>
					x instanceof HistoryEntry
						? DROP_FROM_HISTORY.some(c => x.command instanceof <any>c)
							? history.modifyCurrentState(
								new HistoryEntry(history.current.command, x.state))
							: history.push(x)
						: x instanceof Undo
							? history.undo()
							: history.redo(),
				initialHistory));

		this._newHistoryEntry = stateCommands
			.map(command =>
				new HistoryEntry(
					command,
					this.updateState(this.currentState, command)))
			.publish().refCount();

		const state = this.history.value.map(h => {
			return h.current.state;
		});

		this.subs = [
			this.history.value.subscribe(res => {
				this.currentState = res.current.state;
			}),
			this._description.valueChanges.subscribe(res => {
				this.currentState.gImages[this.currentState.selectedItem].desc = res;
				this.refreshView();
			}),
			state.subscribe(s => {
				this.b_selectedItem = s.selectedItem;
				this._rows.setValue(s.rows,{emitEvent: false,emitModelToViewChange: true});
				this._cols.setValue(s.cols,{emitEvent: false,emitModelToViewChange: true});
				this._images.setValue(s.gImages.length, {emitEvent: false}),
				this._space.setValue(s.spacing,{emitEvent: false});
				this.b_images = s.gImages;
				this.setThumbsStyle();
				this.refreshView();
			})
		];
	}

	ngAfterViewInit() {
		this._allowView = true;
		this.setThumbsStyle();
		setTimeout(() => {
			this.textEditorEnabled = true;
			(this._descriptionEle.nativeElement as HTMLElement).focus();
		},500);
	}

	updateState(state: State, command: Command): State {
		let newState = new State(state.selectedItem, state.gImages, state.rows, state.cols, state.spacing, state.animation);
		const updateGImages = (gimage: GImage, updater: (gimage: GImage) => GImage) => {
			const newGImage = updater(gimage);
			newState.gImages = newState.gImages.map(i => i !== gimage ? i : newGImage);
		};

		if (command instanceof SetImageNum) {
			const num = this.getValue(command.i);

			if (newState.gImages.length > num) {
				newState.gImages = _take(newState.gImages, num);
			}
			else if (newState.gImages.length < num) {
				let oldNum = newState.gImages.length;
				for(let i=0; i<(num - oldNum); i++)
					newState.gImages.push(GImage.empty());
			}

			if (num > newState.rows * newState.cols) {
				newState.cols = Math.ceil(num/newState.rows);
			}

			// if (num < newState.rows && num >= newState.cols) {
			// 	newState.rows = Math.ceil(num/newState.cols);
			// }
			// else if (num < newState.cols && num >= newState.rows) {
			// 	newState.cols = Math.ceil(num/newState.rows);
			// }
			// else {
			// 	newState.rows = Math.ceil(Math.sqrt(num));
			// 	newState.cols = Math.ceil(num/newState.rows);
			// }
		} else if (command instanceof SetSpace) {
			newState.spacing = command.space;
		} else if (command instanceof SetImage) {
			updateGImages(newState.gImages[newState.selectedItem], gimage=>gimage.setImage(command.image));
		} else if (command instanceof SetDescrption) {
			updateGImages(newState.gImages[newState.selectedItem], gimage=>gimage.setDesc(command.desc));
		} else if (command instanceof SetLink) {
			updateGImages(newState.gImages[newState.selectedItem], gimage=>gimage.setLink(command.link));
		} else if (command instanceof RemoveGImage) {
			updateGImages(newState.gImages[command.i], gimage=>gimage.setImage(undefined).setDesc(''));
		} else if (command instanceof SetRows) {
			newState.rows = command.i;
			newState.cols = Math.ceil(newState.gImages.length/command.i);
		} else if (command instanceof SetCols) {
			newState.cols = command.i;
			newState.rows = Math.ceil(newState.gImages.length/command.i);
		} else if (command instanceof SetAnimation) {
			newState.animation = command.animation;
		} else if (command instanceof SelectedItem) {
			newState.selectedItem = command.i;
			this._description.setValue(this.b_images[command.i].desc, {emitEvent: false});
			(this._descriptionEle.nativeElement as HTMLElement).innerHTML = this.b_images[command.i].desc;
			setTimeout(() => {
				(this._descriptionEle.nativeElement as HTMLElement).focus();
				this.textEditorEnabled = true;
				this.refreshView();
			}, 100);
		}
		return newState;
	}

	isActive(tool: string) {
		switch (tool) {
			case 'Change':
				if (this.originInfo.cols !== this._cols.value || this.originInfo.rows !== this._rows.value || this.originInfo.spac !== this._space.value || this.originInfo.animationType !== this._animationType.value)
					return true;
				if (!differenceDeep.isDifference(this.originInfo.gImages, this.b_images))
					return false;
				return _findIndex(this.b_images, i => i.image !== undefined) >= 0 ? true : false;
			case 'Link':
				if (this.b_images[this.b_selectedItem] && this.b_images[this.b_selectedItem].link)
					return true;
				else
					return false;
		}
	}

	onUndo(event: MouseEvent) {
		event.stopPropagation();
		this._undo.next();
	}

	onRedo(event: MouseEvent) {
		event.stopPropagation();
		this._redo.next();
	}

	openFeedbackDialog() {
		let feedbackWindow: DialogWindow<FeedbackDialogComponent>;
		feedbackWindow = createFeedbackDialogWindow(this.windowService, 'ca.g.111');
		feedbackWindow.open();
	}

	getImageURL(gimage: GImage): SafeStyle {
		if (gimage.image)
			return this.sanitizer.bypassSecurityTrustStyle(`url('${gimage.image.location + '/' + gimage.image.name}')`);
		return '';
	}

	selectTheme(event: GalleryInfo) {
		this._refreshHistory.next(new State(-1,event.gImages,event.rows,event.cols,event.spac,event.animationType));
		//this._newHistoryEntry = this._refreshHistory.map(() =>new HistoryEntry<AllGImages, State>(new AllGImages(), new State())).publish().refCount();
	}

	setThumbsStyle() {
		let extraHeight: number = 0;
		$(this._thumbnails.nativeElement).css('width', (100 + 2 * this.getValue(this._space.value)) * this.getValue(this._cols.value) + 20 + 'px');
		if (this.getValue(this._space.value) < 10)
			extraHeight = 10;
		$(this._thumbnails.nativeElement).css('height', (60 + extraHeight + 2 * this.getValue(this._space.value)) * this.getValue(this._rows.value) + 20 + 'px');
	}

	openImageImportDialog() {
		let importDialog = createImageImportDialogWindow( this.windowService);
		importDialog.componentRef.instance.submit.subscribe(res => {
			this._dragFile.next(res);
			importDialog.destroy();
		});

		importDialog.componentRef.instance.close.subscribe(() => {
			importDialog.destroy();
		});

		importDialog.open();
	}

	openImageEditorDialog() {
		const imageEditorDialog = createImageEditorWindow(this.windowService);

		if (this.b_images[this.b_selectedItem]) {
			imageEditorDialog.componentRef.instance.openImageInEditor(this.b_images[this.b_selectedItem].image);
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

	openLinkingDialog(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();

		const img = this.b_images[this.b_selectedItem].image;
		let linkFormData: LinkFormData = new LinkFormData();
		let linkForm = new LinkingForm();
		let linkDialog = createLinkingDialogWindow(this.windowService, linkForm);

		if (img)
			linkDialog.changeInputs(c => {
				c.form.setLinkValue(
					new LinkFormData(
						new LinkSource('LinkSourceImage', img.location + '/' + img.name),
						this.b_images[this.b_selectedItem].link
					)
				);
			});
		else
			linkForm.setValue(
				new LinkFormData(
					undefined,
					this.b_images[this.b_selectedItem].link
				)
			);


		linkDialog.componentRef.instance.submit.subscribe(result => {
			this._setLink.next(result);
			linkDialog.destroy();
		});
		linkDialog.componentRef.instance.close.subscribe(result => {
			linkDialog.destroy();
		});
		linkDialog.open();
	}

	onRemoveImage() {
		this.b_images[this.b_selectedItem]=new GImage;
		this.changeDetector.detectChanges();
	}

	backgroundImage(image: ImagePath): SafeStyle {
		if (image && image['createdate']) {
			delete image['createdate'];
		}
		return image ? this.sanitizer.bypassSecurityTrustStyle(imageUrl.imageUrl(image)) : '';
	}

	playAnimate() {
		let ele = this._result.nativeElement as HTMLElement;
		let speed = 0.5;
		// if (speed == 1)
		//	 speed = 0.001;
		// else if (speed>0)
		//	 speed = 1 - speed;

		this.renderer.setElementStyle(ele, 'animation-duration', '' + speed + 's');

		$(ele).addClass('animated ' + this._animationType.value).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', () => {
			$(ele).removeClass('animated ' + this._animationType.value);
		});
	}

	playAnimateThumb(event: MouseEvent) {
		let ele = event.srcElement;
		let speed = 0.5;
		this.renderer.setElementStyle(ele, 'animation-duration', '' + speed + 's');
		$(ele).addClass('animated ' + this._animationType.value).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', () => {
			$(ele).removeClass('animated ' + this._animationType.value);
		});
		this.changeDetector.detectChanges();
	}

	onDragStart(event: any) {
		//console.log(event);
	}

	onDragEnd(event: any) {
		//console.log(event);
	}

	onClose(event: MouseEvent) {
		this.close.emit();
	}

	onSubmit(event: MouseEvent) {
		if (!this.isActive('Change')) return;
		event.stopPropagation();

		const originalImages = this.info.gImages.filter(image => image.image);
		const originalSpace = this.info.spac;

		let images = this.b_images;
		let rows = this.getValue(this._rows.value);
		let cols = this.getValue(this._cols.value);
		images = images.filter(image => image.image);

		if (images.length >= cols) {
			rows = Math.ceil(images.length / cols);
		} else {
			cols = images.length;
			rows = 1;
		}

		this._images.setValue(images.length, {emitEvent: false});
		this._cols.setValue(cols, {emitEvent: false});
		this._rows.setValue(rows, {emitEvent: false});
		this.b_images = images;

		this.setThumbsStyle();
		this.refreshView();

		setTimeout(() => {
			let info = new GalleryInfo(images, rows, cols, this.getValue(this._space.value), '', 0.5, this._animationType.value, this.info.hover);
			let width = originalImages.length > 0 ? (this.itemContent.box.width() / this.info.cols - this.info.spac * 2) * cols + cols * 2 * this.getValue(this._space.value) : (this._thumbnails.nativeElement as HTMLElement).offsetWidth;
			let height = originalImages.length > 0 ? (this.itemContent.box.height() / this.info.rows - this.info.spac * 2) * rows + rows * 2 * this.getValue(this._space.value) : (this._thumbnails.nativeElement as HTMLElement).offsetHeight;

			this.submit.emit(
				this.itemContent.setInfo(new Maybe(info))
					.setBox(
						this.itemContent.box
							.setBottom(this.itemContent.box.top + height)
							.setRight(this.itemContent.box.left + width)
						)
					);
		});
	}

	onCancelled() {
		if (!this.callingAPI) return;
		this.callingAPI.unsubscribe();
		this.refreshView();
	}

	uploadeImages(files: File[]) {
		this.refreshView(true);
		this.callingAPI = this.appService.uploadImages(files).subscribe(
			event => {
				switch (event.type) {
					case HttpEventType.Sent:
						// console.log(`Uploading file "${index}" of size ${f.size}.`);
						break;
					case HttpEventType.UploadProgress:
						if (this.loadingComponent)
							this.loadingComponent.set(Math.min(event.loaded/event.total * 100, 98));
						break;
					case HttpEventType.Response:
						if (this.loadingComponent)
							this.loadingComponent.complete();
						const img = _get(event, ['body', 'urls', 0]);
						if (img) {
							this._dragFile.next(img as ImagePath);
						}
						break;
				}
			},
			error => {
				console.log(error);
				this.refreshView();
				// this.alertService.playToast('Failed', `There is an error while uploading ${f.name}. Try again`, 1);
			},
			() => {
				this.refreshView();
			}
		);
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
		if (files.length > 0 && files[0].type.indexOf('image')>=0) {
			this.uploadeImages([files[0]]);
		}
	}

	onTextEditorClick(event: MouseEvent): void {
		event.stopPropagation();
		event.preventDefault();
		if (!this.textEditorEnabled) {
			this.textEditorEnabled = true;
		}
		this.refreshView();
	}

	onEditorInput(event: string) {
		if (event == '')
			return;
		this._description.setValue(event);
		_debounce(() => {
				this.currentState.gImages[this.currentState.selectedItem].desc = this._description.value;
				this._setDescription.next(this._description.value);
			}, 300);
	}
	
	onEditorInputCommand(e: {command: string, content: string}) {
		this.onEditorInput(e.content);
	}

	refreshView(loading: boolean = false, text: string = 'Saving...') {
		this._loading = loading;
		this._loadingText = text;
		this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}

	@HostListener('dragover', ['$event']) onEleDragOver(e) {
		e.preventDefault();
	}

	@HostListener('drop', ['$event']) onEleDrop(e) {
		e.preventDefault();
	}
}

