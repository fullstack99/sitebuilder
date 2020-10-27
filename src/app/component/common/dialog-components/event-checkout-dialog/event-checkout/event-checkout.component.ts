import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SafeStyle, DomSanitizer } from '@angular/platform-browser';
import { FormControl } from '@angular/forms';
import {
	get as _get
} from 'lodash';

import * as imageUrl from '@app-lib/functions/image-url';
import { ImagePath } from '@app/models';
import { EventSetupInfo, EventInfo, EventActivities, SimpleEvent, EventContactInfo, ContactInfoField, EventMessage, } from '@app/models';

import { WindowService } from '@app-common/window/window.service';

@Component({
	selector: 'event-checkout',
	templateUrl: './event-checkout.component.html',
	styleUrls: ['../event-checkout-dialog.component.css']
})
export class EventCheckoutComponent implements OnInit {

	@Input() eventSetupInfo: EventSetupInfo;

	constructor(
		private windowService: WindowService,
		private sanitizer: DomSanitizer
	) { }

	ngOnInit() {
	}

	backgroundImage(url: ImagePath): SafeStyle {
		return url && url.name ? this.sanitizer.bypassSecurityTrustStyle(imageUrl.imageSrcUrl(url)) : '';
	}
}
