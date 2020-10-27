import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import * as Rx from 'rxjs/Rx';
import {
	cloneDeep as _cloneDeep,
	get as _get
} from 'lodash';

import { createImageImportDialogWindow } from '@app-dialogs/image-import-dialog/image-import-dialog.component';
import { createImageEditorWindow } from '@app-dialogs/image-editor/image-editor.component';
import { LoadingComponent } from '@app-ui/loading/loading.component';

import { ScheduleInfo, LocationInfo, ProviderInfo, ProviderLocationInfo, HourInfo, ImagePath, ServiceInfo } from '@app/models';
import * as formLib from '@app-lib/functions/form';

import { AlertService } from '@app/services';
import { AppService } from '@app/app.service';
import { WindowService } from '@app-common/window/window.service';

@Component({
	moduleId: module.id,
	selector: 'providers',
	templateUrl: './providers.component.html',
	styleUrls: ['./providers.component.css']
})
export class ProvidersComponent implements OnInit, OnDestroy {
	@Input() info: ScheduleInfo = new ScheduleInfo;
	@Input() isNew: boolean = true;
	@Input() visited: boolean = false;

	@Output() infoChange = new EventEmitter<ScheduleInfo>();
	@Output() validityChange = new EventEmitter<boolean>();

	@ViewChild('formContainer') formContainerEle: ElementRef;
	@ViewChild('photoEle') photoEle: ElementRef;
	@ViewChild(LoadingComponent) loadingComponent: LoadingComponent;

	locations: LocationInfo[] = [];
	services: ServiceInfo[] = [];
	viewInited: boolean = false;
	activeIndex: number = 0;
	dispForms: any;
	formArray: FormArray;
	providerTypeCtrl: FormControl = new FormControl('-1');
	imageFiles: File[] = [];

	_loading: boolean = false;
	animationState: string = 'right';
	private animationLeft = [
		{ transform: 'translateX(-50%)' },
		{ transform: 'translateX(0)' }
	];
	private animationRight = [
		{ transform: 'translateX(50%)' },
		{ transform: 'translateX(0)' }
	];

	showLocationValue = (l: LocationInfo) => l.address1;
	showServiceValue = (s: ServiceInfo) => s.title;

	private fields = ['name', 'details', 'photo'];
	private providerTypes = ['SingleProviderHidden', 'SingleProviderDisplay','CustomerChoice', 'NoProviderChoice'];
	private dragEle: HTMLElement;
	private time = new Date().getTime();
	private subs: Rx.Subscription[] = [];

	constructor(
		private sanitizer: DomSanitizer,
		private formBuilder: FormBuilder,
		private alertService: AlertService,
		private appService: AppService,
		private windowService: WindowService,
		private changeDetector: ChangeDetectorRef
	) {
	}

	ngOnInit() {
		this.providerTypeCtrl.setValue('' + this.providerTypes.indexOf(this.info.providerType));

		if (this.info.locations && this.info.locations.length > 0) {
			this.locations = this.info.locations.filter(i=>i.editStatus != 'Deleted');
		}

		if (this.info.services && this.info.services.length > 0) {
			this.services = this.info.services.filter(i=>i.editStatus != 'Deleted');
		}

		if (this.info.providers && this.info.providers.length > 0)
			this.formArray = this.formBuilder.array(this.info.providers.map(item => this.newForm(false, item, this.info.providerType == 'SingleProviderHidden' ? false : this.visited)));
		else
			this.formArray = this.formBuilder.array([this.newForm(true, new ProviderInfo, this.info.providerType == 'SingleProviderHidden' ? false : this.visited)]);

		this.subs = [
			this.providerTypeCtrl.valueChanges.subscribe(res => {
				if (res=='0') {
					this.activeIndex = 0;
				}
				else if (this.dispForms.length > 0 && this.dispForms[0].invalid) {
					this.alertService.playToast('Warning', 'You need to add Providers hours after fill up!', 2);
				}
				this.info.providerType = this.providerTypes[parseInt(res)];
				this.isValid();
			}),

			this.formArray.valueChanges.subscribe(res => {
				this.dispForms = this.formArray.controls.filter(form=>form.value['editStatus'] != 'Deleted');
				this.info.providers = res;
				this.isValid();
			})
		];

		this.dispForms = this.formArray.controls.filter(form=>form.value['editStatus'] != 'Deleted');
		if (this.dispForms.length==0) {
			this.activeIndex--;
			this.addForm();
		}

		this.viewInited = true;
		this.isValid();
	}

	isValid() {
		if (!this.viewInited) return;
		this.validityChange.emit(this.dispForms.findIndex(f=>f.invalid)<0 || this.providerTypeCtrl.value=='0');
		if (this.dispForms.length > 0) {
			this.changeDetector.detectChanges();
		}
	}

	setAnimation() {
		if (this.formContainerEle)
			this.formContainerEle.nativeElement.animate(
				this.animationState == 'left' ? this.animationLeft : this.animationRight,
				{
					duration: 300
				}
			);
	}

	getSelectedFirstLocation(form) {
		let control = (form as FormGroup).controls['locations'];
		if (!control.value || control.value.length ==0 || !this.locations || this.locations.length == control.value.length) {
			return null;
		}

		let res = this.getLocations([control.value[0].locationUid]);
			if (res && res.length > 0)
				return res[0];
		return null;
	}

	getSelectedFirstService() {
		let control = (this.dispForms[this.activeIndex] as FormGroup).controls['services'];
		if (control.value && control.value.length > 0) {
			let res = this.getServices([control.value[0]]);
			return res[0]
		}
		return null;
	}

	getSelectedLocations(form) {
		let control = (form as FormGroup).controls['locations'];
		return this.getLocations(control.value.map(item=>item.locationUid));
	}

	getSelectedServices() {
		let control = (this.dispForms[this.activeIndex] as FormGroup).controls['services'];
		return this.getServices(control.value);
	}

	onLocationsChange(event: LocationInfo[]) {
		let control = (this.dispForms[this.activeIndex] as FormGroup).controls['locations'];
		control.setValue(event.map(l=> new ProviderLocationInfo(l.uid, new HourInfo)));
	}

	isServiceChecked(form, uid) {
		if (!form.controls['services'].value) return false;
		return form.controls['services'].value.indexOf(uid) >= 0;
	}

	onServiceCtrlChange(event, form) {
		if (form.controls['servicesCtrl'].value == 1 && this.services) {
			form.controls['services'].setValue(this.services.map(service=>service.uid));
		}
		else if (form.controls['servicesCtrl'].value == 0  && this.services) {
			form.controls['services'].setValue([]);
		}
	}

	onServicesChange(event, form, uid) {
		let control = form.controls['services'];
		let serviceUids = control.value ? control.value : [];
		if (event.target.checked) {
			if (!serviceUids || serviceUids.length == 0) {
				serviceUids.push(uid);
			}
			else if (serviceUids.indexOf(uid) < 0) {
				serviceUids.push(uid);
			}
		}
		else {
			serviceUids = serviceUids.filter(luid=>luid!=uid);
		}
		control.setValue(serviceUids);
	}

	// onServicesChange(event: ServiceInfo[]) {
	//	 let control = (this.dispForms[this.activeIndex] as FormGroup).controls['services'];
	//	 control.setValue(event.map(s=>s.uid));
	// }

	getLocations(uids: string[]) {
		if (!uids) return [];
		let locations = (this.locations || []).filter(l=>uids.indexOf(l.uid)>=0);
		return locations;
	}

	getServices(uids: string[]) {
		if (!uids) return [];
		let services = (this.services || []).filter(s=>uids.indexOf(s.uid)>=0);
		return services;
	}

	newForm(isNew: boolean, info: ProviderInfo = new ProviderInfo, markAsTouched: boolean = false) {
		let editStatus = info.editStatus;
		if (!this.isNew && editStatus != 'Deleted' && editStatus != 'New') {
			editStatus = isNew ? 'New' : 'Modified';
			if (info.hoursOfOperation && !info.hoursOfOperation.times.sunday) {
				info.hoursOfOperation.times['sunday'] = [];
			}
		}

		if (isNew && this.locations)
			info.locations = this.locations.map(location=> {
				let hOp = _cloneDeep(location.hoursOfOperation);
				hOp.editStatus = 'New';
				return new ProviderLocationInfo(location.uid, hOp);
			});
		if (isNew && this.services)
			info.services = this.services.map(service=>service.uid);

		let form = this.formBuilder.group({
			uid		 : [info.uid],
			name		: [info.name, Validators.required],
			details	 : [info.details],
			photo	   : [info.photo],
			locations   : [info.locations], // [] : No, or not : Yes
			services	: [info.services],
			hoursOfOperation : [info.hoursOfOperation],
			servicesCtrl: [!this.services || info.services && info.services.length == this.services.length ? '1' : '0'],
			editStatus  : [editStatus],
			dispUrl	 : [info.dispUrl],
			willHoursChange : [isNew || info.willHoursChange ? true : false]
		});
		if (markAsTouched) {
			Object.keys(form.controls).forEach(key=> {
				form.controls[key].markAsTouched();
			})
		}
		return form;
	}

	addForm() {
		this.activeIndex++;
		this.animationState = 'right';
		this.formArray.push(this.newForm(true));
		this.alertService.playToast('Warning', 'You need to add Providers hours after fill up!', 2);
	}

	removeForm(event: MouseEvent = null) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		if (this.dispForms.length == 1) {
			this.activeIndex --;
			this.addForm();
			if (this.dispForms[this.activeIndex].value['editStatus'] == 'Modified') {
				(this.dispForms[this.activeIndex] as FormGroup).controls['editStatus'].setValue('Deleted');
			}
			else {
				this.formArray.removeAt(this.formArray.length - 2);
			}
			return;
		}

		if (this.activeIndex >= this.dispForms.length-1) {
			if (this.dispForms[this.activeIndex].value['editStatus'] == 'Modified') {
				this.activeIndex --;
				(this.dispForms[this.activeIndex+1] as FormGroup).controls['editStatus'].setValue('Deleted');
			}
			else {
				let index = this.formArray.controls.findIndex(control => control === this.dispForms[this.activeIndex]);
				this.activeIndex --;
				this.animationState = 'left';
				this.formArray.removeAt(index);
			}
		}
		else {
			this.animationState = 'right';
			if (this.dispForms[this.activeIndex].value['editStatus'] == 'Modified') {
				(this.dispForms[this.activeIndex] as FormGroup).controls['editStatus'].setValue('Deleted');
			}
			else {
				let index = this.formArray.controls.findIndex(control => control === this.dispForms[this.activeIndex]);
				this.formArray.removeAt(index);
			}
		}
		this.setAnimation();
	}

	prev(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (this.dispForms[this.activeIndex].invalid) {
			if (this.isBlankForm()) {
				this.removeForm();
			}
			else {
				this.alertService.playToast('Warning', 'Please fill in the Name field or delete this form.',2);
			}
			return;
		}
		if (this.activeIndex > 0) {
			this.activeIndex--;
			this.animationState = 'left';
			this.changeDetector.detectChanges();
			this.setAnimation();
		}
	}

	next(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (this.dispForms[this.activeIndex].invalid) {
			this.alertService.playToast('Warning', 'Please fill in the Name field.',2);
			return;
		}
		if (this.activeIndex < this.dispForms.length - 1) {
			this.animationState = 'right';
			this.activeIndex++;
			this.changeDetector.detectChanges();
		}
		else {
			this.addForm();
		}
		this.setAnimation();
	}

	isBlankForm() {
		return formLib.isBlankFrom(this.dispForms[this.activeIndex], this.newForm(true), this.fields);
	}

	openImportDialog() {
		let importPhoto = createImageImportDialogWindow(this.windowService);
		importPhoto.componentRef.instance.submit.subscribe(res => {
			(this.dispForms[this.activeIndex] as FormGroup).patchValue({
				photo: res,
				dispUrl: ''
			});
			importPhoto.destroy();
		});
		importPhoto.open();
	}

	openImageEditor() {
		let imageEditor = createImageEditorWindow(this.windowService);
		let img;
		if (this.dispForms[this.activeIndex].controls['dispUrl'].value && this.appService._currentSite.url)
			img = 'https://' + this.appService._currentSite.url + '/' + this.dispForms[this.activeIndex].controls['dispUrl'].value;
		else
			img = this.dispForms[this.activeIndex].controls['photo'].value;
		if (img)
			imageEditor.componentRef.instance.openImageInEditor(img);

		imageEditor.componentRef.instance.newImage.subscribe(res => {
			imageEditor.destroy();
			(this.dispForms[this.activeIndex] as FormGroup).patchValue({
				photo: res,
				dispUrl: ''
			});
		});
		imageEditor.componentRef.instance.close.subscribe(() => {
			imageEditor.destroy();
		});
		if (!img)
			imageEditor.componentRef.instance.refresh();
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
							(this.dispForms[this.activeIndex] as FormGroup).patchValue({
								photo: img as ImagePath,
								dispUrl: ''
							});
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
		this._loading = loading;
		this.changeDetector.detectChanges();
	}

	removeImage() {
		(this.dispForms[this.activeIndex] as FormGroup).patchValue({
			photo: null,
			dispUrl: ''
		});
	}

	get isVisibleLocationsDropdown() {
		if (this.info.locationType == 'WeGoToCustomerLocation' || this.providerTypeCtrl.value <= 1 || !this.locations || this.locations.length == 0)
			return false;
		return true;
	}

	backgroundImage(form): SafeStyle {
		if (form.controls['dispUrl'].value && this.appService._currentSite.url)
			return this.sanitizer.bypassSecurityTrustStyle(`url('${'https://' + this.appService._currentSite.url + '/' + form.controls['dispUrl'].value}')`);
		let img = form.controls['photo'].value;
		return this.sanitizer.bypassSecurityTrustStyle(img && img.name ? `url('${img.location + '/' + img.name}')` : `url('assets/images/canvas/person.png')`);
	}

	ngOnDestroy() {
		this.viewInited = false;
		if (this.formArray.controls[this.formArray.controls.length - 1].invalid && !this.formArray.controls[this.formArray.controls.length - 1].dirty && ['New', 'NoChange'].indexOf(this.formArray.controls[this.formArray.controls.length - 1].value['editStatus'])>=0 && this.info.providers) {
			this.info.providers.splice(this.info.providers.length -1);
			this.validityChange.emit(['SingleProviderHidden'].indexOf(this.info.providerType) >= 0 || this.info.providers.length > 0 && this.dispForms.findIndex((f, index) =>f.invalid && index < this.dispForms.length -1 )<0);
		}
		this.subs.forEach(s => s.unsubscribe());
	}
}
