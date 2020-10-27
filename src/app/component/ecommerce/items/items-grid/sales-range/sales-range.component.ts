import { Component, Output, OnInit, EventEmitter, ElementRef, HostListener, ChangeDetectorRef, ViewChild } from '@angular/core';
import { DateRange } from "@app-ui/datetime-range/daterange";
import { DateTimeRangeComponent } from "@app-ui/datetime-range/datetime-range.component";
import { WindowService, DialogWindow } from "@app-common/window/window.service";

export function createNewSalesRangeWindow(windowService: WindowService): DialogWindow<SalesRangeComponent> {
	return windowService.create<SalesRangeComponent>(
		SalesRangeComponent,
		{
			width: 170,
			height: 175,
			modal: false,
			resizable: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.close.subscribe(() => window.close())
	});
}
@Component({
	moduleId: module.id,
	selector: 'sales-range',
	templateUrl: 'sales-range.component.html',
	styleUrls: ['sales-range.component.css']
})
export class SalesRangeComponent implements OnInit {
	private canClose: boolean;

	@Output() close = new EventEmitter<void>();

	@ViewChild('dateTimeRange') dateTimeRange: DateTimeRangeComponent;

	constructor(private el: ElementRef, private changeDetector: ChangeDetectorRef) {
	}

	ngOnInit() {
		this.resetSalesRange();
  	}

	public resetSalesRange(): void {
		this.dateTimeRange.value = DateRange.now();
		const lastYear = new Date();
		lastYear.setFullYear(lastYear.getFullYear() - 1);
		this.dateTimeRange.value.from = lastYear;
		this.changeDetector.detectChanges();
  	}

	public submit(): void {
		this.close.emit();
	}

	@HostListener('document:click', ['$event'])
	public onClick(event: MouseEvent) {
		if (!event.isTrusted) {
			return;
		}
		const srcElement = <Element>event.srcElement;
		const datePickerEvent = srcElement.className.includes('k-link');
		if (this.el.nativeElement.contains(event.target) || datePickerEvent) {
			return;
		}
		// We don't want the close event to be emitted after the first click,
		// which corresponds to the the Window display. 
		if (!this.canClose) {
			this.canClose = true;
			return;
		}
		this.canClose = false;
		this.close.emit();
	}
}