import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges,
		 ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef
	   } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, AbstractControl } from '@angular/forms';
import {
	get as _get,
	matches as _matches,
	range as _range,
} from 'lodash';
import {
	Subscription
} from 'rxjs';

import * as differenceDeep from '@app-lib/functions/difference-deep';
import { SimpleEvent,
		 EventWithActivitiesSingleFee, EventWithParticipantTypes,
		 EventWithActivitiesMultiFee, EventActivityWithFee, EventActivity,
		 EventParticipantType, EventAdmission
	   } from '@app/models';
import {  EventAdmissionForm, newEventAdmissionForm } from '@app-dialogs/event-setup-dialog/event-activities/event-admission/event-admission.component';
import {  EventActivityForm, newEventActivityForm } from '@app-dialogs/event-setup-dialog/event-activities/event-activity/event-activity.component';
import { EventParticipantTypeForm, newEventParticipantTypeForm
	   } from '@app-dialogs/event-setup-dialog/event-activities/participant-type/participant-type.component';

type EventType =
	  'SimpleEvent'
	| 'EventWithActivities'
	| 'EventWithParticipantTypes';

type EventWithActivitiesType =
	  'EventWithActivitiesSingleFee'
	| 'EventWithActivitiesMultiFee';

type EventActivities = SimpleEvent | EventWithActivitiesSingleFee
						| EventWithActivitiesMultiFee | EventWithParticipantTypes;

/**
 * Type for storing any type of Event.
 */
interface EventActivitiesFormValue{
	eventType: EventType;
	eventWithActivitiesType: EventWithActivitiesType;
	admission: EventAdmission;
	activities: (EventActivity & EventActivityWithFee)[];
	participantTypes: EventParticipantType[];
}

/**
 * Form type for `EventActivitiesFormValue`.
 */
interface EventActivitiesForm extends FormGroup{
	controls: {
		[key: string]: AbstractControl;
		eventType: FormControl;
		eventWithActivitiesType: FormControl;
		admission: EventAdmissionForm;
		activities: FormArray;
		participantTypes: FormArray
	};
}

/**
 * Create and initialize new `EventActivitiesForm`.
 */
function newEventActivitiesForm(v: EventActivitiesFormValue): EventActivitiesForm {
	return <EventActivitiesForm>new FormGroup({
		eventType: new FormControl(v.eventType),
		eventWithActivitiesType: new FormControl(v.eventWithActivitiesType),
		admission: newEventAdmissionForm(v.admission),
		activities: new FormArray(v.activities.map(newEventActivityForm)),
		participantTypes: new FormArray(v.participantTypes.map(newEventParticipantTypeForm))
	});
}

@Component({
	moduleId: module.id,
	selector: 'event-activities',
	templateUrl: './event-activities.component.html',
	styleUrls: ['./event-activities.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventActivitiesComponent implements OnInit, OnChanges, OnDestroy {
	@Input() eventActivities: EventActivities;

	@Output() eventActivitiesChange = new EventEmitter<EventActivities>();

	form: EventActivitiesForm;

	private _formChangesSub: Subscription;

	constructor(
		private _formBuilder: FormBuilder,
		private _changeDetector: ChangeDetectorRef
	) {
		const defaultFormValue: EventActivitiesFormValue = {
			eventType: 'SimpleEvent',
			eventWithActivitiesType: 'EventWithActivitiesSingleFee',
			admission: EventAdmission.empty(),
			activities: [EventActivityWithFee.empty()],
			participantTypes: [EventParticipantType.empty()]
		};

		this.form = newEventActivitiesForm(defaultFormValue);

		this._formChangesSub = this.form.valueChanges.subscribe((x) => {
			this.eventActivities = x;
			this.eventActivitiesChange.emit(this._fromForm(x));
			this._changeDetector.detectChanges();

		});
	}

	ngOnInit() {
		this._updateForm(this.form, this.eventActivities);
	}

	/**
	 * Called when input property `eventActivities` is changed by parent.
	 */
	ngOnChanges(changes: SimpleChanges) {
		const changedEventActivities = _get(changes, ['eventActivities', 'currentValue']);
		if (changedEventActivities && differenceDeep.isDifference(this.eventActivities, changedEventActivities)) {
			this._updateForm(this.form, changedEventActivities);
		}
	}

	/**
	 * Events of type `SimpleEvent` or `EventWithActivitiesSingleFee`
	 * has single admission price.
	 */
	hasSingleAdmission() {
		const ctrls = this.form.controls;
		return ctrls.eventType.value === 'SimpleEvent'
			|| ctrls.eventType.value === 'EventWithActivities'
			&& ctrls.eventWithActivitiesType.value === 'EventWithActivitiesSingleFee';
	}

	/**
	 * Add new activity control to the `form`.
	 */
	addActivity() {
		this.form.controls.activities.push(
			newEventActivityForm(EventActivityWithFee.empty())
		);
	}

	/**
	 * Remove activity with the given index.
	 */
	removeActivity(i: number) {
		this.form.controls.activities.removeAt(i);
	}

	/**
	 * Add new participant type control to the `form`.
	 */
	addParticipantType() {
		this.form.controls.participantTypes.push(
			newEventParticipantTypeForm(EventParticipantType.empty())
		);
	}

	/**
	 * Remove participant type with the given index.
	 */
	removeParticipantType(i: number) {
		this.form.controls.participantTypes.removeAt(i);
	}

	/**
	 * Rearrange activities after Drag & Drop.
	 */
	onEventActivitiesDragEnd(newIndexes: number[]) {
		const newActivities: EventActivityForm[] =
			new Array(this.form.controls.activities.length);
		newIndexes.forEach((ni, i) => {
			newActivities[i + ni].setValue(this.form.controls.activities.at(i));
		});

		delete this.form.controls.activities;
		this.form.addControl('activities', new FormArray(newActivities));
	}

	/**
	 * Rearrange participant types after Drag & Drop.
	 */
	onParticipantTypesDragEnd(newIndexes: number[]) {
		const newParticipantTypes: EventParticipantTypeForm[] =
			new Array(this.form.controls.participantTypes.length);
		newIndexes.forEach((ni, i) => {
			newParticipantTypes[i + ni].setValue(this.form.controls.participantTypes.at(i));
		});

		delete this.form.controls.participantTypes;
		this.form.addControl('participantTypes', new FormArray(newParticipantTypes));
	}

	/**
	 * Convert `form` to one of `EventActivities` datatypes.
	 */
	private _fromForm(value: EventActivitiesFormValue): EventActivities {
		switch (value.eventType) {
			case 'SimpleEvent':
				return new SimpleEvent(value.admission);
			case 'EventWithActivities':
				switch (value.eventWithActivitiesType) {
					case 'EventWithActivitiesSingleFee':
						return new EventWithActivitiesSingleFee(
							value.admission, value.activities
						);
					case 'EventWithActivitiesMultiFee':
						return new EventWithActivitiesMultiFee(
							value.activities
						);
				}
			case 'EventWithParticipantTypes':
				return new EventWithParticipantTypes(value.participantTypes);
		}
	}

	/**
	 * Update form from `EventActivities` object
	 */
	private _updateForm(form: EventActivitiesForm, value: EventActivities) {
		// TODO: remove this when https://github.com/angular/angular/pull/9901 lands.
		// Recursively traverse `value` keys and update corresponding form controls.
		const update = (ac: AbstractControl, val: {[key: string]: any} | any[] | any) => {
			if (ac instanceof FormArray && val instanceof Array) {
				(<any[]>val).forEach((v, i) => {
					update(ac.at(i), v);
				});
			} else if (ac instanceof FormGroup) {
				Object.keys(val)
					.forEach((k) => {
						const v = val[k];
						const c = ac.controls[k];
						if (c instanceof AbstractControl) {
							update(c, v);
						}
					});
			} else if (ac instanceof FormControl) {
				if (ac.value !== val) {
					ac.setValue(val, { emitEvent: false });
				}
			}
		};

		const ctrls = form.controls;
		switch (value.eventType) {
			case 'SimpleEvent':
				ctrls.eventType.setValue('SimpleEvent', { emitEvent: false });
				break;
			case 'EventWithActivitiesSingleFee':
				ctrls.eventType.setValue('EventWithActivities', { emitEvent: false });
				ctrls.eventWithActivitiesType.setValue('EventWithActivitiesSingleFee', { emitEvent: false });
				this._adjustControls(value.activities, ctrls.activities, newEventActivityForm);
				break;
			case 'EventWithActivitiesMultiFee':
				ctrls.eventType.setValue('EventWithActivities', { emitEvent: false });
				ctrls.eventWithActivitiesType.setValue('EventWithActivitiesMultiFee', { emitEvent: false });
				this._adjustControls(value.activities, ctrls.activities, newEventActivityForm);
				break;
			case 'EventWithParticipantTypes':
				ctrls.eventType.setValue('EventWithParticipantTypes', { emitEvent: false });
				this._adjustControls(value.participantTypes, ctrls.participantTypes, newEventParticipantTypeForm);
				break;
		}

		// Do not update `eventType` with update function.
		const val = Object.assign({}, value);
		delete val.eventType;
		update(form, val);
	}

	/**
	 * Adjust the number of controls in given `FormArray` to be equal to
	 * the number of values by removing controls or creating them with the given
	 * function. 
	 */
	private _adjustControls<T>(
		values: T[],
		formArray: FormArray,
		makeControl: (val: T) => AbstractControl
	) {
		if (values.length > formArray.length) {
			// Add controls.
			_range(formArray.length, values.length)
				.forEach((i) => {
					const c = makeControl(values[i]);
					// Do not use `FromArray.push()` in order to not trigger parent update.
					formArray.controls.push(c);
					c.setParent(formArray);
				});
		} else if (values.length < formArray.length) {
			// Remove activity controls.
			_range(values.length, formArray.length)
				.forEach((i) =>
					// Do not use `FromArray.removeAt()` in order to not trigger parent update.
					formArray.controls.splice(i, 1)
				);
		}
	}

	ngOnDestroy() {
		this._formChangesSub.unsubscribe();
	}
}
