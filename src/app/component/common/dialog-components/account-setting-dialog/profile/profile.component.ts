import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

import {
    get as _get
} from 'lodash';

import { createImageImportDialogWindow } from '@app-dialogs/image-import-dialog/image-import-dialog.component';
import { createImageEditorWindow, ImageEditorComponent } from '@app-dialogs/image-editor/image-editor.component';
import { LoadingComponent } from '@app-ui/loading/loading.component';
import { ImagePath, User, ExpertiseInfo } from '@app/models';
import { AppService } from '@app/app.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

@Component({
    moduleId: module.id,
    selector: 'profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnChanges, OnDestroy { 
    @Input() info: User = new User;
    @Output() infoChange = new EventEmitter<any>();
    @Output() validityChange = new EventEmitter<boolean>();

    @ViewChild('photoEle') photoEle: ElementRef;
    @ViewChild(LoadingComponent) loadingComponent: LoadingComponent;

    viewInited: boolean = false;
    form: FormGroup;
    loading: boolean = false;   
        
    private subs: Subscription[] = [];

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
            photo    : [this.info.photo],
            description   : ['', Validators.required],      
        });    

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
        let image = this.form.value.photo;
        return this.sanitizer.bypassSecurityTrustStyle(image && image.name ? `url('${image.location + '/' + image.name}')` : `url('assets/images/canvas/person.png')`);
    }

    ngOnDestroy() {
        this.viewInited = false;    
        this.subs.forEach(s => s.unsubscribe());
    }   
}
