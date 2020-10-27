import { Component, OnInit, OnDestroy, ElementRef, OnChanges, SimpleChanges, ViewChild, Renderer, AfterViewInit, forwardRef } from '@angular/core';
import { RouterStateSnapshot } from '@angular/router';
import { ComponentCanDeactivate } from '@app/component/can-deactivate/component-can-deactivate';
import { Store } from "@ngrx/store";
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';

import {  Page } from '@app/models';

import { PageCanvasComponent } from '@app-common/page-canvas/page-canvas.component';
import { AppService } from '@app/app.service';

import { AppState } from '@app/stores/reducers';
import { SurveyState } from '@app/stores/reducers/survey/survey.reducer';

@Component({
	moduleId: module.id,
	templateUrl: 'survey.component.html',
	styleUrls: ['survey.component.css']
})
export class SurveyComponent extends ComponentCanDeactivate implements OnInit, OnDestroy, AfterViewInit, OnChanges {

	@ViewChild(PageCanvasComponent) public pageCanvas: PageCanvasComponent;

	public page: Page;
	  
	private currentSurvey: string = '';
	private subs: Rx.Subscription[] = [];

	constructor(
		private appService: AppService,
		private store:Store<AppState>
	) {
		super();
  }

	ngOnInit() {
		if (!this.appService._currentPage || this.appService._currentPage.service != 19) {
			this.page = this.appService.newPage();
		} else {
			this.page = this.appService._currentPage;
		}

		if (!!this.appService._themePage && (!this.appService._currentSite || this.appService._currentSite.roleId != 3)) {
			this.page.uid = '';
			// this.appService._changed = true;
		}
	}

	ngAfterViewInit() {
		this.subs = [
			// this.store.select('surveys')
			//	 .subscribe( (data: SurveyState ) => {
			//		 if (this.currentSurvey != data.current_survey) {
			//			 this.currentSurvey= data.current_survey;
			//			 this.page = this.appService.getPage(data.doc_id[data.current_survey]).getDef(new Page);
			//		 }
			//	 }),
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
		return this.page.items.findIndex(item=>item.itemType == 'SurveyItem')>=0;
	}

	get pageOption() {
		let surveyItem = this.page.items.find(item=>item.itemType == 'SurveyItem');
		if (surveyItem)
			return surveyItem.content['info']['value']['pageOption'];
		return 'single';
	}

	ngOnDestroy() {
		if (this.subs) {
			this.subs.forEach(s => s.unsubscribe());
		}
	}
}
