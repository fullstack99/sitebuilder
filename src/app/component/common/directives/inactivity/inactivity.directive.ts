import { Directive, Input, Output, EventEmitter, HostListener } from '@angular/core';

import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/debounce';
import 'rxjs/add/operator/merge';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../../../../environments/environment';

/**
 * Inactivity directive
 */
@Directive({
  selector: '[inactivity]'
})
export class InactivityDirective {
	private mousemove = new EventEmitter();
	private mousedown = new EventEmitter();
	private keypress = new EventEmitter();
	private timeoutId: any;
	private timeoutWarningId: any;
	private interval: any;

	@Input() inactivity: boolean = true;
	@Input() inactivityTimeout: number = 15;
	@Input() inactivityWaringRange: number = 10;
	/**
	 * Inactivity interval (defaults 1 ms)
	 */
	@Input() inactivityInterval: number = 1;

	/**
	 * Inactivity callback after timeout
	 */
	@Output() inactivityCallback = new EventEmitter();

	/**
	 * Inactivity warning callback before timeout
	 */
	@Output() inactivityTimeoutWarning = new EventEmitter();

	@Output() inactivityReset = new EventEmitter();

	/**
	 * Attach a mouse move listener
	 */
	@HostListener('document:mousemove', ['$event'])
	onMousemove(event) {
		this.mousemove.emit(event);
	}

	@HostListener('document:mousedown', ['$event'])
	onMousedown(event) {
		this.mousedown.emit(event);
	}

	@HostListener('document:keypress', ['$event'])
	onKeypress(event) {
		this.keypress.emit(event);
	}

	constructor() {
		/*
		* Merge to flattens multiple Observables together
		* by blending their values into one Observable
		*/
		this.mousemove
			.merge(this.mousedown, this.keypress)

			/*
			* Debounce to emits a value from the source Observable
			* only after a particular time span
			*/
			.debounce(() => Observable.interval(this.inactivityInterval * 10))

			/*
			* Subscribe to handle emitted values
			*/
			.subscribe(() => {
				if (this.inactivity) {
					this.reset();
					this.start();
				}
			});
	}

	/**
	 * Start inactivity timer
	 */
	public start(): void {
		/**
		 * Inactivity callback if timeout (in second) is exceeded
		 */
		if (environment['test']) return;
		this.inactivityReset.emit();
		this.timeoutWarningId = setTimeout(() =>  this.warning(), (this.inactivityTimeout - 1 - this.inactivityWaringRange) * 1000);
		this.timeoutId = setTimeout(() =>  this.inactivityCallback.emit(true), this.inactivityTimeout * 1000);
	}

  	/**
	 * Reset inactivity timer
	 */
	public reset(): void {
		clearInterval(this.interval);
		clearTimeout(this.timeoutId);
		clearTimeout(this.timeoutWarningId);
	}

	/**
	 * Start Warning
	 */

	public warning():void{
		let time = this.inactivityWaringRange;
		this.interval = setInterval(() => {
			this.inactivityTimeoutWarning.emit(time);
			time -= 1;
			if (time == 0)
				clearInterval(this.interval);
		},1000);
	}
}
