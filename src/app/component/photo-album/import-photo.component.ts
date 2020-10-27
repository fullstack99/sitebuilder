import {
	Component, ElementRef, AfterViewInit, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output,
	SimpleChanges, ViewChild
} from '@angular/core';
import { RouterStateSnapshot } from '@angular/router';
import { ComponentCanDeactivate } from '@app/component/can-deactivate/component-can-deactivate';
import * as Rx from 'rxjs/Rx';

import { PageCanvasComponent } from '@app-common/page-canvas/page-canvas.component';
import { Page, ImagePath } from '@app/models';
import { AppService } from '@app/app.service';

@Component({
	moduleId: module.id,
	selector: 'import-photo',
	templateUrl: 'import-photo.component.html',
	styleUrls: ['import-photo.component.css']
})
export class ImportPhotoComponent extends ComponentCanDeactivate implements OnInit, OnDestroy {

	@ViewChild(PageCanvasComponent) public pageCanvas: PageCanvasComponent;

	public page: Page;
	private subs: Rx.Subscription[] = [];

	constructor(
		private appService: AppService
	) {
		super();
	}

	ngOnInit() {
		if (!this.appService._currentPage || this.appService._currentPage.service != 14) {
			this.page = this.appService.newPage();
		} else
			this.page = this.appService._currentPage;

		if (!!this.appService._themePage && (!this.appService._currentSite || this.appService._currentSite.roleId != 3)) {
			this.page.uid = '';
			// this.appService._changed = true;
		}

		this.subs = [
		];
	}

	canDeactivate(nextState: RouterStateSnapshot) {
		return this.appService._changed && (!nextState || nextState.url.indexOf(this.page.service + '/3') < 0);
	}

	processState(nextState: RouterStateSnapshot) {
		this.pageCanvas.onSave(nextState);
	}

	get isSaving(): boolean {
		return this.appService._changed;
	}

	get serviceToolActive() {
		return this.page.items.findIndex(item=>item.itemType == 'PhotoItem')>=0;
	}

	setCommand(command: string) {
		this.pageCanvas.clickCanvasTool(command);
	}

	ngOnDestroy() {
		this.subs.forEach(s => s.unsubscribe());
	}
}
