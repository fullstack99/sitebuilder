import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class AlertService {
	constructor(
		private toastrService: ToastrService
	) { }
	
	playToast(title: string, msg: string, successFlag: number = 0, timeout: number = 3000) {
		if (successFlag == 0)
			this.toastrService.success(msg, title,{ closeButton: true, timeOut: timeout });
		else if (successFlag == 1)
			this.toastrService.error(msg, title,{ closeButton: true, timeOut: timeout });
		else if (successFlag == 2)
			this.toastrService.warning(msg, title,{ closeButton: true, timeOut: timeout });
	}
}
