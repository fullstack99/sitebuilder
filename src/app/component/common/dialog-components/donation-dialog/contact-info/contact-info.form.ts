import { AbstractControl,  FormControl, FormGroup, FormArray } from '@angular/forms';
import { ContactInfo, ContactFieldInfo, SecondFieldInfo } from '@app/models';
/**
 * Form for `ContactInfoField`.
 */

export class ContactFieldInfoForm extends FormGroup {
    controls: {
        [key: string]: AbstractControl;
        name    : FormControl;
        isSelected: FormControl;
        isRequired: FormControl;
        fields: FormArray;
    };

    constructor(value: ContactFieldInfo) {
        super({
            name    : new FormControl(value.name),
            isSelected  : new FormControl(value.isSelected),
            isRequired: new FormControl(value.isRequired),            
            fields : new FormArray(
                value.fields.map(x => new SecondFieldInfoForm(x))
            )
        });
    }

    updateValue(value: ContactFieldInfo, options: any) {        
        this.controls.name    .setValue(value.name    , options);
        this.controls.isSelected  .setValue(value.isSelected  , options);
        this.controls.isRequired.setValue(value.isRequired, options);
        this.controls.fields.setValue(value.fields, options)
    }
}

export class SecondFieldInfoForm extends FormGroup {
    controls: {
        [key: string]: AbstractControl;
        name: FormControl;        
    };

    constructor(value: SecondFieldInfo) {
        super({
            name: new FormControl(value.name)            
        });
    }

    updateValue(value: SecondFieldInfo, options: any) {
        this.controls.name.setValue(value.name, options);
    }
}
/**
 * From for `ParticipantContactInfo`.
 */
export class ContactInfoForm extends FormGroup {
    controls: {
        [key: string]: AbstractControl;        
        defaultFields    : FormArray;
        customFields     : FormArray;        
    };

    constructor(value: ContactInfo) {
        super({            
            defaultFields: new FormArray(
                value.defaultFields.map(x => new ContactFieldInfoForm(x))
            ),            
            customFields : new FormArray(
                value.customFields.map(x => new ContactFieldInfoForm(x))
            )
        });
    }
}
