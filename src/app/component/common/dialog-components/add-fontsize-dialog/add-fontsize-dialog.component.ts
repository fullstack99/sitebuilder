import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import * as Rx from 'rxjs/Rx';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { WindowService, DialogWindow } from '@app-common/window/window.service';


export function createAddFontSizeDialogWindow(
	windowService: WindowService,	
): DialogWindow<AddFontSizeDialogComponent> {
	return windowService.create<AddFontSizeDialogComponent>(
		AddFontSizeDialogComponent,
		{
			width: 200,
			position: {
				left: 'calc(50% - 100px)',
				top: '50px'
			},
			modal: true,
			draggable: false,
			resizable: true,
			scrollable: true,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	templateUrl: 'add-fontsize-dialog.component.html',
	styleUrls: ['add-fontsize-dialog.component.css']
})
export class AddFontSizeDialogComponent implements OnInit, OnDestroy {
	
	@Output('submit') submit = new EventEmitter<number>();
	@Output('close') close = new EventEmitter<void>();

	public form: FormGroup;
	private subs: Rx.Subscription[] = [];

	constructor(
		private formBuilder: FormBuilder,
		private changeDetector: ChangeDetectorRef
	) {
		this.form = this.formBuilder.group({
            fontsize: ['', [Validators.required, Validators.min(8), Validators.max(100)]],
        });
	}

	ngOnInit() {
		this.subs = [
			this.form.valueChanges.subscribe(res => {
				this.changeDetector.detectChanges();
			})
		];
	}

	onKeydwon(event: KeyboardEvent) {
		if ([8, 46].indexOf(event.keyCode) < 0 && (event.keyCode < 48 || event.keyCode > 57))
			event.preventDefault();
	}

	onSubmit(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (this.form.invalid) return;
		this.submit.emit(this.form.value['fontsize']);
	}

	onClose(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this.close.next();
	}

	ngOnDestroy() {
		this.subs.forEach(sub => sub.unsubscribe());
	}
}
