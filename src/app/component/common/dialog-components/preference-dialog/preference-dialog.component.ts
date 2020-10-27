import { Component, Output, EventEmitter, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy, ElementRef, Input } from '@angular/core';
import { Validators, Validator, FormGroup, FormArray, FormControl, FormBuilder } from '@angular/forms';
import * as Rx from 'rxjs/Rx';

import { WindowService, DialogWindow } from '@app-common/window/window.service';

export { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createPreferenceDialogWindow(
	windowService: WindowService,
	namelist: string[]=[]
): DialogWindow<PreferenceDialogComponent> {
  return windowService.create<PreferenceDialogComponent>(
    PreferenceDialogComponent,
		{
			width: 320,
			minHeight: 300,
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
  ).changeInputs((comp, window) => {
		comp.namelist = namelist;
		comp.close.subscribe(() => window.close());
		comp.submit.subscribe(() => window.close());
  });
}

@Component({
	selector: 'app-preference-dialog',
  	templateUrl: './preference-dialog.component.html',
  	styleUrls: ['./preference-dialog.component.css']
})
export class PreferenceDialogComponent implements OnInit {
	@Input() namelist: string[] = [];

	@Output('close') close = new EventEmitter<void>();
	@Output('submit') submit = new EventEmitter<void>();
	
	public form: FormGroup;	
	public loading: boolean = false;
	private subs: Rx.Subscription[] = [];
	
	constructor(
		private elementRef: ElementRef,
		private changeDetector: ChangeDetectorRef,
		private formBuilder: FormBuilder,
        private windowService: WindowService        
	) {		
	}

	ngOnInit() {

		let keepMes: FormControl[] = this.namelist.map(element => new FormControl(false));

		this.form = this.formBuilder.group({			
			email  : new FormControl('', [Validators.required, Validators.email]),
			name   : new FormControl('', [Validators.required]),			
			keepMes : new FormArray(keepMes)
		});
		
		this.subs=[
			this.form.valueChanges.subscribe((value) => {				
				this.changeDetector.detectChanges();
			})
		]
	}

	get keepMes(): FormArray {
		return this.form.get('keepMes') as FormArray;
	};
	
	onClickKeepMe(event: MouseEvent) {
		event.stopPropagation();
	}

	onClose() {
        this.close.emit();
    }

    onSubmit() {
        this.submit.emit();
	}
	
	ngOnDestroy() {
        this.subs.forEach(s => s.unsubscribe());
    }
}
