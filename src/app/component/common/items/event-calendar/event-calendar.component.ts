import { Component, Input, Output, OnInit, OnChanges, OnDestroy, AfterViewInit, ElementRef, ChangeDetectorRef, EventEmitter, ViewChild, Renderer2 } from '@angular/core';
import { SafeStyle, DomSanitizer } from '@angular/platform-browser';
import {
	get as _get,
	matches as _matches
} from 'lodash';
import {
	Subscription
} from 'rxjs';

import * as imageUrl from '@app-lib/functions/image-url';
import { Item, CommonItemContent,
		EventCalendarInfo,
		EventSetupInfo, EventInfo, EventActivities, SimpleEvent, EventContactInfo, ContactInfoField, EventMessage,
		Link } from '@app/models';

import { EventService } from '@app/services/event.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

@Component({
	moduleId: module.id,
	selector: 'event-calendar-item',
	templateUrl: './event-calendar.component.html',
	styleUrls: ['./event-calendar.component.css']
})

export class EventCalendarItemComponent implements OnInit, AfterViewInit, OnDestroy {
	@Input() item: Item;
	@Input() editable: boolean = true;

	@Output() outLink = new EventEmitter<Link>();
	@Output() itemChange = new EventEmitter<Item>();

	public eventCalendar: EventCalendarInfo;
	public eventActivities: any;
	public eventContactInfo: any;

	public events: EventSetupInfo[] = [];
	public loading: boolean = false;

	private _total = 0;
	private _callingAPI: Subscription;
	private _subs: Subscription[] = [];
	private _ele: HTMLElement;

	constructor (
		private _elementRef: ElementRef,
		private _eventService: EventService,
		private _windowService: WindowService,
		private _sanitizer: DomSanitizer
	) {
		this._ele = this._elementRef.nativeElement as HTMLElement;
	}

	ngOnInit() {
		this.eventCalendar = (this.item.content as CommonItemContent<EventCalendarInfo>).info.value;
		this.getEventCalendar();

		this._subs = [
			this._callingAPI,
		];
	}

	ngAfterViewInit() {
		// setTimeout(() => {
		// 	const height = this.item.content.box.height();
		// 	const eleHeight = (this.reviewContainer.nativeElement as HTMLElement).offsetHeight + 50;
		// 	if (height != eleHeight)
		// 		this.itemChange.emit(this.item.setContent(this.item.content.setBox(this.item.content.box.setBottom(this.item.content.box.top + eleHeight))));
		// });
	}

	ngOnDestroy() {
		this._subs.forEach(s => s.unsubscribe());
	}

	getEventCalendar(offset: number = 0, limit: number = 20) {
		this.refreshView(true);
		this._callingAPI = this._eventService.getEventCalendar(offset, limit, 'startDate').subscribe(
			(res) => {
				this._total = _get(res, 'total') || 0;
				this.events.push(...(_get(res, 'data') || []));
				this.refreshView();
			},
			error => {
				this.refreshView();
			},
		);
	}

	onCancelled() {
		if (!this._callingAPI) return;
		this._callingAPI.unsubscribe();
	}

	onScroll(e) {
		const eventsLength = this.events.length;
		const scrollHeight = e.srcElement.scrollHeight;
		const temp = this._ele.offsetHeight + e.srcElement.scrollTop;
		if (eventsLength < this._total && scrollHeight < temp) {
			this.getEventCalendar(this.events.length);
		}
	}

	changeEventSetupInfo(e: any, i) {
		this.events[i] = e;
	}

	refreshView(loading: boolean = false) {
		this.loading = loading;
		if (!this.loading && this._callingAPI) {
			this._callingAPI.unsubscribe();
			this._callingAPI = null;
		}
	}
}
