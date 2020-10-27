import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, AbstractControl, FormArray } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import * as moment from 'moment';
import * as differenceDeep from '@app-lib/functions/difference-deep';
import { ServiceTimeInfo, HourInfo } from '@app/models';
import { AlertService } from '@app/services';

@Component({
	moduleId: module.id,
	selector: 'day-time',
	templateUrl: './day-time.component.html',
	styleUrls: ['./day-time.component.css']
})
export class DayTimeComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
	@Input() day: string = "Sunday";
	@Input() defaultData: string = 'Closed';
	@Input() timeInfo: ServiceTimeInfo[] = [];
	@Input() timeRefresh: Rx.Subject<number>;
	@Input() n: number = 0;

	@Output() infoChange = new EventEmitter<ServiceTimeInfo[]>();
	@Output() close = new EventEmitter<void>();

	formArray: FormArray;
	cloneTime: ServiceTimeInfo[] = [];

	min: string = '8:00';
	max: string = '19:00';

	private settingValue: boolean = false;
	private viewInited: boolean = false;
	private subs: Rx.Subscription[] = [];

	constructor(
		private formBuilder: FormBuilder,
		private changeDetector: ChangeDetectorRef,
		private alertService: AlertService
	) {
	}

	ngOnInit() {
		this.cloneTime = lodash.cloneDeep(this.timeInfo);
		this.settingValue = true;

		if (this.timeInfo && this.timeInfo.length > 0) {
			let times = [this.newForm(this.timeInfo[0])];
			for (let i=1; i<this.timeInfo.length; i++) {
				if (moment(this.timeInfo[i].startTime, 'HH:mm') > moment(this.timeInfo[i-1].endTime, 'HH:mm'))
					times.push(this.newForm(new ServiceTimeInfo(this.timeInfo[i-1].endTime, this.timeInfo[i].startTime),false));
				times.push(this.newForm(this.timeInfo[i]))
			}
			this.formArray = this.formBuilder.array(times);
		}
		else {
			this.formArray = this.formBuilder.array([]);
		}

		this.subs = [
			this.formArray.valueChanges.subscribe((res) => {
				if (this.settingValue || !this.viewInited) {
					return;
				}
				this.cloneTime = [];
				res.forEach(time=> {
					if (time.open) {
						let sTime: any = (time.startTime instanceof Date) ? moment(time.startTime).format('HH:mm') : moment(time.startTime, 'hh:mm A').format('HH:mm');
						let eTime: any = (time.endTime instanceof Date) ? moment(time.endTime).format('HH:mm') : moment(time.endTime, 'hh:mm A').format('HH:mm');
						this.cloneTime.push(new ServiceTimeInfo(sTime, eTime));
					}
				});
				console.log(this.cloneTime);

				if (differenceDeep.isDifference(this.timeInfo, this.cloneTime)) {
					this.infoChange.emit(this.cloneTime);
				}
				this.changeDetector.detectChanges();
			}),
			this.timeRefresh.subscribe(n=> {
				if (this.n == n)
					this.refreshFormArray();
			})
		];
		this.settingValue = false;
	}

	ngAfterViewInit() {
		this.viewInited = true;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (this.viewInited && changes['timeInfo']) {
			if (!lodash.isEqual(this.timeInfo, this.cloneTime)) {
				this.refreshFormArray();
			}
		}
	}

	refreshFormArray() {
		this.settingValue = true;
		this.onClosed(null, -1);
		setTimeout(() => {
			if (!this.viewInited) return;
			this.cloneTime = lodash.cloneDeep(this.timeInfo);
			if (this.cloneTime && this.cloneTime.length > 0)
				this.cloneTime.forEach(item=> {
					this.formArray.push(this.newForm(item));
				});
			this.changeDetector.detectChanges();
			this.settingValue = false;
		})
	}

	newForm(info: ServiceTimeInfo = new ServiceTimeInfo, open: boolean = true) {
		return this.formBuilder.group({
			startTime: [moment(info.startTime, 'HH:mm').format('hh:mm A')],
			endTime: [moment(info.endTime, 'HH:mm').format('hh:mm A')],
			open: [open]
		});
	}

	onOpen(event: MouseEvent, i: number = -1) {
		event.preventDefault();
		event.stopPropagation();
		if (i>=0)
			this.formArray.controls[i].patchValue({open: true});
		else
			this.formArray.push(this.newForm());
	}

	onClosed(event: MouseEvent, i: number = 0) {
		if (!this.formArray) return;
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		if (i==-1) {
			while (0 !== this.formArray.length) {
				this.formArray.removeAt(0);
			}
			return;
		}

		let start = moment(this.formArray.controls[i].value['startTime'], 'hh:mm A');
		let end = moment(this.formArray.controls[i].value['endTime'], 'hh:mm A');

		if (start <= moment(this.min, 'HH:mm') && end >= moment(this.max, 'HH:mm'))
			while (0 !== this.formArray.length) {
				this.formArray.removeAt(0);
			}

		if (i>0 && !this.formArray.controls[i-1].value['open']) {
			start = moment(this.formArray.controls[i-1].value['startTime'], 'hh:mm A');
			this.formArray.controls[i].patchValue({startTime: start});
			this.formArray.removeAt(i-1);
		}

		let j=i+1;
		while(j<this.formArray.length) {
			if (end >= moment(this.formArray.controls[j].value['endTime'], 'hh:mm A')) {
				this.formArray.removeAt(j);
			}
			else if (end > moment(this.formArray.controls[j].value['startTime'], 'hh:mm A')) {
				this.formArray.controls[j].patchValue({startTime: lodash.cloneDeep(this.formArray.controls[i].value['endTime'])});
				j++;
			}
			else {
				j++;
			}
		}

		if (this.formArray.controls[i])
			this.formArray.controls[i].patchValue({open: false});
	}

	isMore() {
		if (this.formArray.length > 0 && moment(this.max, 'HH:mm') <= moment(this.formArray.controls[this.formArray.length-1].value['endTime'], 'hh:mm A')) {
			return false;
		}
		return true;
	}

	onMore(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		let serviceTime = new ServiceTimeInfo();
		if (this.formArray.length > 0)
			serviceTime.startTime = moment(this.formArray.controls[this.formArray.length-1].value['endTime'], 'hh:mm A').format('HH:mm');
		this.formArray.push(this.newForm(serviceTime));
	}

	onRemove(event: MouseEvent, index: number) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		if (this.formArray.length == 1) return;
		this.formArray.removeAt(index);
	}

	getMin(i: number) {
		if (i<=0) {
			return moment(this.min, 'HH:mm').toDate();
		}
		else {
			return moment(this.formArray.controls[i-1].value['endTime'], 'hh:mm A').toDate();
		}
	}

	getMax(i: number) {
		return moment(this.max, 'HH:mm').toDate();
	}

	ngOnDestroy() {
		this.viewInited = false;
		this.subs.forEach(s => s.unsubscribe());
	}
}
