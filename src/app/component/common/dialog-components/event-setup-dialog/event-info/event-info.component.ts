import { Component, Input, Output, EventEmitter,
		OnInit, OnChanges, SimpleChanges, OnDestroy, AfterViewInit,
		ChangeDetectorRef,
		ViewChildren,
		QueryList,
	   } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, AbstractControl, FormArray } from '@angular/forms';
 import { Subscription } from 'rxjs';
import {
	get as _get
} from 'lodash';

import * as differenceDeep from '@app-lib/functions/difference-deep';
import { matchEmail, emailValidator } from '@app-lib/validators/form-validator';
import { DateRange } from '@app-ui/datetime-range/daterange';
import { DateTimeComponent } from '@app-ui/datetime/datetime.component';
import { createAddEmailDialogWindow } from '@app-dialogs/add-email-dialog/add-email-dialog.component';
import { EventInfo, ImagePath, Slide } from '@app/models';

import { WindowService } from '@app-common/window/window.service';

/**
 * Form type for `EventInfo`
 */
interface EventInfoForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;
		title: FormControl;
		description: FormControl;
		image: FormControl;
		startDate: FormControl;
		endDate: FormControl;
		address1: FormControl;
		address2: FormControl;
		city: FormControl;
		state: FormControl;
		postalCode: FormControl;
		contact: FormControl;
		email: FormControl;
		displayDescription: FormControl;
		displayImage: FormControl;
	};
}

/**
 * Update `EventInfoForm` value.
 */
function updateEventInfoForm(form: EventInfoForm, value: EventInfo, emitEvent: boolean) {
	form.controls.title.setValue(value.title, { emitEvent });
	form.controls.description.setValue(value.description, { emitEvent });
	form.controls.image.setValue(value.image, { emitEvent });
	form.controls.startDate.setValue(value.startDate, { emitEvent });
	form.controls.endDate.setValue(value.endDate, { emitEvent });
	form.controls.address1.setValue(value.address1, { emitEvent });
	form.controls.address2.setValue(value.address2, { emitEvent });
	form.controls.city.setValue(value.city, { emitEvent });
	form.controls.state.setValue(value.state, { emitEvent });
	form.controls.postalCode.setValue(value.postalCode, { emitEvent });
	form.controls.contact.setValue(value.contact, { emitEvent });
	form.controls.email.setValue(value.email, { emitEvent });
	form.controls.displayDescription.setValue(value.displayDescription, { emitEvent });
	form.controls.displayImage.setValue(value.displayImage, { emitEvent });

	console.log(value.startDate);
}


@Component({
	moduleId: module.id,
	selector: 'event-info',
	templateUrl: './event-info.component.html',
	styleUrls: ['./event-info.component.css']
})
export class EventInfoComponent implements OnInit, OnChanges, OnDestroy {

	@Input() eventInfo: EventInfo = EventInfo.empty();
	@Input() touchedBefore: boolean;

	@Output() eventInfoChange = new EventEmitter<EventInfo>();
	@Output() validityChange = new EventEmitter<boolean>();
	@Output() touchedChange = new EventEmitter<boolean>();
	
	@ViewChildren(DateTimeComponent) public datetimeComponents: QueryList<DateTimeComponent>;

	private _initEventInfo = EventInfo.empty();
	private _formChanged = false;
	private _subs: Subscription[] = [];

	form: EventInfoForm;

	constructor(
		private _formBuilder: FormBuilder,
		private _changeDetector: ChangeDetectorRef,
		private _windowService: WindowService,
	) {
		this.form = <EventInfoForm>this._formBuilder.group({
			title: ['',  Validators.required],
			description: [''],
			image: [null],
			startDate: [new Date , Validators.required],
			endDate: [new Date , Validators.required],
			address1: ['',  Validators.required],
			address2: [''],
			city: ['',  Validators.required],
			state: ['',  Validators.required],
			postalCode: ['',  Validators.required],
			contact: [''],
			email: ['',  { updateOn: 'blur', validators: [ emailValidator ] } ],
			displayDescription: [true],
			displayImage: [true],
		});

		this._subs = [
			this.form.valueChanges.subscribe((v) => {
				this.eventInfo = v;
				this.eventInfoChange.emit(v);
				this.validityChange.emit(this.form.valid);
				this.touchedChange.emit(true);

				if (!this._formChanged && differenceDeep.isDifference(v, this._initEventInfo)) {
					['title', 'startDate', 'endDate', 'address1', 'city', 'state', 'postalCode',].forEach(i => {
						this.form.controls[i].markAsTouched();
					});
					this._formChanged = true;
				}
				this._changeDetector.detectChanges();
			}),

			this.form.controls['startDate'].valueChanges.subscribe(
				(selectedValue) => {
					this.form.patchValue({
						endDate: selectedValue,
					}, {emitEvent: true});

					const endDateComponent = this.datetimeComponents.toArray()[1];

					if (endDateComponent && endDateComponent.kendo)
						endDateComponent.kendo.value(selectedValue);
				}
			),
		];
	}

	ngOnInit() {
		updateEventInfoForm(this.form, this.eventInfo, false);
	}

	ngOnChanges(changes: SimpleChanges) {

		// if (_get(changes, 'touchedBefore.currentValue')) {
		// 	// Mark all form controls as touched before if parent say so.
		// 	this._touchControl(this.form);
		// }
		const changedEventInfo = _get(changes, ['eventInfo', 'currentValue']);
		if (changedEventInfo && differenceDeep.isDifference(this.eventInfo, changedEventInfo)) {
			updateEventInfoForm(this.form, changedEventInfo, true);
		}
	}

	ngOnDestroy() {
		this._subs.forEach(s => s.unsubscribe());
	}

	onEventImageResult(e: Slide[]) {
		this.form.patchValue(
			{
				image: e[0].image,
			},
			{
				emitEvent: true
			}
		);
	}

	onAddEmail() {
		const addEmailWin = createAddEmailDialogWindow(this._windowService);
		addEmailWin.componentRef.instance.submit.subscribe(res => {
			addEmailWin.destroy();
			this.form.patchValue(
				{
					email: res
				},
			);
		});
		addEmailWin.componentRef.instance.close.subscribe(res => {
			addEmailWin.destroy();
		});
		addEmailWin.open();
	}

	/**
	 * Mark a control and all its subcontrols as touched.
	 */
	private _touchControl(ac: AbstractControl) {
		ac.markAsTouched();
		if (ac instanceof FormGroup) {
			 Object.keys(ac.controls).map((k) => this._touchControl(ac.controls[k]));
		} else if (ac instanceof FormArray) {
			ac.controls.map((c) => this._touchControl(c));
		}
	}
}
