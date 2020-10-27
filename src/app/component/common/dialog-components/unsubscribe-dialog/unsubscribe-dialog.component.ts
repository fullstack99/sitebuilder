import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, ElementRef, Input } from '@angular/core';
import { Validators, Validator, FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { Subscription } from 'rxjs';

import { WindowService, DialogWindow } from '@app-common/window/window.service';

export { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createUnsubscribeDialogWindow(
	windowService: WindowService,
	namelist: string[]=[]
): DialogWindow<UnsubscribeDialogComponent> {
  return windowService.create<UnsubscribeDialogComponent>(
	UnsubscribeDialogComponent,
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
	selector: 'app-unsubscribe-dialog',
	templateUrl: './unsubscribe-dialog.component.html',
	styleUrls: ['./unsubscribe-dialog.component.css']
})
export class UnsubscribeDialogComponent implements OnInit, OnDestroy {
	@Input() namelist: string[] = [];

	@Output('close') close = new EventEmitter<void>();
	@Output('submit') submit = new EventEmitter<void>();

	public form: FormGroup;
	public loading: boolean = false;
	private subs: Subscription[] = [];

	constructor(
		private elementRef: ElementRef,
		private changeDetector: ChangeDetectorRef,
		private formBuilder: FormBuilder,
	) {
	}

	ngOnInit() {
		this.form = this.formBuilder.group({
			response  : new FormControl('', [Validators.required]),
			comments   : new FormControl('')
		});

		this.subs = [
			this.form.valueChanges.subscribe(() => {
				this.changeDetector.detectChanges();
			})
		]
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
