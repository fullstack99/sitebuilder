import {
	Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, OnChanges, SimpleChanges, ViewChild, Renderer,
	AfterViewInit, forwardRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from "@ngrx/store";
import { RouterStateSnapshot } from '@angular/router';
import { ComponentCanDeactivate } from '@app/component/can-deactivate/component-can-deactivate';

import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';

import { PageCanvasComponent } from '@app-common/page-canvas/page-canvas.component';

import { Page, CommonItemContent, EcommerceInfo } from '@app/models';
import { AppService } from '@app/app.service';

@Component({
	moduleId: module.id,
	templateUrl: 'ecommerce.component.html',
	styleUrls: ['ecommerce.component.css']
})
export class EcommerceComponent extends ComponentCanDeactivate implements OnInit, OnDestroy, OnChanges {

	@ViewChild(PageCanvasComponent) public pageCanvas: PageCanvasComponent;
		
	public page: Page;

	private subs: Rx.Subscription[] = [];

	constructor(		
		private route: ActivatedRoute,
		private appService: AppService		
	) { 
		super();
	}

	ngOnInit() {		
		if (!this.appService._currentPage || this.appService._currentPage.service != 20)
			this.page = this.appService.newPage();
		else {
			this.page = this.appService._currentPage;			
			if (!this.page.serviceObject) this.page.serviceObject = {}
			this.page.serviceObject['products'] = null;
			this.page.serviceObject['listings'] = null;			
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
		return this.page.items.findIndex(item=>item.itemType == 'EcommerceItem')>=0;
	}

	// get serviceMoreTool(): boolean {		
	//	 let serviceItem = this.page.items.find(item=>item.itemType == 'EcommerceItem');
	//	 if (!serviceItem) return false;
	//	 if (!serviceItem.content['info']) return false;		
	//	 return this.page.serviceObject.ecommLayoutType == 3;
	// }
		
	get showEcommNavMenu(): number { // 0: hidden, 1: Show, 2: Hide
		let serviceItem = this.page.items.find(item=>item.itemType == 'EcommerceItem');
		if (!serviceItem || !serviceItem.content['info']) return 1;
		if (serviceItem.content['info'].value['layoutType'] == 3) return 0;
		return serviceItem.content['info'].value['showNavigation'] ? 2 : 1;
	}

	ngOnDestroy() {
		if (this.subs) {
			this.subs.forEach(s => s.unsubscribe());
		}
	}
}