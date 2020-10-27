import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from "@angular/common/http";
import { Store, select } from "@ngrx/store";

import * as Rx from 'rxjs/Rx';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UserSite } from '@app/models';
import { hostValid, sitenameValid } from '@app-lib/validators';
import { Messages } from '@app-shared/resources/messages';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

import * as fromAuth from "@app-auth/store/reducers";
import * as Auth from "@app-auth/store/actions/auth";

import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { AlertService } from '@app/services';
import { AppService } from '@app/app.service';


export function createNewSiteDialogWindow(
	windowService: WindowService,
): DialogWindow<NewSiteDialogComponent> {
	return windowService.create<NewSiteDialogComponent>(
		NewSiteDialogComponent,
		{
			width: 320,
			position: {
				left: 'calc(50% - 160px)',
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
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	templateUrl: 'new-site-dialog.component.html',
	styleUrls: ['new-site-dialog.component.css']
})
export class NewSiteDialogComponent implements OnInit, OnDestroy {

	@Output() submit = new EventEmitter<UserSite>();
	@Output() close = new EventEmitter<void>();

	public form: FormGroup;
	public loading: boolean = false;
  public errorMessage: string | null;

  authUpdatePending$ = this._store.pipe(select(fromAuth.getUpdatePending));
  authUpdated$ = this._store.pipe(select(fromAuth.getUpdated));
  authError$ = this._store.pipe(select(fromAuth.getAuthError));

  viewInited: boolean = false;

	private subs: Rx.Subscription[] = [];

	constructor(
    private _store: Store<fromAuth.State>,
		private formBuilder: FormBuilder,
		private changeDetector: ChangeDetectorRef,
		private windowService: WindowService,
		private alertService: AlertService,
		private appService: AppService
	) {
		this.form = this.formBuilder.group({
            name : ['', [Validators.required, sitenameValid]]
        });
	}

	ngOnInit() {
		this.subs = [
			this.form.valueChanges.subscribe(res => {
				this.refreshView();
      }),
      this.authUpdated$
        .pipe()
        .subscribe((res) => {
          if (!this.viewInited || !res) return;
          this.alertService.playToast('Success', 'Your site was created successfully.');
          this.onClose();
      }),

      this.authError$
        .pipe()
        .subscribe((res) => {
          if (!this.viewInited) return;
          if (res) {
            this.alertService.playToast(res['error'], res['errorDescription'], 1);
          }
      })
    ];
    this.viewInited = true;
	}

	onSubmit() {
    if (this.form.invalid) return;
    this._store.dispatch(new Auth.AddUserSite(this.form.value));
	}

	onClose() {
		this.close.next();
	}

	openFeedbackDialog() {
		let feedbackWindow = createFeedbackDialogWindow(this.windowService, '');
		feedbackWindow.open();
	}

	refreshView(loading: boolean = false) {
		this.loading = loading;
		this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
    this.viewInited = false;
  }
}
