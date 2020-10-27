import { Component, ChangeDetectorRef, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, FormBuilder, Validators, Validator } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

//import { createForgetWindow } from '../forget/forget.component';

export function createExtraLoginWindow(windowService: WindowService): DialogWindow<ExtraLoginComponent> {
    return windowService.create<ExtraLoginComponent>(
        ExtraLoginComponent,
        {
            width: 400,
            position: {
                left: 'calc(50% - 200px)',
                top: '50px'
            },            
            maxHeight: 1000,
            modal: true,
            draggable: false,
            resizable: true,
            scrollable: false,
            visible: false,
            title: false
        }
    ).changeInputs((comp, window) => comp.closeEmitter.subscribe(() => window.close()));
}

@Component({
    moduleId: module.id,
    selector: 'extra-account-login',
    templateUrl: 'extra-account-login.component.html',
    styleUrls: ['extra-account-login.component.css']
})

export class ExtraLoginComponent implements OnInit {
    @Output('close') closeEmitter = new EventEmitter<void>();

    loginInfo: any = {};    
    loginForm: FormGroup;   

    public oauth2_client_id = '__YOUR_CLIENT_ID__';
    public oauth2_scopes = [
        'https://www.googleapis.com/auth/youtube'
    ];

    private _subs: Rx.Subscription[] = [];

    constructor(
        private fb: FormBuilder,
        private _changeDetector: ChangeDetectorRef,
        private windowService: WindowService       
    ) {              
    }

    ngOnInit() {
        this.loginForm = this.fb.group({
            email: ['',  [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]]
        });      

        this._subs=[
            this.loginForm.valueChanges.subscribe(() => {
                this._changeDetector.detectChanges();
            })
        ];        
    }    

    login() {        
        let OAUTH2_CLIENT_ID = '18532930955-5ltps6aj8qcjpieafbtf7qg6qf175dn5.apps.googleusercontent.com';
        let OAUTH2_SCOPES = [
            'https://www.googleapis.com/auth/youtube'
        ];
        // if (this.loginForm.isValid()) {
        //     let gapi = (window as any).gapi;
        //     console.log(gapi);
        //     gapi.auth.init(() => {
        //         gapi.auth.authorize({
        //             client_id: OAUTH2_CLIENT_ID,
        //             scope: OAUTH2_SCOPES,
        //             immediate: true
        //         }, (result: any) => {
        //             console.log(result);
        //         });
        //     });
        // }
        // else {
        //     console.log('aaaaa');            
        // }
        this._changeDetector.detectChanges();
    }   

    // loginSucceed(loginResult: LoginInfo) {    
    //     this.auth.auth(loginResult);
    //     this.onClose();
    // }

    initGoogle() {
        // let gapi = (window as any).gapi;
        // gapi.load('auth2', () => {
        //     // Retrieve the singleton for the GoogleAuth library and set up the client.
        //     (window as any).auth2 = gapi.auth2.init({
        //         client_id: LOGIN_KEYS.googleClientId,
        //         cookiepolicy: 'single_host_origin',
        //         // Request scopes in addition to 'profile' and 'email'
        //         // scope: 'additional_scope'
        //     });
        //     this.attachGoogleSignin();
        // });
    }

    attachGoogleSignin() {
        // let element = document.getElementById('googleSignInBtn');
        // (window as any).auth2.attachClickHandler(element, {}, (googleUser: any) => {
        //     console.log(googleUser.access_token);
        //     console.log('Signed in: ' + googleUser.getBasicProfile().getName());
        //     let gapi = (window as any).gapi;
        //     this.authService.setToken(
        //         gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token,
        //         { email: googleUser.getBasicProfile().getEmail(), password: '' },
        //         3600000,
        //         true
        //     );
        //     this.closeEmitter.emit(true);
        // }, (error: any) => {
        //     alert(JSON.stringify(error, undefined, 2));
        // });
    }

    onClose(): void {
        this.closeEmitter.emit(undefined);
    }

    loadLoginInfo(login: string, password: string, isSocial = false) {
        // TODO: Handle social login?
        // this.loginService(this.loginInfo.name, this.loginInfo.password, isSocial).then((loginResult) => {
        //     if (loginResult && loginResult.auth) {
        //         this.loginSucceed(loginResult);
        //     } else {
        //         console.log('wrong login/password');
        //         // TODO: Handler wrong login/pwd
        //     }
        // }).catch((reason) => {
        //     console.log('login error', reason);
        //     // TODO: Handle errors
        // });
    }
    
    forgot() {
        //createForgetWindow(this.windowService).open();
    }
}
