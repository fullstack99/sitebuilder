import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import * as Rx from 'rxjs/Rx';
import { User } from '@app/models';
import { AlertService } from '@app/services';

@Component({
    moduleId: module.id,
    selector: 'freelancer-account',
    templateUrl: './freelancer-account.component.html',
    styleUrls: ['./freelancer-account.component.css']
})
export class FreelancerAccountComponent implements OnInit, OnDestroy {

    @Input() info: User = new User;
    @Input() isNew: boolean = true;
    @Output() infoChange = new EventEmitter<User>();
    @Output() validityChange = new EventEmitter<boolean>();
    @Output() goLogin = new EventEmitter<boolean>();

    loading: boolean = false;
	  errorMessage: string = '';

    viewInited: boolean = false;
    private subs: Rx.Subscription[] = [];

    constructor(
        private changeDetector: ChangeDetectorRef,
        private alertService: AlertService
    ) {
    }

    ngOnInit() {
        this.subs = [
        ];

        this.viewInited = true;
    }

    onSubmit(event: User) {
        if (event) {
            if (!this.info) return;
            Object.keys(this.info).forEach(key=> {
                if (event[key])
                    this.info[key] = event[key];
            });
        }
        else {
            this.goLogin.emit(true);
        }
    }

    ngOnDestroy() {
        this.viewInited = false;
        this.subs.forEach(s => s.unsubscribe());
    }
}
