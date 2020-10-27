import {
  Component,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter
} from "@angular/core";
import { Store, select } from "@ngrx/store";
import {
  AuthService,
  AuthServiceConfig,
  FacebookLoginProvider,
  GoogleLoginProvider
} from "angular5-social-login";
import * as Rx from "rxjs/Rx";
import { createFeedbackDialogWindow } from "@app-dialogs/feedback-dialog/feedback-dialog.component";

import { Credentials, AccountType } from "@app/models";
import * as fromAuth from "@app-auth/store/reducers";
import * as Auth from "@app-auth/store/actions/auth";

import { WindowService, DialogWindow } from "@app-common/window/window.service";
import { AlertService } from "@app/services";
import { AppService } from "@app/app.service";


export function createLoginWindow(
  windowService: WindowService,
  isFreelancer: boolean = false,
  email: string = ''
): DialogWindow<LoginPageComponent> {
  return windowService
    .create<LoginPageComponent>(LoginPageComponent, {
      width: 420,
      position: {
        left: "calc(50% - 210px)",
        top: "50px"
      },
      maxHeight: 1000,
      modal: true,
      draggable: false,
      resizable: true,
      scrollable: false,
      visible: false,
      title: false
    })
    .changeInputs((comp, window) => {
      comp.isFreelancer = isFreelancer;
      comp.email = email;
      comp.window = window;
      comp.close.subscribe(() => window.close());
    });
}

@Component({
  moduleId: module.id,
  selector: "app-login-page",
  templateUrl: "./login-page.component.html",
  styleUrls: ["./login-page.component.css"]
})
export class LoginPageComponent implements OnInit, OnDestroy {
  @Input() isFreelancer: boolean = false;
  @Input() email: string = '';

  @Output() close = new EventEmitter<string>();
  @Output("window")  window: DialogWindow<LoginPageComponent>;

  private socialAuthService: AuthService;
  loading: boolean = false;
  errorMessage: string = "";
  loggedIn$ = this.store.pipe(select(fromAuth.getLoggedIn));
  passwordUpdated$ = this.store.pipe(select(fromAuth.getForgottenPasswordPageUpdated));
  pending$ = this.store.pipe(select(fromAuth.getLoginPagePending));
  error$ = this.store.pipe(select(fromAuth.getLoginPageError));


  constructor(
    private store: Store<fromAuth.State>,
    private changeDetector: ChangeDetectorRef,
    private alertService: AlertService,
    private appService: AppService,
    private windowService: WindowService
  ) {}

  private viewInited: boolean = false;
  private subs: Rx.Subscription[] = [];

  ngOnInit(): void {
    this.subs = [
      this.pending$.subscribe(res => {
        this.loading = res;
        if (this.loading) {
          this.setDisable();
        } else {
          this.setActive();
        }
        this.changeDetector.detectChanges();
      }),
      this.error$.subscribe(res => {
        if (res && this.viewInited) {
          // this.alertService.playToast('Failed', res, 1);
          this.errorMessage = res;
        }
      }),
      this.loggedIn$.subscribe(res => {
        if (res && this.viewInited) {
          this.alertService.playToast("Success", "You have logged in", 0);
          if (this.viewInited)
            this.onClose();
        }
      })
    ];
    this.viewInited = true;
  }

  socialSignIn(socialPlatform: string = "google") {
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

  setDisable() {
    this.window.kendoWindow.wrapper.css({
      "pointer-events": "none",
      background: "#CCC"
    });
  }

  setActive() {
    this.window.kendoWindow.wrapper.css({
      "pointer-events": "auto",
      background: "white"
    });
  }

  onSubmit(event: Credentials) {
    if (this.isFreelancer) event.accountType = AccountType.Freelancer;
    this.store.dispatch(
      new Auth.Login(
        event,
        this.appService._currentDashboardView == "freelancer"
      )
    );
  }

  onClose(): void {
    this.close.emit();
  }

  openFeedbackDialog() {
    createFeedbackDialogWindow(this.windowService, "lo.g.110").open();
  }

  ngOnDestroy() {
    ["ssIFrame_google", "fb-root"].forEach(s => {
      let ele = document.getElementById(s);
      if (ele) document.body.removeChild(ele);
    });
    this.subs.forEach(s => s.unsubscribe());
  }
}
