import {
	Component,
	Output,
	EventEmitter,
	OnInit,
	AfterViewInit,
	ChangeDetectorRef,
	OnDestroy,
	ViewChild,
	ElementRef,
	HostListener,
	Input
} from "@angular/core";
import { HttpEventType } from "@angular/common/http";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";
import { FormControl } from "@angular/forms";
import * as Rx from "rxjs/Rx";
import * as lodash from "lodash";

import { createFeedbackDialogWindow } from "@app-dialogs/feedback-dialog/feedback-dialog.component";
import { LoadingComponent } from "@app-ui/loading/loading.component";
import { VideoInfo } from "@app-models/video-info";
import { WindowService, DialogWindow } from "@app-common/window/window.service";
import { AppService } from "@app/app.service";

const TOOLS: AviaryNS.FeatherTools[] = ["crop", "resize"];

/** */
export function createVideoImportDialogWindow(
	windowService: WindowService,
	videoType: string = "",
	feedbackcode: string = ""
): DialogWindow<VideoImportDialogComponent> {
	return windowService
		.create<VideoImportDialogComponent>(VideoImportDialogComponent, {
			width: 320,
			height: 370,
			modal: true,
			draggable: true,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		})
		.changeInputs((comp, window) => {
			comp.videoType = videoType;
			comp.feedbackcode = feedbackcode;
			comp.close.subscribe(() => window.close());
			comp.submit.subscribe(() => window.close());
		});
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
	moduleId: module.id,
	templateUrl: "video-import-dialog.component.html",
	styleUrls: ["video-import-dialog.component.css"]
})
export class VideoImportDialogComponent
	implements OnInit, AfterViewInit, OnDestroy {
	@Input()
	videoType: string = "";
	@Input()
	feedbackcode: string = "";

	@Output()
	close = new EventEmitter<void>();
	@Output()
	submit = new EventEmitter<VideoInfo | null>();

	@ViewChild(LoadingComponent)
	loadingComponent: LoadingComponent;
	@ViewChild("importFile")
	public _importFile: ElementRef;

	public _loading: boolean = false;

	public videoInfo: VideoInfo = VideoInfo.empty();
	public videoUrl = new FormControl("");

	public _ribbonPrev = new Rx.Subject<void>();
	public _ribbonNext = new Rx.Subject<void>();
	public _ribbonItemIndex: number = 0;

	// ---------------------------------------------------------------
	public readonly _importSources = [
		{ name: "YouTube", imageUrl: "/assets/images/canvas/youtube.png" },
		{ name: "Vimeo", imageUrl: "/assets/images/canvas/vimeo.png" },
		{ name: "Facebook", imageUrl: "/assets/images/canvas/facebook.png" }
	];

	private callingAPI: Rx.Subscription;
	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private sanitizer: DomSanitizer,
		private windowService: WindowService,
		private appService: AppService
	) {}

	ngOnInit() {
		this.subs = [
			this.videoUrl.valueChanges.subscribe(res => {
				this.refreshView();
			})
			// this._ribbonPrev.subscribe(() => {
			//		 this._ribbonItemIndex = lodash.clamp(this._ribbonItemIndex - 1, 0, this._importSources.length - 3);
			//		 this.refreshView();
			// }),
			// this._ribbonNext.subscribe(() => {
			//		 this._ribbonItemIndex = lodash.clamp(this._ribbonItemIndex + 1, 0, this._importSources.length - 3);
			//		 this.refreshView();
			// })
		];
	}

	ngAfterViewInit() {}

	backgroundImage(url: string): SafeStyle {
		return url ? this.sanitizer.bypassSecurityTrustStyle(`url('${url}')`) : "";
	}

	uploadFiles(event) {
		let files: File[] = [];
		files = [].slice.apply(event.target.files) as File[];
		this.refreshView(true);
		this.callingAPI = this.appService.uploadImages(files).subscribe(
			event => {
				switch (event.type) {
					case HttpEventType.Sent:
						// console.log(`Uploading file "${index}" of size ${f.size}.`);
						break;
					case HttpEventType.UploadProgress:
						if (this.loadingComponent)
							this.loadingComponent.set(
								Math.min((event.loaded / event.total) * 100, 98)
							);
						break;
					case HttpEventType.Response:
						if (event.body) {
							this.videoInfo.type = 1; // video
							if (event.body['urls'])
								this.videoInfo.url = event.body['urls'][0];
							this.submit.next(this.videoInfo);
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

	refreshView(loading: boolean = false, text: string = "Uploading...") {
		this._loading = loading;
		this.changeDetector.detectChanges();
	}

	openFeedbackDialog() {
		createFeedbackDialogWindow(this.windowService, this.feedbackcode).open();
	}

	onClose() {
		this.close.emit();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}
