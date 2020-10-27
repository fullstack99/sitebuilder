import { Component, ViewChild, AfterViewInit, HostListener, ElementRef, Input,
		 OnChanges, SimpleChanges, OnInit, ChangeDetectorRef, Output, EventEmitter,
		 OnDestroy
	   } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { Store } from "@ngrx/store";
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { elementRectPage } from '@app-lib/dom/dom';
import * as imageUrl from '@app-lib/functions/image-url';

import { AttentionInfo, ImagePath, FolderPath, Tree, WSDetail } from '@app/models';
import { createAttentionDialogWindow } from '@app-dialogs/attention-dialog/attention-dialog.component';
import { createImageImportDialogWindow } from '@app-dialogs/image-editor/import-dialog/image-import-dialog.component';
import { LoadingComponent } from '@app-ui/loading/loading.component';
import { WindowService } from '@app-common/window/window.service';
import { AppService } from '@app/app.service';
import { AlertService, ImageService, TreeService } from '@app/services';


const imageTypes = ['bmp', 'jpg', 'png', 'gif', 'tiff'];
const videoTypes = ['mp4', 'mov', 'wmv', 'wma', 'flv', 'ogg', 'oga', 'ogv', 'ogx', '3gp', '3gp2', '3gpp', '3gpp2', 'webm'];
@Component({
	moduleId: module.id,
	selector: 'image-browser',
	templateUrl: 'image-browser.component.html',
	styleUrls: ['image-browser.component.css']
})
export class ImageBrowserComponent implements OnInit, OnChanges, OnDestroy {

	@Input() editable = true;
	@Input() tab: WSDetail = null;
	@Input() tree: Tree<FolderPath> = null;
	@Input() enableFolderPlace = false;

	@Output('placeOnPage') placeOnPage = new EventEmitter<ImagePath>();
	@Output('placeFolderOnPage') placeFolderOnPage = new EventEmitter<string>();
	@Output('openInEditor') openInEditor = new EventEmitter<ImagePath>();
	@Output('openInClipper') openInClipper = new EventEmitter<ImagePath>();
	@Output('close') close = new EventEmitter<void>();

	@ViewChild(LoadingComponent) loadingComponent: LoadingComponent;
	@ViewChild('newFolderNameCtrl') public _newFolderNameCtrl: ElementRef;
	@ViewChild('imagesContainer') public _imagesContainer: ElementRef;

	// ------------------------------------------------------------------------
	public _startNewFolder		= new Rx.Subject<void>();
	public _submitNewFolder	   = new Rx.Subject<void>();
	public _cancelNewFolder	   = new Rx.Subject<void>();
	public _fileSelected		  = new Rx.Subject<File>();
	public _filesSelected		 = new Rx.Subject<File[]>();

	public _imagesContainerScroll = new Rx.Subject<void>();

	// ------------------------------------------------------------------------
	public selectedTree		   : Tree<FolderPath> = null;
	public images				 : ImagePath[] = [];
	public newFolderControlVisible: boolean = false;
	public uploadedImages		= new Rx.Subject<ImagePath[]>();

	// ------------------------------------------------------------------------
	public _showFolder = (f: FolderPath) => f.name;

	public _newFolderName = new FormControl('');
	public _files		 = new FormControl(null);
	public _loading = false;
	public _loadingText = 'Loading...';

	// ----------------------------------
	public textControl: FormControl = new FormControl('');
	public _edit = false;

	// ------------------------------------------------------------------------
	public selectedItemIndex = -1;
	public selectedFileName: string = '';
	private view_active: Boolean = true;
	private dragEle: HTMLElement;

	public systemUser: boolean = false;
	private callingAPI: Rx.Subscription;

	private time = new Date().getTime();
	private subs: Rx.Subscription[] = [];

	get imageNavigatorHeight(): number {
		return document.body.clientHeight
			- elementRectPage(this.imageNavigator.nativeElement).top;
	}

	@ViewChild('imageNavigator') imageNavigator: ElementRef;

	constructor(
		private imageService: ImageService,
		private changeDetector: ChangeDetectorRef,
		private sanitizer: DomSanitizer,
		private treeService: TreeService,
		private appService: AppService,
		private alertService: AlertService,
		private windowService: WindowService
	) {}

	ngOnInit() {
		this.view_active = true;
		this.systemUser = (this.appService._currentSite && this.appService._currentSite.roleId > 1);
		const moreImages = this._imagesContainerScroll.map(() => {
				const el = this._imagesContainer.nativeElement as HTMLElement;
				return el.scrollHeight - el.offsetHeight - el.scrollTop;
			})
			.filter(scrollBottom => scrollBottom === 0)
			.map(() =>
				this.getImages(this.tab, this.selectedTree, Math.ceil(this.images.length / 10) * 9, 9))
			.switch().publish().refCount();

		this.subs = [
			this.treeService._deleteTree.subscribe(res => {
				if (res[0].value && res[0].value.name)
					this.removeFolder(res[0], res[1]);
			}),

			this.treeService._selectedTree.subscribe(res => {
				if (res && res.value && res.value.name) {
					this.selectedTree = res;
					this.treeService._currentTrees[this.tab.name] = res;
					this.getInitImages();
				}
			}),

			this.treeService._addTree.subscribe(res => {
				if (res[0].value && res[0].value.name)
					this.addFolder(res[0], res[1]);
			}),

			this.treeService._dropTree.subscribe(res => {
				if (res[0].value && res[0].value.name)
					this.updateFolder(res[0], res[1]);
			}),

			this.treeService._changeSequence.subscribe(res => {
				if (res[0].value && res[0].value.name)
					this.changeOrder(res[0], res[1], res[2]);
			}),

			this.treeService._renameTree.subscribe(res => {
				if (res[0].value && res[0].value.name)
					this.renameFolder(res[0], res[1]);
			}),

			moreImages.subscribe(r => {
				this.images = [...this.images, ...r];
				this.refreshView();
			}),

			this.uploadedImages.subscribe(r => {
				this.images = [...r, ...this.images];
				this.refreshView();
			}),

			Rx.Observable.merge(
				this._startNewFolder.map(() => true),
				this._cancelNewFolder.map(() => {
					this._newFolderName.setValue('');
					return false;
				})).subscribe(r=> {
					this.newFolderControlVisible = r;
					this.refreshView();
				}),

			this._startNewFolder.subscribe(() =>
				(this._newFolderNameCtrl.nativeElement as HTMLInputElement).focus()),

			this._filesSelected.subscribe(files => {
				this.refreshView(true, 'Uploading...');
				let path = '';
				if (this.selectedTree) {
					if (this.selectedTree.value.name == this.tab.name)
						path = '';
					else if (this.selectedTree.value.path == '')
						path = this.selectedTree.value.name;
					else
						path = this.selectedTree.value.path + '/' + this.selectedTree.value.name;
				}

				this.callingAPI = this.imageService.uploadImages(this.tab.id, path, files).subscribe(
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
								const tuid = lodash.get(event, 'body.tuid');
								const urls = lodash.get(event, 'body.urls');

								if (tuid) {
								  	localStorage.setItem('tuid', lodash.get(event, 'body.tuid'));
								}
								if (urls) {
								  	this.uploadedImages.next(urls);
								}
								break;
							// default:
							//	 console.log(`File "${index}" surprising upload event: ${event.type}.`);
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
			})
		];
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['tree'] && changes['tree'].currentValue) {
			this.selectedTree = this.treeService._currentTrees[this.tab.name];
			if (!this.selectedTree)
				this.treeService._selectedTree.next(this.tree);
			else
				this.getInitImages();
		}
	}

	isImage(img) {
		const extension = imageUrl.getFileExtension(img.name);
		return imageTypes.indexOf(extension) >= 0;
	}

	getInitImages() {
		if (!this.selectedTree) {
			this.images = [];
			this.refreshView();
		} else {
			this.callingAPI = this.getImages(this.tab, this.selectedTree, 0, 9).subscribe(
				res => {
					this.images = res;
				},
				error => {this.images = []; this.refreshView();},
				() => { this.refreshView(); }
			);
		}
	}

	getImages(tab: WSDetail, tree: Tree<FolderPath>, skip?: number, take?: number): Rx.Observable<ImagePath[]> {
		this.refreshView(true, 'Loading...');

		if (tab.id == 0) { // my images
			let path = '';
			if (this.selectedTree) {
				if (this.selectedTree.value.name == this.tab.name)
					path = '';
				else if (this.selectedTree.value.path == '')
					path = this.selectedTree.value.name;
				else
					path = this.selectedTree.value.path + '/' + this.selectedTree.value.name;
			}

			return this.imageService.getFolderImages(tab.id, path, skip, take);
		} else if (tab.id == 2) { // stock images
			return this.imageService.getImages('stock-clipart/' + tree.value.path, skip, 9);
		} else {
			return this.imageService.getImages('stock-photos' + tree.value.path, skip, 9);
		}
	}

	onTextEdit(event: MouseEvent, image: ImagePath) {
		event.preventDefault();
		event.stopPropagation();
		this.selectedFileName = image.name.split('.')[0];
		this.textControl.setValue(this.selectedFileName)
		this._edit = true;
		this.refreshView();
	}

	onTextSubmit( event: KeyboardEvent ) {
		if (event.keyCode === 13) {
			this._edit = false;
			this.renameImage();
			this.refreshView();
		}
	}

	onTextSubmitBlur(event: Event) {
		this._edit = false;
		if (this.textControl.value != this.selectedFileName) {
			this.renameImage();
		}
		this.refreshView();
	}

	renameImage() {
		const extension = imageUrl.getFileExtension(this.images[this.selectedItemIndex].name);
		let name = this.textControl.value.trim();
		if (name.length == 0) { return; }
		name = name + '.' + extension;
		let path = this.selectedTree ? this.selectedTree.value.path != '' ? this.selectedTree.value.path + '/' + this.selectedTree.value.name : this.selectedTree.value.name : '';
		this.callingAPI = this.imageService.renameImage('', this.images[this.selectedItemIndex].location, this.images[this.selectedItemIndex].name, path, this.images[this.selectedItemIndex].name, name).subscribe(
			res => {
				if (res) {
					this.images[this.selectedItemIndex].name = name;
					this.alertService.playToast('Success', 'Image updated successfully.', 0);
				} else {
					this.alertService.playToast('Failed', 'Image is not updated.', 1);
				}
			},
			error => { this.alertService.playToast('Failed', 'Image is not updated.', 1); this.refreshView();},
			() => { this.refreshView(); }
		);
	}

	onMore(event: MouseEvent) {
		event.stopPropagation();
		this._startNewFolder.next();
	}

	onKeydown(event: KeyboardEvent) {
		if (event.keyCode == 13)
			this.onAddFolder();
	}

	onAddFolder(event: MouseEvent = null) {
		if (event)
			event.stopPropagation();
		const parent = this.selectedTree;
		const name = this._newFolderName.value;
		this.addFolder(parent, name);
	}

	onCancelFolder(event: MouseEvent) {
		event.stopPropagation();
		this._cancelNewFolder.next();
	}

	isExitFolder(parent: Tree<FolderPath>, name: string) {
		if (!parent) return false;
		if (lodash.findIndex(parent.children,((tree: Tree<FolderPath>) =>tree.value.name.trim() == name.trim()))>=0) {
			this.alertService.playToast('Failed', 'The Folder Name existed already.', 1);
			return true;
		}
		return false;
	}

	addFolder(parent: Tree<FolderPath>, name: string) {
		name = name.trim();
		if (name.length == 0 || this.isExitFolder(parent, name)) { return; }
		//let path : string = ((!parent || this.tab.name == parent.value.name) ? '' : parent.value.path == '' ? parent.value.name : parent.value.path + '/' + parent.value.name);
		let path: string = '';
		this.callingAPI = this.imageService.addFolder(this.tab.id, path, name).subscribe(
			(res: any) => {
				const newTree = new Tree('imageFolder', {name: name, path:''},[]);

				this.alertService.playToast('Success', 'Folder added successfully.', 0);

				// if (parent) {
				//	 newTree.value.path = path;
				//	 parent.children = parent.children.concat(newTree);
				// }
				// else {
				//	 newTree.value.path = '';
				//	 this.tree.children = this.tree.children.concat(newTree);
				// }
				newTree.value.path = '';
				this.tree.children = this.tree.children.concat(newTree);
				this._newFolderName.setValue('');
				this.refreshView();
			},
			error => {
				this.alertService.playToast('Failed', 'Folder is not added.', 1);
				this.refreshView();
			},
			() => { }
		);
	}

	renameFolder(tree: Tree<FolderPath>, name: string) {
		name = name.trim();
		if (name.length == 0) { return; }
		this.callingAPI = this.imageService.renameFolder(tree.value.path, '', name, tree.value.name).subscribe(
			res => {
				tree.value.name = name;
				this.alertService.playToast('Success', 'Folder updated successfully.', 0);
			},
			error => { this.alertService.playToast('Failed', 'Folder is not updated.', 1); this.refreshView(); },
			() => { this.refreshView(); }
		);
	}

	updateFolder(parent: Tree<FolderPath>, tree: Tree<FolderPath>) {
		if (parent == tree) return;

		let dest = '';
		if (parent.value.name == this.tab.name)
			dest = '';
		else if (parent.value.path == '')
			dest = parent.value.name;
		else
			dest = parent.value.path + '/' + parent.value.name;

		if (tree.value.path == dest) return;

		this.callingAPI = this.imageService.updateFolder('', tree.value.path, tree.value.name, dest).subscribe(
			res => {
				if (this.treeService._parentItem)
					this.treeService._parentItem.children = this.treeService._parentItem.children.filter(child=>child.value!=tree.value);
				tree.value.path = dest;
				this.changePath(tree);
				parent.children.push(tree);
				this.treeService._selectedTree.next(tree);
				this.alertService.playToast('Success', 'Folder updated successfully.', 0);
			},
			error => { this.alertService.playToast('Failed', 'Folder is not updated.', 1); this.refreshView(); },
			() => { this.refreshView(); }
		);
	}

	changePath(tree: Tree<FolderPath>) {
		tree.children.forEach(t=> {
			t.value.path = tree.value.path + (tree.value.path != '' ? '/' : '') + tree.value.name;
			if (t.children.length > 0)
				this.changePath(t);
		})
	}

	changeOrder(parent: Tree<FolderPath>, tree: Tree<FolderPath>, order: number) {

		if (this.treeService._parentItem == parent) {
			this.callChangeOrder(parent, tree, order);
		}
		else {
			let dest = '';
			if (parent.value.name == this.tab.name)
				dest = ''
			else if (parent.value.path == '')
				dest = parent.value.name;
			else
				dest = parent.value.path + '/' + parent.value.name;

			this.callingAPI = this.imageService.updateFolder('', tree.value.path, tree.value.name, dest).subscribe(
				res => {
					if (this.treeService._parentItem)
						this.treeService._parentItem.children = this.treeService._parentItem.children.filter(child=>child.value!=tree.value);
					tree.value.path = dest;
					this.callChangeOrder(parent, tree, order);
				},
				error => { this.alertService.playToast('Failed', 'Folder is not updated.', 1); this.refreshView();},
				() => { this.refreshView(); }
			);
		}
	}

	callChangeOrder(parent: Tree<FolderPath>, tree: Tree<FolderPath>, order: number, num: number = 0) {
		this.callingAPI = this.imageService.updateFolderSequence(this.tab.id, tree.value.path, tree.value.name, '', order + 1).subscribe(
			res => {
				if (res) {
					parent.children = parent.children.filter(child=>child.value!=tree.value);
					parent.children.splice(order, num, tree);
					if (this.treeService._currentTrees[this.tab.name] != tree)
						this.treeService._selectedTree.next(tree);
					this.alertService.playToast('Success', 'Folder updated successfully.', 0);
				}
				else {
					this.alertService.playToast('Failed', 'Folder is not updated.', 1);
				}
			},
			error => { this.alertService.playToast('Failed', 'Folder is not updated.', 1); this.refreshView();},
			() => { this.refreshView(); }
		);
	}

	removeFolder(parent: Tree<FolderPath>, tree: Tree<FolderPath>) {
		const attentionWindow = createAttentionDialogWindow(
			this.windowService,
			new AttentionInfo(
				{ value: 'Delete Folder & Images', font_size: '22px', color: '#8c8c8c' },
				[
					{ value: 'To keep Images drag & drop', font_size: '16px', color: '#8c8c8c' },
					{ value: 'to another Folder.', font_size: '16px', color: '#8c8c8c' },
				],
				true,
				['DELETE'],
				''
			));

		attentionWindow.componentRef.instance.submit.subscribe((feedback) => {
			if (feedback) {
				this.callingAPI = this.imageService.removeFolder(this.tab.id, tree.value.path, tree.value.name).subscribe(
					(res: any) => {
						if (res) {
							this.alertService.playToast('Success', 'Folder deleted successfully.', 0);
							if (this.treeService._currentTrees[this.tab.name] == tree) {
								this.treeService._selectedTree.next(null);
								this.images = [];
							}
							parent.children = parent.children.filter(t => t !== tree);
						} else {
							this.alertService.playToast('Failed', 'Folder is not deleted.', 1);
						}
						this.refreshView();
					},
					error => { this.alertService.playToast('Failed', 'Folder is not deleted.', 1); this.refreshView();},
					() => {}
				);
			}
			attentionWindow.destroy();
		});
		attentionWindow.open();
	}

	onSelectItem(i: number, event: MouseEvent) {
		if (this.selectedItemIndex == i )
			this.selectedItemIndex = -1;
		else
			this.selectedItemIndex = i;
		this.changeDetector.detectChanges();
	}

	onRemoveItem(img: ImagePath, index: number, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		const path = this.selectedTree ? (this.selectedTree.value.path != '' ? this.selectedTree.value.path + '/' + this.selectedTree.value.name : this.selectedTree.value.name == this.tab.name ? '' : this.selectedTree.value.name) : '';
		this.callingAPI = this.imageService.removeFolderImage(this.tab.id, path, img.name).subscribe(
			res => {
				if (res.body == true) {
					this.images.splice(index, 1);
					this.changeDetector.detectChanges();
				}
			},
			error => {this.changeDetector.detectChanges();},
			() => {}
		);
	}

	onPlaceOnPage(img: ImagePath) {
		this.placeOnPage.emit(img);
	}

	onPlaceFolderOnPage() {
		if (!this.selectedTree || !this.selectedTree.value)
			return;

		let path = '';
		if (this.selectedTree) {
			if (this.selectedTree.value.name === this.tab.name)
				path = '';
			else if (this.selectedTree.value.path === '')
				path = this.selectedTree.value.name;
			else
				path = this.selectedTree.value.path + '/' + this.selectedTree.value.name;
		}

		this.placeFolderOnPage.emit(path);
	}

	onOpenInEditor(img: ImagePath) {
		this.openInEditor.emit(img);
	}

	onOpenInClipper(img: ImagePath) {
		this.openInClipper.emit(img);
	}

	openImportDialog() {
		const imageImportDialog = createImageImportDialogWindow(this.windowService);
		imageImportDialog.componentRef.instance.filelistsubmit.subscribe(e => {
			imageImportDialog.destroy();
			this._filesSelected.next(e);
		});
		imageImportDialog.componentRef.instance.filesubmit.subscribe(e => {
			imageImportDialog.destroy();
			this._fileSelected.next(e);
		});
		imageImportDialog.componentRef.instance.close.subscribe(e => {
			imageImportDialog.destroy();
		});
		imageImportDialog.open();
	}

	exportFile() {
		if (this.selectedItemIndex < 0) return;
		if (!this.images) return;
		this.appService.downloadFile(this.images[this.selectedItemIndex].location + '/' + this.images[this.selectedItemIndex].name,this.images[this.selectedItemIndex].name);
	}

	backgroundImage(img: ImagePath, isImg: boolean = true) {
		const url = isImg ? imageUrl.imageUrl(img) : imageUrl.imageSrcUrl(img);
		if (url) {
			return isImg ? this.sanitizer.bypassSecurityTrustStyle(url) : url;
		} else {
			return '';
		}
	}

	onBackClick() {
		this.close.emit();
	}

	onClickContainer(event: MouseEvent) {
		if (this.newFolderControlVisible) {
			this._cancelNewFolder.next();
		}
	}

	onDragOver(e) {
		e.preventDefault();
		this._imagesContainer.nativeElement.style.opacity = '0.5';
	}
	onDragEnter(e) {
		e.preventDefault();
	}
	onDragLeave(e) {
		e.preventDefault();
		this._imagesContainer.nativeElement.style.opacity = '1';
	}
	onDrop(e) {
		e.preventDefault();
		this._imagesContainer.nativeElement.style.opacity = '1';
		let files = e.dataTransfer.files;
		if (files.length > 0 && files[0].type.indexOf('image')>=0) {
			this._filesSelected.next([files[0]]);
		}
	}

	refreshView(loading = false, loadingText = 'Loading...') {
		this._loading = loading;
		this._loadingText = loadingText;
		if (this.view_active)
			this.changeDetector.detectChanges();
	}

	onCancelled() {
		if (!this.callingAPI) return;
		this.callingAPI.unsubscribe();
		this.refreshView();
	}

	ngOnDestroy() {
		this.view_active = false;
		this.subs.forEach(s => s.unsubscribe());
	}
}
