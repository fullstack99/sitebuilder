import { Component, Input, Output, EventEmitter, ChangeDetectorRef, OnInit, OnChanges, SimpleChanges,
		 OnDestroy
	   } from '@angular/core';
import { AbstractControl, FormGroup, FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import {
	get as _get,
	matches as _matches
} from 'lodash';

import * as differenceDeep from '@app-lib/functions/difference-deep';
import { EventContactInfo } from '@app/models';
import { ParticipantContactInfoForm } from '@app-dialogs/event-setup-dialog/event-contact-info/participant-contact-info/participant-contact-info.component';


/**
 * Form for `EventContactInfo`
 */
export class EventContactInfoForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;
		collectContactInfo		  : FormControl;
		addWhoseComing			  : FormControl;
		collectGroupMembersAndLeader: FormControl;
		participantContactInfo	  : ParticipantContactInfoForm;
		groupMemberContactInfo	  : ParticipantContactInfoForm;
		groupLeaderContactInfo	  : ParticipantContactInfoForm;
	};

	constructor(value: EventContactInfo) {
		super({
			collectContactInfo		  : new FormControl(value.collectContactInfo),
			addWhoseComing			  : new FormControl(value.addWhoseComing),
			collectGroupMembersAndLeader: new FormControl(value.collectGroupMembersAndLeader),
			participantContactInfo	  : new ParticipantContactInfoForm(value.participantContactInfo),
			groupMemberContactInfo	  : new ParticipantContactInfoForm(value.groupMemberContactInfo),
			groupLeaderContactInfo	  : new ParticipantContactInfoForm(value.groupLeaderContactInfo)
		});
	}

	updateValue(value: EventContactInfo, options: any) {
		const cs = this.controls;
		cs.collectContactInfo.setValue(value.collectContactInfo, options);
		cs.addWhoseComing.setValue(value.addWhoseComing, options);
		cs.collectGroupMembersAndLeader.setValue(value.collectGroupMembersAndLeader, options);
		cs.groupMemberContactInfo.updateValue(value.groupMemberContactInfo, options);
		cs.participantContactInfo.updateValue(value.participantContactInfo, options);
		cs.groupLeaderContactInfo.updateValue(value.groupLeaderContactInfo, options);
	}
}

/**
 * `EventContactInfoComponent`
 */
@Component({
	moduleId: module.id,
	selector: 'event-contact-info',
	templateUrl: './event-contact-info.component.html',
	styleUrls: ['./event-contact-info.component.css']
})
export class EventContactInfoComponent implements OnInit, OnChanges, OnDestroy {
	@Input() eventContactInfo: EventContactInfo = EventContactInfo.empty();

	@Output() eventContactInfoChange = new EventEmitter<EventContactInfo>();

	private _formChangesSub: Rx.Subscription;

	form: EventContactInfoForm;

	constructor(private _changeDetector: ChangeDetectorRef) {
		this.form = new EventContactInfoForm(EventContactInfo.empty());

		this._formChangesSub = this.form.valueChanges.subscribe((x) => {
			this.eventContactInfo = x;
			this.eventContactInfoChange.emit(x);
			this._changeDetector.detectChanges();
		});
	}

	ngOnInit() {
		this.form.updateValue(
			this.eventContactInfo,
			{ emitEvent: true }
		);
	}

	ngOnChanges(changes: SimpleChanges) {
		const changedEventContactInfo = _get(changes, ['eventContactInfo', 'currentValue']);
		if (changedEventContactInfo && differenceDeep.isDifference(this.eventContactInfo, changedEventContactInfo)) {
			this.form.updateValue(
				changedEventContactInfo,
				{ emitEvent: true }
			);
		}
	}

	ngOnDestroy() {
		this._formChangesSub.unsubscribe();
	}
}
