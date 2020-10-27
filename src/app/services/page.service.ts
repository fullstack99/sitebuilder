import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { Item } from '@app-models/index';

@Injectable()
export class PageService {

	public resizingSub = new Subject<Item>();
	public changedItemSub = new Subject<{command: string, item: Item }>();

	constructor() {
	}
}
