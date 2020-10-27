import {
	Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
	ViewChild, ElementRef
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { AppService } from '@app/app.service';

export { WindowService, DialogWindow } from '@app-common/window/window.service';

/** */
export function createImageImportDialogWindow(
	windowService: WindowService
): DialogWindow<ImageImportDialogComponent> {
	return windowService.create<ImageImportDialogComponent>(
		ImageImportDialogComponent,
		{
			width: 250,
			height: 350,
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
		comp.filelistsubmit.subscribe(() => window.close());
		comp.filesubmit.subscribe(() => window.close());
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
export class ImageImportDialogComponent implements OnInit, OnDestroy {
	@Output() public options = {
		readAs: 'ArrayBuffer'
	};
	@Output('close') close = new EventEmitter<void>();
	@Output('filelistSubmit') filelistsubmit = new EventEmitter<File[]>();
	@Output('fileSubmit') filesubmit = new EventEmitter<File>();
	@Output('submit') submit = new EventEmitter<string>();

	@ViewChild('importFile') public _importFile: ElementRef;

	// ---------------------------------------------------------------
	public _ribbonPrev = new Rx.Subject<void>();
	public _ribbonNext = new Rx.Subject<void>();
	public _ribbonItemIndex: number = 0;
	public _loading: boolean = false;
	public _loadingText: string = "Saving...";
	// ---------------------------------------------------------------
	public readonly _importSources = [
		{ name: 'Facebook', imageUrl: '/assets/images/canvas/facebook.png' },
		{ name: 'Instagram', imageUrl: '/assets/images/canvas/instagram.png' },
		{ name: 'Dropbox', imageUrl: '/assets/images/canvas/dropbox.png' },
		{ name: 'Google Drive', imageUrl: '/assets/images/canvas/google-drive.png' },
		{ name: 'Google +', imageUrl: '/assets/images/canvas/google-plus.png' },
		{ name: 'Flickr', imageUrl: '/assets/images/canvas/Flickr.png' },
		{ name: 'iCloud Apple', imageUrl: '/assets/images/canvas/icloud-apple.png' },
		{ name: 'Picasa', imageUrl: '/assets/images/canvas/picasa.png' }
	];

	// ---------------------------------------------------------------
	public _imageUrl = new FormControl('');
	private callingAPI: Rx.Subscription;
	private subs: Rx.Subscription[] = [];

	constructor(
		private elementRef: ElementRef,
		private changeDetector: ChangeDetectorRef,
		private sanitizer: DomSanitizer,
		private windowService: WindowService,
		private appService: AppService
	) { }

	ngOnInit() {
		const ribbonItemIndex = Rx.Observable.merge(
			this._ribbonPrev.map(() => -1),
			this._ribbonNext.map(() => 1))
			.scan((acc, val) =>
				lodash.clamp(acc + val, 0, this._importSources.length - 3));

		this.subs = [
			ribbonItemIndex.subscribe((r) => {
				this._ribbonItemIndex = r;
				this.changeDetector.detectChanges();
			}),
		];
		(this.elementRef.nativeElement as HTMLElement).parentElement.style.top = document.body.scrollTop + 50 + 'px';
	}

	backgroundImage(url: string): SafeStyle {
		return url ? this.sanitizer.bypassSecurityTrustStyle(`url('${url}')`) : '';
	}

	onClose() {
		this.close.emit();
	}

	onFileSubmit(event: any) {
		let files: File[] = [];
		files = ([].slice.apply(event.target.files) as File[]);
		this.filelistsubmit.emit(files);
	}

	onSubmit() {
		this.submit.emit();
	}

	onCancelled() {
	  if (!this.callingAPI) return;
	  this.callingAPI.unsubscribe();
	  this.refreshView();
	}

	openFeedbackDialog() {
		createFeedbackDialogWindow(this.windowService, 'wimi.120').open();
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
