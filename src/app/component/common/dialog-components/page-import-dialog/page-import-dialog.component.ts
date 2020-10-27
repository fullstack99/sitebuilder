import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

import { AlertService, SitemapService } from '@app/services';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { onErrorResumeNext } from 'rxjs/operator/onErrorResumeNext';

export function createPageImportDialogWindow(
	windowService: WindowService

): DialogWindow<PageImportDialogComponent> {
	return windowService.create<PageImportDialogComponent>(
		PageImportDialogComponent,
		{
			width: 320,
			position: {
				left: 'calc(50% - 160px)',
				top: '50px'
			},
			modal: true,
			draggable: true,
			resizable: true,
			scrollable: false,
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
	selector: 'page-import-dialog',
	templateUrl: './page-import-dialog.component.html',
	styleUrls: [
		'./page-import-dialog.component.css'
	  ]
})

export class PageImportDialogComponent implements OnInit, OnDestroy, AfterViewInit {

	@Output() submit = new EventEmitter<any>();
	  @Output() close = new EventEmitter<void>();

	public form: FormGroup;
	public loading: boolean = false;

	private callingAPI: Subscription;
	private subs: Subscription[] = [];

	constructor(
		private _fb: FormBuilder,
		private changeDetectorRef: ChangeDetectorRef,
		private alertService: AlertService,
		private sitemapService: SitemapService,
		private windowService: WindowService
	) {
		this.form = _fb.group({
			username: ['', [Validators.required, Validators.email]],
			password: ['', [Validators.required]],
			sitename: ['', [Validators.required, Validators.pattern('[\\w\\d]+\\.[\\w\\d-]+\\.[\\w\\d]+')]],
			allPages: [true],
			startPageNum: [''],
			endPageNum: [''],
		});
	}

	ngOnInit() {
		this.subs = [
			this.form.valueChanges.subscribe((x) => {
				this.changeDetectorRef.detectChanges();
			})
		];
	}

	ngAfterViewInit() {

	}

	eventHandler(event: any) {
		if ([8, 46, 190].indexOf(event.keyCode) < 0 && (event.keyCode < 47 || event.keyCode > 57)) {
			event.preventDefault();
			event.stopPropagation();
		}
		if (this.form.value.allPages)
			this.form.patchValue({allPages: false});
	}

	isValid() {
		if (this.form.invalid) return false;
		if (!this.form.value['allPages']) {
			if (this.form.value['startPageNum'] == '' || this.form.value['endPageNum'] == '') return false;
			return this.form.value['startPageNum'] <= this.form.value['endPageNum'];
		}
		return this.form.valid;
	}

	openFeedbackDialog() {
		const feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fund.001');
		feedbackWindow.open();
	}

	onSubmit() {
		const data = {
			username: this.form.value['username'],
			password: this.form.value['password'],
			sitename: this.form.value['sitename']
		};
		this.submit.emit(
			{
				username: this.form.value['username'],
				password: this.form.value['password'],
				sitename: this.form.value['sitename'],
				allPages: this.form.value['allPages'],
				startPageNum: !this.form.value['allPages'] && this.form.value['startPageNum'] ? parseInt(this.form.value['startPageNum']) : null,
				endPageNum: !this.form.value['allPages'] && this.form.value['endPageNum'] ? parseInt(this.form.value['endPageNum']) : null
			}
		);
	}

	onClose(event: MouseEvent) {
		this.close.emit();
	}

	refreshView(loading: boolean = false) {
		this.loading = loading;
		this.changeDetectorRef.detectChanges();
	}

	ngOnDestroy() {
		if (this.subs) {
			this.subs.forEach(s => s.unsubscribe());
		}
	}
}
