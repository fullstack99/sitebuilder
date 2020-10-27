import { Injectable } from '@angular/core';
import { CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { WARNING_UNSAVED } from '@app-shared/constants';
import { Observable, Subject, Subscription, pipe } from 'rxjs';
import { concat, map, mapTo, switchMap } from 'rxjs/operators';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { createAttentionDialogWindow, AttentionInfo } from '@app-dialogs/attention-dialog/attention-dialog.component';

import { ComponentCanDeactivate } from './component-can-deactivate';


@Injectable()
export class CanDeactivateGuard implements CanDeactivate<ComponentCanDeactivate> {

	constructor(
		private windowService: WindowService
	) {

	}
	canDeactivate(
		component: ComponentCanDeactivate, 
		currentRoute: ActivatedRouteSnapshot,
		currentState: RouterStateSnapshot,
		nextState?: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
		if (component.canDeactivate(nextState)) {
			const attentionWindow = createAttentionDialogWindow(
				this.windowService,
				WARNING_UNSAVED);
			attentionWindow.open();

			return Observable.merge(
				attentionWindow.componentRef.instance.close.pipe(
					(mapTo(false))
				),
				attentionWindow.componentRef.instance.submit
					.pipe(
						map(feedback => {
							attentionWindow.destroy();
							if (feedback) {
								component.processState(nextState);
								return false;
							} else {
								return true;
							}
						})
					)
			);
		}
		return true;
	}
}
