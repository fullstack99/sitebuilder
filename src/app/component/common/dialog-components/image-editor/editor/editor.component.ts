import { Component, ViewChild, AfterViewInit, HostListener, ElementRef, Input,
		 OnChanges, SimpleChanges, OnInit, ChangeDetectorRef, Output, EventEmitter,
		 OnDestroy
	   } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import * as Rx from 'rxjs/Rx';
import { ancestors } from '@app-lib/dom/dom';
import { Maybe } from '@app-lib/maybe/maybe';

import { EditorService } from '@app-dialogs/image-editor/editor/editor.service';
import { AppService } from '@app/app.service';
import { UUID } from '@app-lib/uuid/uuid.service';

const TOOLS: AviaryNS.FeatherTools[] = [
	'crop',
	'resize',
	'orientation',
	'lighting',
	'sharpness',
	'text',
	'color',
	'enhance',
	'effects',
	'frames',
	'overlays',
	'stickers',
	'focus',
	'vignette',
	'blemish',
	'whiten',
	'redeye',
	'draw',
	'colorsplash',
	'meme',
];

@Component({
	moduleId: module.id,
	selector: 'editor',
	templateUrl: 'editor.component.html',
	styleUrls: ['editor.component.css']
})
export class EditorComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
	@Input('imageElement') imageElement: Maybe<HTMLImageElement>;
	@Input('visibleSave') visibleSave: boolean = false;

	@Output('imageSaved') imageSaved = new EventEmitter<string>();
	@Output('close') close = new EventEmitter<void>();

	@ViewChild('editorContainer') editorContainer: ElementRef;

	public _loading: boolean = false;
	private viewInited: boolean = false;
	private _editor = Maybe.nothing<AviaryNS.Feather>();
	private changed: number = 0;
	private uploadingImages: Rx.Subscription;
	private _subs: Rx.Subscription[] = [];

	constructor(
		private _elementRef: ElementRef,
		private _editorService: EditorService,
		private _appService: AppService,
		private _changeDetectorRef: ChangeDetectorRef
	) {}

	ngOnInit() {
		this.setEditor();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (!this.viewInited) return;
		if (changes['imageElement'].currentValue)
			this.setEditor();
	}

	ngAfterViewInit() {
		this.viewInited = true;
	}

	setEditor() {
		try{
			this._editor.map(e => e.close());
			this.imageElement.map(imageElem => {
				this._editorService.getEditor()
					.then(editor => {
						this._editor.map(e => e.close());
						this._editor = Maybe.just(editor);
						editor.launch({
							image: imageElem,
							appendTo: '__editor_container',
							// onError: e => console.log(e),
							theme: 'light',
							tools: TOOLS,
							onLoad: () => {
							},

							onReady: () => {
								$('#avpw_save_button').text('Place On Page');
								if (!this.visibleSave)
									$('#avpw_save_button').addClass('hidden');
							},

							onClose: () => {
							},

							onSaveButtonClicked: (imageId) => {
								this.refreshView(true);
								$((this._elementRef.nativeElement as HTMLElement).parentElement).addClass('disable');
								$(this.editorContainer.nativeElement as HTMLElement).addClass('disable-black');

								let ele: any = document.getElementById('avpw_canvas_element');
								let imageFile = this._appService.dataURLtoFile(ele.toDataURL(), 'aviary-' + UUID.UUID() + '.png');
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
												if (event.body) {
													$((this._elementRef.nativeElement as HTMLElement).parentElement).removeClass('disable-black');
													$(this.editorContainer.nativeElement as HTMLElement).removeClass('disable-black');
													// this.refreshView(false);
													console.log(event.body);
													this.imageSaved.emit(event.body['urls'][0]);
												}
												break;
										}
									},
									error => {
										console.log(error);
										$((this._elementRef.nativeElement as HTMLElement).parentElement).removeClass('disable-black');
										$(this.editorContainer.nativeElement as HTMLElement).removeClass('disable-black');
										this.refreshView(false);
										// this.alertService.playToast('Failed', `There is an error while uploading ${f.name}. Try again`, 1);
									},
									() => {
									}
								);
								return false;
							},
							onSave: (imgID, newURL) => {
								return false;
							}
					});
				}, e => {console.log('error')});
			});
		}
		catch(e) {
		  console.log(e);
		}
	}

	onCancelled() {
		if (!this.uploadingImages) return;
		this.uploadingImages.unsubscribe();
		this.refreshView();
	}

	onClose() {
		$('#_back').removeClass('hidden');
		this.close.emit();
	}

	refreshView(loading: boolean = false) {
		this._loading = loading;
		this._changeDetectorRef.detectChanges();
	}

	onMouseMove(event: MouseEvent) {
		let canvas = document.getElementById('avpw_canvas_element');

		if ($('#avpw_tool_main_container').css('display')=='none') {
			$('#_back').addClass('hidden');
		}
		else {
			$('#_back').removeClass('hidden');
		}
	}

	ngOnDestroy() {
		this._editor.map(e => e.close());
		this._subs.forEach(s => s.unsubscribe());
	}

	onViewPlaceButton() {
		if (this.changed>0)
			$('#avpw_save_button').removeClass('hidden');
		else
			$('#avpw_save_button').addClass('hidden');
	}

	@HostListener('click', ['$event'])
	onClick(event: KeyboardEvent) {
		if ((event.target as HTMLElement).getAttribute('id') == 'avpw_apply_container') {
			const interval = setInterval(() => {
				if (!$('#avpw_history_undo').hasClass('avpw_history_disabled') || !$('#avpw_history_redo').hasClass('avpw_history_disabled')) {
					this.changed = this.changed + 1;
					this.onViewPlaceButton();
					clearInterval(interval);
				}
			},100);
		}
		else if ((event.target as HTMLElement).className=='avpw_history_icon') {
			let parent = (event.target as HTMLElement).parentElement;
			if (parent.getAttribute('id')=='avpw_history_undo' && $(parent).hasClass('avpw_history_disabled')) {
				this.changed = this.changed - 1;
			}
			else if (parent.getAttribute('id')=='avpw_history_redo' && $(parent).hasClass('avpw_history_disabled')) {
				this.changed = this.changed + 1;
			}
			this.onViewPlaceButton();
		}
	}
}
