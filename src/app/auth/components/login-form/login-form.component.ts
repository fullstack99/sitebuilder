import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from "@angular/core";
import { FormGroup, FormBuilder } from "@angular/forms";
import {
  AuthService,
  AuthServiceConfig,
  FacebookLoginProvider,
  GoogleLoginProvider
} from "angular5-social-login";
import * as Rx from "rxjs/Rx";
import { Credentials, AccountType } from "@app/models";
import { emailValid, passwordValid } from "@app-lib/validators";
import { environment } from "@app-environments/environment";

@Component({
  selector: "app-login-form",
  templateUrl: "./login-form.component.html",
  styleUrls: ["./login-form.component.css"]
})
export class LoginFormComponent implements OnInit {
  @Input() isFreelancer: boolean = false;
  @Input() email: string = ''
  @Input() pending: boolean = false;
  @Input() errorMessage: string | null;

  @Output() submitted = new EventEmitter<Credentials>();
  @Output() forgotten = new EventEmitter<void>();

  @ViewChild("emailText")
  emailText: ElementRef;
  @ViewChild("passwordText")
  passwordText: ElementRef;

  form: FormGroup = this.formBuilder.group({
    ["email"]: ["", emailValid],
    ["password"]: ["", passwordValid],
    ["accountType"]: [AccountType.Regular]
  }); //system@glogood.com

  viewInited: boolean = false;
  private subs: Rx.Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subs = [
      this.form.valueChanges.subscribe(() => {
        this.changeDetector.detectChanges();
      })
    ];

    let user = JSON.parse(localStorage.getItem("current_user"));
    let data = {
      email: this.email ? this.email : user && user.email ? user.email : '',
      type: this.isFreelancer ? "freelancer" : "regular"
    };

    this.form.patchValue(data);
  }

  onKeyPress(event: KeyboardEvent, c: number = 1) {
    if (c == 1 && event.keyCode === 13) {
      (this.passwordText.nativeElement as HTMLElement).focus();
    }
  }

  onForgot() {
    this.forgotten.emit();
  }

  onSocialSignIn(socialPlatform: string = "google") {
    let socialPlatformProvider;
    if (socialPlatform == "facebook") {
      socialPlatformProvider = FacebookLoginProvider.PROVIDER_ID;
    } else if (socialPlatform == "google") {
      socialPlatformProvider = GoogleLoginProvider.PROVIDER_ID;
    }

    // this.socialAuthService.signIn(socialPlatformProvider).then(
    //     (userData) => {
    //         console.log(socialPlatform+" sign in data : " , userData);
    //     }
    // ).catch(err=> {
    //     console.log('error in the social login');
    // });
  }

  onSubmit() {
    if (this.form.valid) {
      this.submitted.emit(this.form.value);
    }
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }
}
