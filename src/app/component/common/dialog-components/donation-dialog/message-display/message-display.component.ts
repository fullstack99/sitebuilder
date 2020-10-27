import { Component, Input, Output, EventEmitter, ViewChild, ElementRef,
	OnInit, AfterViewInit, OnDestroy, OnChanges, SimpleChanges
	} from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import { ThankInfo } from '@app/models';

export interface MessageDisplayForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;		
		allowComment: FormControl;
	};
}

export function newMessageDisplayForm(v: ThankInfo): MessageDisplayForm {
	return <MessageDisplayForm>new FormGroup({		
		allowComment: new FormControl(v.allowComment)		
	});
}

@Component({
	moduleId: module.id,
	selector: 'fundraising-message-display',
	templateUrl: './message-display.component.html',
	styleUrls: [
		'./message-display.component.css',
		'../donation-dialog.component.css'		
	]
})

export class MessageDisplayComponent implements OnInit{

	@Input('thankYouBoxEnabled') thankYouBoxEnabled = new FormControl(false);
	@Input('form') form: MessageDisplayForm;
	
	@ViewChild('box') box: ElementRef;
	
	_subs: Rx.Subscription[] = [];

	ngOnInit() {
		if (!this.thankYouBoxEnabled.value) {
			$(this.box.nativeElement).slideUp("fast");
		}
		else {
			$(this.box.nativeElement).slideDown("fast");
		}
		
		this._subs=[
			this.thankYouBoxEnabled.valueChanges.subscribe(value=> {
				if (value)
					$(this.box.nativeElement).slideDown("slow");
				else
					$(this.box.nativeElement).slideUp("slow");
			})
		];
	}
	
	ngOnDestroy() {
		if (this._subs) {
			this._subs.forEach(s => s.unsubscribe());
		}
	}
}

