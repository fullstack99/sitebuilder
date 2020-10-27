import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Store, select } from "@ngrx/store";

import { Observable } from 'rxjs';
import { of } from 'rxjs/observable/of';
import { Subscription } from 'rxjs/Subscription';
import { merge } from 'rxjs/operators';
import * as lodash from 'lodash';

import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

import { User, AccountType } from "@app/models";
import { AlertService } from "@app/services";
import { AuthService } from "../../services/auth.service";
import * as fromAuth from "@app-auth/store/reducers";
import * as Auth from "@app-auth/store/actions/auth";

export function createForgottenPasswordWindow(
    windowService: WindowService,
    code: string = '',
    email: string = ''
  ): DialogWindow<ForgottenPasswordPageComponent> {
  return windowService.create<ForgottenPasswordPageComponent>(
		ForgottenPasswordPageComponent,
		{
			width: 360,
			position: {
				left: 'calc(50% - 180px)',
				top: '50px'
			},
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
  ).changeInputs((comp, window) => {
      comp.code = code;
      comp.email = email;
      comp.close.subscribe(() => window.close());
  });
}

@Component({
    moduleId: module.id,
    selector: 'app-forgotten-password-page',
    templateUrl: './forgotten-password-page.component.html',
    styleUrls: ['./forgotten-password-page.component.css']
})
export class ForgottenPasswordPageComponent implements OnInit, OnDestroy {

  @Input() code: string = '';
  @Input() email: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<string>();

  errorMessage: string = "";
  verificationSendPending$ = this.store.pipe(select(fromAuth.getForgottenPasswordPageVerificationPending));
  validationPending$ = this.store.pipe(select(fromAuth.getForgottenPasswordPageValidationPending));
  passwordUpdatePending$ = this.store.pipe(select(fromAuth.getForgottenPasswordUpdatePending));
  verificationSent$ = this.store.pipe(select(fromAuth.getForgottenPasswordPageVerificationSent));
  validated$ = this.store.pipe(select(fromAuth.getForgottenPasswordPageValidated));
  passwordUpdated$ = this.store.pipe(select(fromAuth.getForgottenPasswordPageUpdated));
  error$ = this.store.pipe(select(fromAuth.getForgottenPasswordPageError));

  @ViewChild("password")
  password: ElementRef;

  public blur: string = "";
  public sensitive: string = "";
  public isSensitive: boolean = false;
  public isNumber: boolean = false;
  public isLetter: boolean = false;
  public isCapital: boolean = false;
  public isSpecial: boolean = false;
  public isCharacters: boolean = false;
  public isMatch: boolean = false;
  public isValid: boolean = false;
  public passShow: boolean = false;

  emailControl: FormControl = new FormControl('', [Validators.required, Validators.email]);
  passwordControl: FormControl = new FormControl('', [Validators.required]);
  confirmPasswordControl: FormControl = new FormControl('', [Validators.required]);

  loading: boolean = false;
  isVerficationSent: boolean = false;
  isVerified: boolean = false;
  isChanged: boolean = false;
  viewInited: boolean = false;
  subs: Subscription[] = [];

  constructor(
    private store: Store<fromAuth.State>,
    private changeDetector: ChangeDetectorRef,
    private alertService: AlertService,
    private windowService: WindowService
  ) { }

  ngOnInit() {
    if (this.code) {
      this.store.dispatch(
        new Auth.ForgottenPasswordValidationSend(
          {
            code: this.code,
            email: this.email
          }
        )
      );
    }

    const pending$ = of(false).merge(
        this.verificationSendPending$,
        this.validationPending$,
        this.passwordUpdatePending$
    );

    this.subs = [
      this.verificationSent$.pipe().subscribe(res=> {
        this.isVerficationSent = res;
        if (res) {
          this.loading = false;
          this.alertService.playToast('Success', 'Now send an email for verification. Please check your email.');
          this.onClose();
        } else {
          this.changeDetector.detectChanges();
        }
      }),

      this.validated$.pipe().subscribe(res=> {
        this.isVerified = res;
        if (res) {
          this.loading = false;
        }
        this.changeDetector.detectChanges();
      }),

      this.passwordUpdated$.pipe().subscribe(res=> {
        this.isChanged = res;
        if (res) {
          this.loading = false;
          this.alertService.playToast('Success', 'Your password is changed. Please login with a new password.');
          this.submit.emit(this.email);
        } else {
          this.changeDetector.detectChanges();
        }
      }),

      this.error$.pipe().subscribe(res=> {
        if (res) {
          this.alertService.playToast(res.error ? res.error : 'Error', res.errorDescription ? res.errorDescription : 'You failed.', 1);
        }
      }),

      pending$.pipe().subscribe(res=> {
        if (res) {
          this.loading = true;
        }
        this.changeDetector.detectChanges();
      })
    ]
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  initials() {
    this.isValid = false;
    this.passShow = false;
    this.isMatch = false;
    this.isSensitive = false;
    this.isNumber = false;
    this.isLetter = false;
    this.isCharacters = false;
  }

  passwordShow() {
    this.passShow = !this.passShow;
    if (this.passShow) $(this.password.nativeElement).attr("type", "text");
    else $(this.password.nativeElement).attr("type", "password");
    this.checkValid();
  }

  checkValid(init: boolean = false) {
    this.isValid = false;

    if (!this.isVerified) {
      this.isValid = this.emailControl.valid;
      this.changeDetector.detectChanges();
      return;
    }

    if (this.sensitive == "password") {
      let password = this.passwordControl.value;
      this.isNumber = /\d/.test(password);
      this.isLetter = /[a-z]/.test(password);
      this.isCapital = /[A-Z]/.test(password);
      this.isSpecial = /[$@#!$%^()*]/.test(password);
      this.isCharacters = this.passwordControl.valid;
    }

    if (this.sensitive == "confirmPassword") {
      let confirmPassword = this.confirmPasswordControl.value;
      this.isNumber = /\d/.test(confirmPassword);
      this.isLetter = /[a-z]/.test(confirmPassword);
      this.isCapital = /[A-Z]/.test(confirmPassword);
      this.isSpecial = /[$@#!$%^()*]/.test(confirmPassword);
      this.isCharacters = this.confirmPasswordControl.valid;
      this.isMatch = confirmPassword == this.passwordControl.value;
    }

    if (this.passwordControl.valid && this.confirmPasswordControl.valid && (this.isMatch || (!this.isMatch && this.passShow)))
      this.isValid = true;
    this.changeDetector.detectChanges();
  }

  checkFocus(focus: string) {
    if (focus == "password" || focus == "confirmPassword") {
      this.sensitive = focus;
      this.checkValid();
    } else if (focus == "email") {
    }
  }

  openFeedbackDialog(): void {

  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.isVerified) {
      this.store.dispatch(
        new Auth.ForgottenPasswordUpdate(
          {
            code: this.code,
            email: this.email,
            newPassword: this.passwordControl.value
          }
        )
      )
    } else {
      this.store.dispatch(
        new Auth.ForgottenPasswordVerificationSend(
          this.emailControl.value
        )
      );
    }
  }
}
