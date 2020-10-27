import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import * as Rx from 'rxjs/Rx';

import {
	get as _get
} from 'lodash';
import * as imageUrl from '@app-lib/functions/image-url';
import { createImageImportDialogWindow } from '@app-dialogs/image-import-dialog/image-import-dialog.component';
import { createImageEditorWindow, ImageEditorComponent } from '@app-dialogs/image-editor/image-editor.component';
import { LoadingComponent } from '@app-ui/loading/loading.component';
import { ImagePath, User, ExpertiseInfo } from '@app/models';
import { AppService } from '@app/app.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

@Component({
	moduleId: module.id,
	selector: 'freelancer-about',
	templateUrl: './freelancer-about.component.html',
	styleUrls: ['./freelancer-about.component.css']
})
export class FreelancerAboutComponent implements OnInit, OnChanges, OnDestroy {

	@Input() info: User = new User;
	@Input() expertise: ExpertiseInfo[] = [];
	@Input() isNew: boolean = true;

	@Output() infoChange = new EventEmitter<any>();
	@Output() validityChange = new EventEmitter<boolean>();

	@ViewChild('photoEle') photoEle: ElementRef;
	@ViewChild(LoadingComponent) loadingComponent: LoadingComponent;

	viewInited: boolean = false;
	form: FormGroup;
	loading: boolean = false;

	expertise1: ExpertiseInfo[] = [];
	expertise2: ExpertiseInfo[] = [];
	others: ExpertiseInfo[] = [];

	private dragEle: HTMLElement;
	private subs: Rx.Subscription[] = [];

	constructor(
		private sanitizer: DomSanitizer,
		private formBuilder: FormBuilder,
		private appService: AppService,
		private windowService: WindowService,
		private changeDetector: ChangeDetectorRef
	) {
	}

	ngOnInit() {
		this.form = this.formBuilder.group({
			photo	 : [this.info.photo],
			description   : [this.info.description, Validators.required],
			services  : [this.info.services ? this.info.services : [], Validators.required],
			otherServices : [this.info.otherServices ? this.info.otherServices : []]
		});

		if (this.info.otherServices && this.info.otherServices.length > 0) {
			this.info.otherServices.forEach(item=> {
				this.others.push(new ExpertiseInfo(0, item));
			});
		}

		this.others.push(new ExpertiseInfo);

		this.subs = [
			this.form.valueChanges.subscribe(res => {
				Object.keys(res).forEach(key=> {
					this.info[key] = res[key];
				});
				this.infoChange.emit(this.info);
				this.isValid();
			})
		];
		this.viewInited = true;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['expertise'] && this.expertise) {
			const length = this.expertise.length;
			if (length > 0) {
				const h = Math.ceil(length/2);
				this.expertise1 = this.expertise.slice(0, h);
				this.expertise2 = this.expertise.slice(h);
				if (this.viewInited) this.changeDetector.detectChanges();
			}
		}
	}

	isValid() {
		if (!this.viewInited) return;
		this.validityChange.emit(this.form.valid);
		this.changeDetector.detectChanges();
	}

	isItemChecked(value: ExpertiseInfo) {
		return (this.form.value.services.indexOf(value.id)>=0);
	}

	onItemCheckChange(event, value: ExpertiseInfo) {
		if (value.description == '') return;
		let services = this.form.value.services;
		if (event.target.checked) {
			services.push(value.id);
		}
		else {
			services = services.filter(service=>service!=value.id);
		}
		this.form.controls.services.setValue(services);
	}

	isOtherItemChecked(value: ExpertiseInfo) {
		return (this.form.value.otherServices.indexOf(value.description)>=0);
	}

	onOtherItemCheckChange(event, value: ExpertiseInfo) {
		if (value.description == '') return;
		let services = this.form.value.otherServices;
		if (event.target.checked) {
			services.push(value.description);
		}
		else {
			services = services.filter(service=>service!=value.description);
		}
		this.form.controls.otherServices.setValue(services);
	}

	onMoreOther(event) {
		this.others.push(new ExpertiseInfo);
		this.changeDetector.detectChanges();
	}

	onRemoveOther(event, item, i) {
		this.form.controls.otherServices.setValue(this.form.value['otherServices'].filter(service=>service != item.description));
		this.others.splice(i, 1);
		this.changeDetector.detectChanges();
	}

	openImportDialog() {
		let importPhoto = createImageImportDialogWindow(this.windowService);
		importPhoto.componentRef.instance.submit.subscribe(res => {
			importPhoto.destroy();
			this.form.controls.photo.setValue(res);
		});
		importPhoto.open();
	}

	openImageEditor() {
		let imageEditor: DialogWindow<ImageEditorComponent>;
		imageEditor = createImageEditorWindow(this.windowService);
		imageEditor.componentRef.instance.openImageInEditor(this.form.value.photo);
		imageEditor.componentRef.instance.newImage.subscribe(res => {
			imageEditor.destroy();
			this.form.controls.photo.setValue(res);
		});
		imageEditor.componentRef.instance.close.subscribe(() => {
			imageEditor.destroy();
		});
		imageEditor.open();
	}

	uploadeImages(files: File[]) {
	  this.appService.uploadImages(files).subscribe(
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
							this.form.controls.photo.setValue(img as ImagePath);
						}
						break;
					// default:
					//	 console.log(`File "${index}" surprising upload event: ${event.type}.`);
				}
			},
			error => {
				console.log(error)
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
		this.photoEle.nativeElement.style.opacity = '0.5';
	}
	onDragEnter(e) {
		e.preventDefault();
	}
	onDragLeave(e) {
		e.preventDefault();
		this.photoEle.nativeElement.style.opacity = '1';
	}
	onDrop(e) {
		e.preventDefault();
		this.photoEle.nativeElement.style.opacity = '1';
		let files = e.dataTransfer.files;
		if (files.length > 0 && files[0].type.indexOf('image')>=0) {
			this.uploadeImages([files[0]]);
		}
	}

	refreshView(loading: boolean = false, text: string = 'Saving...') {
		if (!this.viewInited) return;
		this.loading = loading;
		this.changeDetector.detectChanges();
	}

	removeImage() {
		this.form.controls.photo.setValue(null);
		this.refreshView();
	}

	backgroundImage(): SafeStyle {
		let image = imageUrl.imageUrl(this.form.value.photo);
		return this.sanitizer.bypassSecurityTrustStyle(image ? image : `url('assets/images/canvas/person.png')`);
	}

	ngOnDestroy() {
		this.viewInited = false;
		this.subs.forEach(s => s.unsubscribe());
	}
}
