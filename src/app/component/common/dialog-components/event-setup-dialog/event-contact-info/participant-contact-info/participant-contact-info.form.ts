import { AbstractControl, FormGroup, FormArray, FormControl } from '@angular/forms';
import * as lodash from 'lodash';
import { ParticipantContactInfo, ContactInfoField, ContactInfoField2, SecondaryInfoField } from '@app/models';

/**
 * Form for `ContactInfoField`.
 */

export class ContactInfoFieldForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;
		name	: FormControl;
		choose  : FormControl;
		required: FormControl;
	};

	constructor(value: ContactInfoField) {
		super({
			name	: new FormControl(value.name	),
			choose  : new FormControl(value.choose  ),
			required: new FormControl(value.required)
		});
	}

	updateValue(value: ContactInfoField, options: any) {
		this.controls.name	.setValue(value.name	, options);
		this.controls.choose  .setValue(value.choose  , options);
		this.controls.required.setValue(value.required, options);
	}
}

export class ContactInfoField2Form extends FormGroup {
	controls: {
		[key: string]: AbstractControl;
		name: FormControl;
		choose: FormControl;
		required: FormControl;
		secondary: FormArray;
		width: FormControl;
		height: FormControl;
		tooltipCode: FormControl;
	};

	constructor(value: ContactInfoField2) {
		super({
			name: new FormControl(value.name),
			choose: new FormControl(value.choose),
			required: new FormControl(value.required),
			secondary: new FormArray(
				value.secondary.map(x => new SecondaryInfoFieldForm(x))
			),
			width: new FormControl(value.width),
			height: new FormControl(value.height),
			tooltipCode: new FormControl(value.tooltipCode)
		});
	}

	updateValue(value: ContactInfoField2, options: any) {
		this.controls.name.setValue(value.name, options);
		this.controls.choose.setValue(value.choose, options);
		this.controls.required.setValue(value.required, options);
		this.controls.secondary.controls.forEach((c, i) =>
			c.setValue(value.secondary[i], options)
		);
		this.controls.width.setValue(value.width, options);
		this.controls.height.setValue(value.height, options);
		this.controls.tooltipCode.setValue(value.tooltipCode, options);
	}
}

export class SecondaryInfoFieldForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;
		name: FormControl;
		value: FormControl;
	};

	constructor(value: SecondaryInfoField) {
		super({
			name: new FormControl(value.name),
			value: new FormControl(value.value)
		});
	}

	updateValue(value: SecondaryInfoField, options: any) {
		this.controls.name.setValue(value.name, options);
	}
}
/**
 * From for `ParticipantContactInfo`.
 */
export class ParticipantContactInfoForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;
		hasDefaultFields: FormArray;
		defaultFields: FormArray;
		customFields: FormArray;
	};

	constructor(value: ParticipantContactInfo) {
		super({
			hasDefaultFields: new FormArray(
				value.hasDefaultFields.map(x => x.secondary ? new ContactInfoField2Form(x) : new ContactInfoFieldForm(x))
			),
			defaultFields: new FormArray(
				value.defaultFields.map(x => new ContactInfoFieldForm(x))
			),
			customFields : new FormArray(
				value.customFields.map(x => new ContactInfoFieldForm(x))
			)
		});
	}

	updateValue(value: ParticipantContactInfo, options: any) {
		this.controls.hasDefaultFields.controls.forEach((c, i) =>
			c.setValue(value.hasDefaultFields[i], options)
		);
		this.controls.defaultFields.controls.forEach((c, i) =>
			c.setValue(value.defaultFields[i], options)
		);

		adjustControls(this.controls.customFields, value.customFields, x => new ContactInfoFieldForm(x), options );

		this.controls.customFields.controls.forEach((c, i) =>
			c.setValue(value.customFields[i], options)
		);
		this.updateValueAndValidity(options);
	}
}

export function adjustControls(formArray: FormArray, values: any, controlConstructor: (v: any) => any, options?: any) {
	if (values.length > formArray.length) {
		// Add controls.
		lodash.range(formArray.length, values.length)
			.forEach(i => formArray.push(controlConstructor(values[i])));
	} else if (values.length < formArray.length) {
		// Remove controls.
		lodash.range(values.length, formArray.length)
			.forEach(i => formArray.removeAt(i), options);
	}
}
