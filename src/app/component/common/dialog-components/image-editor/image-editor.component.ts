import { Component, ViewChild, AfterViewInit, HostListener, ElementRef, Input,
		 OnInit, Output, EventEmitter, ChangeDetectorRef, OnDestroy
	   } from '@angular/core';
import { Subject, Subscription} from 'rxjs';
import { Maybe } from '@app-lib/maybe/maybe';
import { Folder, ImagePath, FolderPath, ClipPath, Tree, WSDetail } from '@app/models';

import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { ImageService, TreeService } from '@app/services';

export function createImageEditorWindow(
	windowService: WindowService,
	enableFolderPlace: boolean = false
): DialogWindow<ImageEditorComponent> {
	return windowService.create(
		ImageEditorComponent,
		{
			width: 960,
			height: 'calc(100% - 40px)',
			modal: true,
			draggable: true,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.enableFolderPlace = enableFolderPlace;
		comp.close.subscribe(() => window.close());
		comp.newImage.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	templateUrl: 'image-editor.component.html',
	styleUrls: ['image-editor.component.css']
})
export class ImageEditorComponent implements OnInit, OnDestroy {

	@Input() canvasId: string;
	@Input() enableFolderPlace = false;

	@Output() close = new EventEmitter<void>();
	@Output() newImageUrl = new EventEmitter<string>();
	@Output() newImage = new EventEmitter<ImagePath>();
	@Output() setFolder = new EventEmitter<string>();

	public _selectTab		 = new Subject<WSDetail>();
	public _selectEditorTab   = new Subject<void>();
	public _openImageInClipper = new Subject<ImagePath>();

	public tabs: WSDetail[] = [
		{ id: 0, name: 'My Images'},
		{ id: 1, name: 'Image Editor'},
		{ id: 2 , name: 'Stock Images'},
		{ id: 3, name: 'Image Clipper'},
		{ id: 4, name: 'Site\'s Image'}
	];
	public activeTabIndex  : number = 0;
	public imageTreeTypes: string[] = [];

	public _imageElem	   : Maybe<HTMLImageElement> = null;
	public _image		   : ImagePath = null;
	public _clipPath		: ClipPath = null;
	public visibleSave	  : boolean = false;
	public title: string = 'Images';
	public _tree: Tree<FolderPath>;

	private time = new Date().getTime();
	private subs: Subscription[] = [];

	constructor(
		private imageService: ImageService,
		private treeService: TreeService,
		public changeDetector: ChangeDetectorRef
	) {
		this.imageTreeTypes = this.imageService.imageTreeTypes;
	}

	ngOnInit() {
		this.subs = [
			this._openImageInClipper.subscribe((r) => {
				this.activeTabIndex = 3;
				this._image = r;
				this.changeDetector.detectChanges();
			}),

			this._selectTab.subscribe((res) => {
				this.activeTabIndex = res.id;
				if (res.id !== 1 && res.id < 3) {
					// this._tree = this.treeService._trees[this.imageTreeTypes[this.activeTabIndex]];
					// if (!this._tree)
						this.setActiveFolders();
				}
				this.changeDetector.detectChanges();
			})
		];
	}

	setActiveFolders() {
		this.imageService.getTabFolders(this.activeTabIndex).subscribe(
			res => {
				this.getTree(res);
			},
			error => {
				console.log(error);
				this.getTree([]);
			},
			() => {
			}
		);
	}

	getTree(folders: Folder[]) {
		this.treeService._trees[this.imageTreeTypes[this.activeTabIndex]] =
			new Tree<FolderPath>(
				'imageFolder',
				{ name: this.tabs[this.activeTabIndex].name, path: '' },
				Tree.buildTrees(
					'imageFolder',
					folders.map(({ name, subfolders }) => ({ name, subfolders, path: '' })),
					folder => [
						new FolderPath(folder.name, folder.path),
						folder.subfolders.map(({ name, subfolders }) =>
							({ name, subfolders, path: folder.path == '' ? folder.name : folder.path + '/' + folder.name }))
					]
				)
			);
		this._tree = this.treeService._trees[this.imageTreeTypes[this.activeTabIndex]];
		this.changeDetector.detectChanges();
	}

	refresh() {
		this._selectTab.next({ id: 0, name: 'My Images'});
	}

	openImageInEditor(image: any, visibleSave: boolean = false) {
		if (!image) return;
		this.activeTabIndex = 1;
		const img = document.createElement('img');
		img.src = typeof image === 'string' ? image : image.location + '/' + encodeURIComponent(image.name) + '?' + this.time;
		this._imageElem = Maybe.just(img);
		this.visibleSave = visibleSave;
		this._image = image;
		if (visibleSave)
			this.title = 'Video Thumbnail Editor';
		this.changeDetector.detectChanges();
	}

	onPlaceOnPage(img: ImagePath) {
		this.newImage.emit(img);
	}

	onPlaceFolderOnPage(path: string) {
		this.setFolder.emit(path);
	}

	onImageSaved(imagePath: ImagePath) {
		this.newImage.emit(imagePath);
	}

	onClose() {
		this.close.emit();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}
