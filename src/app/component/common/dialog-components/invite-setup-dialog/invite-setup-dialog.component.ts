import {
	Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, AfterViewInit,
	ViewChild, ElementRef, HostListener, Input, OnChanges, SimpleChanges
} from '@angular/core';
import { NG_VALIDATORS, Validators, Validator, AbstractControl, ValidatorFn} from '@angular/forms';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
	cloneDeep as _cloneDeep,
	get as _get,
	keysIn as _keysIn,
} from 'lodash';
import * as moment from 'moment';
import { Maybe } from '@app-lib/maybe/maybe';
import { AttentionDialogComponent, createAttentionDialogWindow, AttentionInfo } from '@app-dialogs/attention-dialog/attention-dialog.component';
import { dateTimeRangeRequiredValidator } from '@app-ui/datetime-range/datetime-range.module';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

import { InvitationInfo } from '@app/models';

import { WindowService, DialogWindow } from '@app-common/window/window.service';
export { WindowService, DialogWindow } from '@app-common/window/window.service';
/** */
export function createInviteSetupDialogWindow(
	windowService: WindowService,
	info: InvitationInfo = new InvitationInfo()

): DialogWindow<InviteSetupDialogComponent> {
	return windowService.create<InviteSetupDialogComponent>(
		InviteSetupDialogComponent,
		{
			width: 350,
			position: {
				left: 'calc(50% - 250px)',
				top: 'calc(10%)'
			},
			modal: true,
			draggable: false,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.info = info;
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
	});
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
	moduleId: module.id,
	templateUrl: 'invite-setup-dialog.component.html',
	styleUrls: ['invite-setup-dialog.component.css']
})
export class InviteSetupDialogComponent implements OnInit, OnDestroy, AfterViewInit {

	@Input() info: InvitationInfo = new InvitationInfo();

	@Output() close = new EventEmitter<void>();
	@Output() submit = new EventEmitter<InvitationInfo>();

	public setupEventForm : FormGroup;
	public viewInit = false;
	public _editor = Maybe.nothing<Tinymce.Editor>();
	public callSetColor: any;
	private subs: Subscription[] = [];

	constructor(
		private elementRef: ElementRef,
		private changeDetector: ChangeDetectorRef,
		private windowService: WindowService,
		fb: FormBuilder
	) {
		this.setupEventForm = fb.group({
			'eventName': fb.control('', [Validators.required]),
			'host': fb.control('', [Validators.required]),
			'startDate': fb.control(new Date, [Validators.required]),
			'endDate': fb.control(new Date),
			'rsvpByDate': fb.control(new Date(null)),
			'location': fb.control('', [Validators.required]),
			'address1': fb.control('', [Validators.required]),
			'city': fb.control('', [Validators.required]),
			'province': fb.control('', [Validators.required]),
			'postalCode': fb.control('', [Validators.required]),
			'phone': fb.control('', [Validators.pattern(/^(\+\d{1,3}[\s.-]?)?\(?\d{1,3}\)?[\s.-]?\d{1,3}[\s.-]?\d{1,4}$/)]),
			'guestLimit': fb.control(null),
			'allowGuests': fb.control(false),
			'textColor': fb.control('#8c8c8c')
		  });
	}

	ngOnInit() {
		this.setSetupEventForm(this.info);
		this.subs = [
			this.setupEventForm.controls['startDate'].valueChanges.subscribe(res => {
				const endDate = this.setupEventForm.controls['endDate'].value;
				if (res < new Date) {
					const attentionWindow = createAttentionDialogWindow(
						this.windowService,
						new AttentionInfo(
							{ value: 'WARNING!', font_size: '22px', color: '#8c8c8c' },
							[
								{ value: 'Event Date is over.', font_size: '18px', color: '#8c8c8c' },
							],
							true,
							['OK'],
							''
						));
					attentionWindow.componentRef.instance.submit.subscribe((feedback) => {
						attentionWindow.destroy();
					});
					attentionWindow.open();

					let toDate = new Date;
					toDate.setHours(toDate.getHours() + 2);
					this.setupEventForm.controls['startDate'].setValue(toDate, {eventEmit: false});
				}

				if (this.setupEventForm.controls['startDate'].value > endDate) {
					let toDate = new Date(this.setupEventForm.controls['startDate'].value);
					toDate.setHours(toDate.getHours() + 2);
					this.setupEventForm.controls['endDate'].setValue(toDate, {eventEmit: false});
				}
			}),

			this.setupEventForm.controls['endDate'].valueChanges.subscribe(res => {
				if (this.setupEventForm.controls['startDate'].value >= res ) {
					const attentionWindow = createAttentionDialogWindow(
						this.windowService,
						new AttentionInfo(
							{ value: 'WARNING!', font_size: '22px', color: '#8c8c8c' },
							[
								{ value: 'Event End Date is over.', font_size: '18px', color: '#8c8c8c' },
							],
							true,
							['OK'],
							''
						));
					attentionWindow.componentRef.instance.submit.subscribe((feedback) => {
						attentionWindow.destroy();
						const toDate = new Date(this.setupEventForm.controls['startDate'].value);
						toDate.setHours(toDate.getHours() + 2);
						this.setupEventForm.controls['startDate'].setValue(toDate, {eventEmit: false});
					});
					attentionWindow.open();
				}
			}),

			this.setupEventForm.controls['rsvpByDate'].valueChanges.subscribe(res => {
				if (new Date(this.setupEventForm.controls['startDate'].value) >= res ) {
					const attentionWindow = createAttentionDialogWindow(
						this.windowService,
						new AttentionInfo(
							{ value: 'WARNING!', font_size: '22px', color: '#8c8c8c' },
							[
								{ value: 'RSVP Date is over.', font_size: '18px', color: '#8c8c8c' },
							],
							true,
							['OK'],
							''
						));
					attentionWindow.componentRef.instance.submit.subscribe((feedback) => {
						attentionWindow.destroy();
						let toDate: Date;
						if (this.setupEventForm.controls['endDate'].value) {
							toDate = new Date(this.setupEventForm.controls['endDate'].value);
						} else {
							toDate = new Date(this.setupEventForm.controls['startDate'].value);
							toDate.setHours(toDate.getHours() + 2);
						}
						this.setupEventForm.controls['rsvpByDate'].setValue(toDate, {eventEmit: false});
					});
					attentionWindow.open();
				} else if (this.setupEventForm.controls['endDate'].value && new Date(this.setupEventForm.controls['endDate'].value) < res ) {

					const attentionWindow = createAttentionDialogWindow(
						this.windowService,
						new AttentionInfo(
							{ value: 'WARNING!', font_size: '22px', color: '#8c8c8c' },
							[
								{ value: 'You must set Response Date before End Date.', font_size: '18px', color: '#8c8c8c' },
							],
							true,
							['OK'],
							''
						));
					attentionWindow.componentRef.instance.submit.subscribe((feedback) => {
						attentionWindow.destroy();
						const toDate = new Date(this.setupEventForm.controls['endDate'].value);
						this.setupEventForm.controls['rsvpByDate'].setValue(toDate, {eventEmit: false});
					});
					attentionWindow.open();
				}
			}),

			this.setupEventForm.valueChanges.subscribe(() => {
				this.changeDetector.detectChanges()
			}),

		];
	}

	ngAfterViewInit() {
		this.viewInit = true;
		tinymce.init({
			plugins: 'textcolor colorpicker',
			skin_url: '/assets/styles/tinymce/skins/lightgray',
			selector: '#selectTextColor',
			branding: false,
			statusbar: false,
			menubar: false,
			max_height: 40,
			toolbar1: 'forecolor'

		}).then(editors => {
			this._editor = Maybe.just(editors[0]);
			this._editor.map(editor=> {
				editor.on('change', ev=> {
					this.setFormColor(editors[0].selection.getNode().style.color);
				});
			});
		});

		setTimeout(() => {
			$('.mce-container').css({
				width:'50px',
				border: 'none',
				background: 'transparent',
				height: '1px'
			});

			$('.edit-container').css({
				display: 'none'
			});

			$('#selectTextColor_ifr').css({
				height: '30px'
			});

			this.callSetColor = setInterval(() => {this.setTinyColor()}, 100);
		});
	}

	setTinyColor() {
		if (this._editor && this._editor.value) {
			this._editor.value.execCommand('Forecolor',false, this.setupEventForm.value['textColor']);
			clearInterval(this.callSetColor);
		} else if (!this.viewInit) {
			clearInterval(this.callSetColor);
		}
	}

	setFormColor(color: string) {
		this.setupEventForm.controls['textColor'].setValue(color);
	}

	setSetupEventForm(value: InvitationInfo) {
		this.setupEventForm.setValue({
			'eventName': value.eventName,
			'host': value.host,
			'startDate': !!value.startDate ? moment.utc(value.startDate).local().format() : '',
			'endDate': !!value.endDate ? moment.utc(value.endDate).local().format() : '',
			'rsvpByDate': !!value.rsvpByDate ? moment.utc(value.rsvpByDate).local().format() : '',
			'location': value.location,
			'address1': value.address1,
			'city': value.city,
			'province': value.province,
			'postalCode': value.postalCode,
			'phone': value.phone,
			'guestLimit': value.guestLimit,
			'allowGuests': value.allowGuests,
			'textColor': value.textColor
		});
	}

	onContainerClick(event: MouseEvent) {
		event.stopPropagation();
	}

	onClose() {
		this.close.emit();
	}

	onSubmit() {
		if (new Date(this.setupEventForm.value['startDate']) <= new Date) {
			const attentionWindow = createAttentionDialogWindow(
				this.windowService,
				new AttentionInfo(
					{ value: 'WARNING!', font_size: '22px', color: '#8c8c8c' },
					[
						{ value: 'Event Date is over.', font_size: '18px', color: '#8c8c8c' },
					],
					true,
					['OK'],
					''
				));
			attentionWindow.componentRef.instance.submit.subscribe((feedback) => {
				attentionWindow.destroy();
			});
			attentionWindow.open();
			return;
		}

		const keys = _keysIn(this.setupEventForm.value);
		keys.map(key => {
			this.info[key] = this.setupEventForm.value[key];
		});
		this.submit.emit(this.info);
	}

	openFeedbackDialog() {
		createFeedbackDialogWindow(this.windowService, 'wimi.120').open();
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
		this.viewInit = false;
		tinymce.remove();
	}
}
