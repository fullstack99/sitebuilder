import { Component, OnInit, OnDestroy, ElementRef, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';
import { ComponentCanDeactivate } from '@app/component/can-deactivate/component-can-deactivate';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { Page } from '@app/models';
import { PageCanvasComponent } from '@app-common/page-canvas/page-canvas.component';
import { SchedulerService } from '@app/services';
import { AppService } from '@app/app.service';

@Component({
	moduleId: module.id,
	selector: 'appointment',
	templateUrl: './appointment.component.html',
	styleUrls: ['./appointment.component.css']
})
export class AppointmentComponent extends ComponentCanDeactivate implements OnInit, OnDestroy, OnChanges{

	@ViewChild(PageCanvasComponent) public pageCanvas: PageCanvasComponent;

	public page: Page;
	private subs: Rx.Subscription[] = [];

	constructor(
		private schedulerService: SchedulerService,
		private appService: AppService
	) {
		super();
	}

	ngOnInit() {
		if (!this.appService._currentPage || this.appService._currentPage.service != 23) {
			this.page = this.appService.newPage();
		} else {
			this.page = this.appService._currentPage;
		}

		if (!!this.appService._themePage && (!this.appService._currentSite || this.appService._currentSite.roleId != 3)) {
			this.page.uid = '';
			// this.appService._changed = true;
		}

		this.subs = [
		];
	}

	ngOnChanges(changes: SimpleChanges) {
	}

	canDeactivate(nextState: RouterStateSnapshot) {
		return this.appService._changed && (!nextState || nextState.url.indexOf(this.page.service + '/3') < 0);
	}

	processState(nextState: RouterStateSnapshot) {
		this.pageCanvas.onSave(nextState);
	}

	setCommand(command: string) {
		this.pageCanvas.clickCanvasTool(command);
	}

	get isSaving(): boolean {
		return this.appService._changed;
	}

	get serviceToolActive() {
		return this.page.items.findIndex(item=>item.itemType == 'AppointmentItem')>=0;
	}

	ngOnDestroy() {
		if (this.subs) {
			this.subs.forEach(s => s.unsubscribe());
		}
	}
}
