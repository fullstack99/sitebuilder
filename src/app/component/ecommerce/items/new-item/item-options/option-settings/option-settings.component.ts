import { Component, EventEmitter, Output, Input, ChangeDetectorRef } from '@angular/core';
import { createAttentionDialogWindow } from '@app-dialogs/attention-dialog/attention-dialog.component';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { AttentionInfo } from '@app/models';
import { ProductOption } from '@app-models/ecommerce/items';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createOptionSettingsWindow(
	windowService: WindowService,
	options: Array<ProductOption> = [],
	selectedSort: { [k: string]: string } = {}
): DialogWindow<OptionSettingsComponent> {

	return windowService.create<OptionSettingsComponent>(
		OptionSettingsComponent,
		{
			modal: true,
			draggable: false,
			width: 350,
			height: 250,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		options = options.filter(o=>o.name.trim() != '');		
		comp.options = options;
		comp.selectedSort = selectedSort;
		comp.deleteAllOptions.pipe().subscribe(() => window.close());
		comp.close.pipe().subscribe(() => window.close());
	});
}

@Component({
	selector: 'option-settings',
	templateUrl: './option-settings.component.html',
	styleUrls: ['./option-settings.component.css']
})
export class OptionSettingsComponent {

	@Input() options: Array<ProductOption> = [];
	@Input() selectedSort: { [k: string]: string } = {}

	@Output() sort = new EventEmitter<{ [k: string]: string }>();	
	@Output() deleteAllOptions = new EventEmitter<void>();
	@Output() close = new EventEmitter<void>();

	constructor(
		private changeDetector: ChangeDetectorRef,
		private windowService: WindowService
	) {	}

	public getSelectedOptionValue(option: ProductOption) {
		let optionName = 'optionValue' + option.sequence;		
		return !!this.selectedSort[optionName] ? this.selectedSort[optionName] : option.name;		
	}

	public getOptionValues(option: ProductOption) {
		let values = option.productOptionValues.filter(v=>v.name.trim() != '');
		return values.map(v=>v.name);
	}

	public onClear() {
		this.selectedSort = {};
		this.changeDetector.detectChanges();
		this.sort.emit(this.selectedSort);
	}

	public onDeleteAllOptions() {
		const attentionWindow = createAttentionDialogWindow(
			this.windowService,
			new AttentionInfo(			
				{ value: 'WARNING!', font_size: '22px', color: '#8c8c8c' },
				[
					{ value: 'Do you want to delete all the options?', font_size: '14px', color: '#8c8c8c' }					
				],
				false,
            	['OK','CANCEL'],
				''
			));        
        attentionWindow.componentRef.instance.submit.subscribe((feedback) => {
			if (feedback)
				this.deleteAllOptions.emit();
            attentionWindow.destroy();
		});		
        attentionWindow.open();
	}

	public changeSelected(event: any, i: number) {
		let optionName = 'optionValue' + i;
		this.selectedSort[optionName] = event;
		this.sort.emit(this.selectedSort);
	}

	openFeedbackDialog() {
		let feedbackWindow = createFeedbackDialogWindow(this.windowService, '');	
		feedbackWindow.open();
	}

	onClose() {
		this.close.emit();
	}
}