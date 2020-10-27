
import { Component, Input, Output, EventEmitter, ViewChild, ElementRef,
	OnInit, AfterViewInit, OnDestroy, OnChanges, SimpleChanges
	} from '@angular/core';
import {
		FormBuilder, FormGroup, FormControl, Validators, AbstractControl, 
	} from '@angular/forms';
import * as Rx from 'rxjs/Rx';

import { ContactInfo, ContactFieldInfo, SecondFieldInfo } from '@app/models';
import { ContactInfoForm, ContactFieldInfoForm, SecondFieldInfoForm } from '@app-dialogs/donation-dialog/contact-info/contact-info.form';
import { ContactInfoFieldsComponent} from '@app-dialogs/donation-dialog/contact-info/contact-info-fields/contact-info-fields.component';

import { WindowService, DialogWindow } from '@app-common/window/window.service';


@Component({
	moduleId: module.id,
	selector: 'fundraising-contact-info',
	templateUrl: './contact-info.component.html',
	styleUrls: [
		'./contact-info.component.css',
		'../donation-dialog.component.css'
	]
})

export class ContactInfoComponent implements OnInit{

	@Input('contactInfoEnabled') contactInfoEnabled = new FormControl(false);
	@Input('form') form: ContactInfoForm;

	@ViewChild('box') box: ElementRef;

	_subs: Rx.Subscription[] = [];

	constructor(private _windowService: WindowService) { }

	ngOnInit() {
		
		if (this.contactInfoEnabled.value)
			$(this.box.nativeElement).slideDown("fast");
		else
			$(this.box.nativeElement).slideUp("fast");
		
		this._subs=[
			this.contactInfoEnabled.valueChanges.subscribe(value=> {
				if (value)
					$(this.box.nativeElement).slideDown("slow");
				else
					$(this.box.nativeElement).slideUp("slow");
			})
		];
	}

	ngAfterViewInit() {
	}

	get fields(): ContactFieldInfo[] {		
		return this.form.value.defaultFields
			.concat(this.form.value.customFields)			
			.filter(x => x.isSelected);		
	}

	showWindow() {
		let _window = this._windowService.create<ContactInfoFieldsComponent>(
			ContactInfoFieldsComponent,
			{ width: 400 }
		)
			.changeInputs((component, w) => {
				component.form = this.form;
				component.close.subscribe(() => {
					w.close();
					w.destroy();
				});
			});
		_window.open();
	}
		
	ngOnDestroy() {		
		if (this._subs) {
			this._subs.forEach(s => s.unsubscribe());
		}
	}
}

