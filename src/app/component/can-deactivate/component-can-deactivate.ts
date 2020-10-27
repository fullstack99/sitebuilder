import {HostListener} from "@angular/core";
import { RouterStateSnapshot } from '@angular/router';

export abstract class ComponentCanDeactivate { 
	abstract canDeactivate(nextState: RouterStateSnapshot): boolean;
	abstract processState(nextState: RouterStateSnapshot): void;

	@HostListener('window:beforeunload', ['$event'])
	unloadNotification($event: any) {
		if (this.canDeactivate(null)) {
			$event.returnValue = true;
		}
	}
}