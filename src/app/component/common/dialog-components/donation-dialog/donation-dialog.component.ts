import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, SimpleChanges, OnDestroy, ViewChild, ChangeDetectorRef,ElementRef
	} from '@angular/core';

import { FormBuilder, FormGroup, FormArray, FormControl, Validators, AbstractControl } from '@angular/forms';
import * as lodash from 'lodash';
import * as Rx from 'rxjs/Rx';
import { Rect, Box } from '@app-lib/rect/rect';
import { Maybe } from '@app-lib/maybe/maybe';
import { Item, ItemType, ItemContent, CommonItemContent, 
		FundraisingInfo, FundraisingLevelInfo, DonationType, Num_Levels } from '@app/models';

import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { ContactInfoForm } from '@app-dialogs/donation-dialog/contact-info/contact-info.form';
import { MessageDisplayForm, newMessageDisplayForm } from '@app-dialogs/donation-dialog/message-display/message-display.component';
import { DedicationForm, newDedicationForm } from '@app-dialogs/donation-dialog/dedication/dedication.component';

import { FundraisingLevelForm, newFundraisingLevelForm, DonationLevelComponent } from '@app-dialogs/donation-dialog/donation-level/donation-level.component';

import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createDonationDialogWindow(
	windowService: WindowService,
	itemContent: CommonItemContent<FundraisingInfo> = new CommonItemContent<FundraisingInfo>(Maybe.just(new FundraisingInfo())),	
	width: number = 500,
	
): DialogWindow<DonationDialogComponent> {
	return windowService.create<DonationDialogComponent>(
		DonationDialogComponent,
		{
			width: width,
			height: '100%',
			modal: true,
			draggable: true,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.itemContent = itemContent;		
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

/**
 * Form type for `fundraisingInfo`
 */
interface FundraisingInfoForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;
		name: FormControl;
		startDate: FormControl;
		endDate: FormControl;
		fundraisingLevelsEnabled: FormControl;		
		fundraisingLevels: FormArray;
		optionalFundraisingAmountEnabled: FormControl;
			
		programDesignationsEnabled: FormControl;
		programDesignations: FormArray;

		dedicationEnabled: FormControl;
		dedication: DedicationForm;

		thankYouBoxEnabled: FormControl;
		thankYouBox: MessageDisplayForm;

		fundraisingFrequencyEnabled: FormControl;
		fundraisingFrequencyType: FormControl;

		contactInfoEnabled: FormControl;
		contactInfo: ContactInfoForm;

		// siteId: FormControl;
		// siteUid: FormControl;
		// userId: FormControl;
	};
}

function newFundraisingInfoForm(value: FundraisingInfo): FundraisingInfoForm {
	  
	return <FundraisingInfoForm>new FormGroup({
		name: new FormControl(value.name, [Validators.required, Validators.minLength(5)]),
		startDate: new FormControl(value.startDate),
		endDate: new FormControl(value.endDate),
		fundraisingLevelsEnabled: new FormControl(value.fundraisingLevelsEnabled),
		fundraisingLevels: new FormArray(value.fundraisingLevels.map(newFundraisingLevelForm)),
		optionalFundraisingAmountEnabled: new FormControl(value.optionalFundraisingAmountEnabled),

		programDesignationsEnabled: new FormControl(value.programDesignationsEnabled),
		programDesignations: new FormControl(value.programDesignations),
		
		dedicationEnabled: new FormControl(false),
		dedication: newDedicationForm(value.dedication),

		thankYouBoxEnabled: new FormControl(false),
		thankYouBox: newMessageDisplayForm(value.thankYouBox),

		fundraisingFrequencyEnabled: new FormControl(false),
		fundraisingFrequencyType: new FormControl(value.fundraisingFrequencyType),

		contactInfoEnabled: new FormControl(false),
		contactInfo: new ContactInfoForm(value.contactInfo)

		// siteId: new FormControl('0'),
		// siteUid: new FormControl('0'),
		// userId: new FormControl('0')
	});
}

@Component({
	moduleId: module.id,
	selector: 'donation-dialog',
	templateUrl: './donation-dialog.component.html',
	styleUrls: [
		'./donation-dialog.component.css'		
	  ]
})

export class DonationDialogComponent implements OnInit, OnDestroy, AfterViewInit {

	@Input('itemContent') itemContent: CommonItemContent<FundraisingInfo>;	
		
	@Output('submit') submit = new EventEmitter<CommonItemContent<FundraisingInfo>>();
	@Output('close') close = new EventEmitter<void>();   

	@ViewChild('fundraisingName') fundraisingName: ElementRef;	
	@ViewChild('placeButton') placeButton: ElementRef;

	public form: FundraisingInfoForm;

	private _subs: Rx.Subscription[] = [];
	   
	newFlag = 0;	   
		
	constructor(
		private formBuilder: FormBuilder,
		private elementRef: ElementRef,
		private changeDetector: ChangeDetectorRef,
		private windowService: WindowService
	) {
		this.form = newFundraisingInfoForm(new FundraisingInfo());
	}

	ngOnInit() {		
		this._updateForm(this.form, this.itemContent.info.value);
		this._subs = [
			this.form.valueChanges.subscribe((x) => {				
				this.changeDetector.detectChanges();
			})
		];	   
	}

	ngAfterViewInit() {		
		(this.elementRef.nativeElement as HTMLElement).parentElement.style.top = '10px';
		setTimeout(() => {			
			(this.fundraisingName.nativeElement as HTMLElement).focus();
		},500);
	}	 

	valueChange(event: any) {
		event.preventDefault();		
		// this.form.controls.donate.setValue(event.target.value, {});
	}

	eventHandler(event: any) {
		if (event.keyCode < 46 || event.keyCode > 57 || event.keyCode == 47) {
			event.preventDefault();
			event.stopPropagation();
		}
	}
		
	/**
	 * Mark a control and all its subcontrols as touched.
	 */
	// private _touchControl(ac: AbstractControl) {
	//	 ac.markAsTouched();
	//	 if (ac instanceof FormGroup) {
	//		Object.keys(ac.controls).map((k) => this._touchControl(ac.controls[k]));
	//	 } else if (ac instanceof FormArray) {
	//	   ac.controls.map((c) => this._touchControl(c));
	//	 }
	// }

	/**
	 * Form group validator which requires to controls with given keys to be equal.
	 * If they are not, the second control will be marked invalid.
	 */
	// private matchControls(k1: string, k2: string) {
	//	 return (group: FormGroup) => {
	//		 const c1 = group.controls[k1];
	//		 const c2 = group.controls[k2];
	//		 const k = k2 + 'NotEqual' + k1;
	//		 if (c1.value !== c2.value) {
	//			 let e = c2.errors || {};
	//			 e[k] = true;
	//			 c2.setErrors(e);
	//		 } else {
	//			 let e = c2.errors;
	//			 if (c2.errors) {
	//			   delete e[k];
	//			   // set errors to null if we deleted last one
	//			   c2.setErrors(<any>(Object.keys(e).length > 0 ? e : null));
	//			 }
	//		 }
	//	 };
	// }

	private _updateForm(form: FundraisingInfoForm, value: FundraisingInfo) {		
		// Recursively traverse `value` keys and update corresponding form controls.		
		const update = (ac: AbstractControl, val: { [key: string]: any } | any[] | any) => {
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
		this._adjustControls(value.fundraisingLevels, ctrls.fundraisingLevels, newFundraisingLevelForm);	   

		const val = Object.assign({}, value);
		update(form, val);		
	}

	private _adjustControls<T>(
		values: T[],
		formArray: FormArray,
		makeControl: (val: T) => AbstractControl
	) {
		if (values.length > formArray.length) {
			// Add controls.
			lodash.range(formArray.length, values.length)
				.forEach((i) => {
					const c = makeControl(values[i]);
					// Do not use `FromArray.push()` in order to not trigger parent update.
					formArray.controls.push(c);
					c.setParent(formArray);
				});
		} else if (values.length < formArray.length) {
			// Remove activity controls.
			lodash.range(values.length, formArray.length)
				.forEach((i) =>
					// Do not use `FromArray.removeAt()` in order to not trigger parent update.
					formArray.controls.splice(i, 1)
				);
		}
	}

	openFeedbackDialog() {
		let feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fund.001');			
		feedbackWindow.open();		
	}

	onSubmit(event: MouseEvent) {
		let info = this.form.value;
		let levels = info.fundraisingLevels.filter(level=>level.isActive==true && !!level.amount);		

		let width = info.fundraisingFrequencyEnabled ? 450 : info.dedicationEnabled || info.fundraisingLevelsEnabled ? Math.max(300, levels.length * 90) : 300;
		let top = Math.max(this.itemContent.box.top,10);

		// if (info.thankYouBoxEnabled)
		//	 width += 300;

		this.submit.emit(
			this.itemContent
				.setInfo(Maybe.just(info))
				.setBox(new Box(this.itemContent.box.left, this.itemContent.box.left + width, top, 100))
		);
	}

	onClose(event: MouseEvent) {
		this.close.emit();
	}	

	ngOnDestroy() {
		if (this._subs) {
			this._subs.forEach(s => s.unsubscribe());
		}  
	}
}
