import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, Renderer } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Credentials } from '@app/models';
import { Messages } from '@app-shared/resources/messages';
import { passwordValid, valuesEqual } from '@app-lib/validators';

@Component({
	selector: 'app-change-password-form',
	templateUrl: './change-password-form.component.html',
	styleUrls: ['./change-password-form.component.css']
})
export class ChangePasswordFormComponent implements OnInit {
  
	@Input()
	set pending(isPending: boolean) {
		if (isPending) {
		this.form.disable();
		} else {
		this.form.enable();
		}
	}
  
	@Input() errorMessage: string | null;	
	
	@Output() submitted = new EventEmitter<any>();

	@ViewChild('progressEle') progressEle : ElementRef;

	progress = 0;

	form = this.formBuilder.group({
		['oldPassword']: ['', Validators.required],    
		['password']: ['', passwordValid],
		['confirmPassword']: ['']
	}, {
		validator: valuesEqual(
			'password',
			'confirmPassword',
			'confirmPassword'
		)(Messages.Validation.PasswordsNotEqual)
	});

	constructor(    
		private formBuilder: FormBuilder,
		private renderer: Renderer,
	) {
		this.form.valueChanges.subscribe(res=> {
			this.progress = 0;
			if (this.progressEle) {
				if (/\d/.test(res.password))
				this.progress += 20;
				if (/[!@#$%^&*]+/.test(res.password))
				this.progress += 20;
				if (/[a-z]+/.test(res.password)) {
				this.progress += 20;
				}          
				if (/[A-Z]+/.test(res.password))
				this.progress += 20;                  
				if (res.password.length >= 6)
				this.progress += 20;        
			}
		})    
	}

	ngOnInit() {} 
  
	submit() {
		if (this.form.valid) {
			this.submitted.emit(this.form.value);
		}
	}
}
