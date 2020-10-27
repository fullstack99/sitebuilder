import { Component, EventEmitter, Output, ChangeDetectorRef, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Validators, FormControl } from '@angular/forms';
import { Observable, Subject, Subscription } from 'rxjs/Rx';
import * as lodash from "lodash";
import * as differenceDeep from '@app-lib/functions/difference-deep';
import { createAttentionDialogWindow } from '@app-dialogs/attention-dialog/attention-dialog.component';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { AttentionInfo } from '@app/models';
import { ProductOption } from '@app-models/ecommerce/items';
import { AlertService, ProductService } from '@app/services';
import { WindowService, DialogWindow } from '@app-common/window/window.service';


export function createOptionLookUpWindow(
	windowService: WindowService,	
): DialogWindow<OptionLookUpComponent> {

	return windowService.create<OptionLookUpComponent>(
		OptionLookUpComponent,
		{
			modal: true,
			draggable: false,
			width: 360,
			height: 390,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	selector: 'option-lookup',
	templateUrl: './option-lookup.component.html',
	styleUrls: ['./option-lookup.component.css']
})
export class OptionLookUpComponent implements OnInit, AfterViewInit, OnDestroy {

	@Output() submit = new EventEmitter<ProductOption>();
	@Output() close = new EventEmitter<void>();

	filteredOptions: ProductOption[] = [];
	options: ProductOption[] = [];
	_loading: boolean = false;

	public search = new FormControl('');
	public selectedOption = new FormControl('', [Validators.required]);

	public viewInited: boolean = false;
	private callingAPI: Subscription;
	private subs: Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private productService: ProductService,
		private alertService: AlertService,
		private windowService: WindowService
	) {	}

	ngOnInit() {
		this.getOptions();
		this.subs = [
            this.search.valueChanges.subscribe(res => {
                this.filteredOptions = this.options.filter(i => {
                    if (this.search.value == '' || i.name.toString().toLowerCase().includes(this.search.value.toLowerCase()))
                        return true;
                });
                this.refreshView();
            }),
            this.selectedOption.valueChanges.subscribe((res) => {
				if (res)
					this.submit.emit(res);
            }),
        ];
	}

	ngAfterViewInit() {
		this.viewInited = true;
	}

	private getOptions() {
		this._loading = true;
		this.callingAPI = this.productService.getProductOptions().pipe().subscribe(
			res => {
				this._loading = false;
				this.options = lodash.orderBy(res, ['name']);
				this.options.forEach(o=> {
					if (this.filteredOptions.findIndex(f=>!differenceDeep.isDifference(o,f, ['id', 'sequence', 'optionValueId'])) < 0)
						this.filteredOptions.push(o);
				});
				if (this.viewInited)
					this.refreshView();
			},
			error => {
				this._loading = false;
				if (this.viewInited)
					this.refreshView();
				this.alertService.playToast('Error', 'There is an error from Server', 1);
			},
			() => {}
		);
	}

	getOptionValues(i: number) {
		let temp: string = '';
		let values = this.filteredOptions[i].productOptionValues.filter(v=>v.name.trim() != '');
		values.forEach((i, index) => {
			if (index)
				temp += ', ';
			temp += i.name;
		});
		return temp;
	}

	onDeleteOption(i: number) {
		const attentionWindow = createAttentionDialogWindow(
			this.windowService,
			new AttentionInfo(			
				{ value: 'WARNING!', font_size: '22px', color: '#8c8c8c' },
				[
					{ value: 'Do you want to delete the options?', font_size: '14px', color: '#8c8c8c' }
				],
				false,
            	['OK','CANCEL'],
				''
			));
        attentionWindow.componentRef.instance.submit.subscribe((feedback) => {
			attentionWindow.destroy();
			if (feedback) {
				this.productService.deleteMyProductOption(this.filteredOptions[i].id).pipe().subscribe(
					res => {
						if (res) {
							this.options = this.options.filter(o=>o!=this.filteredOptions[i]);
							this.onDeleteOptionFromOptions(this.filteredOptions[i]);
							this.filteredOptions.splice(i, 1);	
						}							
						this.refreshView();
					},
					error => {
						console.log('lllll', error);
						this.alertService.playToast('Error', 'Try again.', 1);
						this.refreshView();
					}
				)
			}            
		});
        attentionWindow.open();
	}

	onDeleteOptionFromOptions(option: ProductOption) {
		let temp = this.options.filter(f=>f.id != option.id && !differenceDeep.isDifference(option, f, ['id', 'sequence', 'optionValueId']));
		temp.forEach(t=> {
			this.productService.deleteMyProductOption(t.id).pipe().subscribe(
				res => {
					if (res) {
						this.options = this.options.filter(o=>o!=t);
					}
				},
				error => {
					console.log('lllll', error);			
				}
			)
		})
	}

	onCancelled() {
        if (!this.callingAPI) return;
        this.callingAPI.unsubscribe();
        this.refreshView();
    }
		
	openFeedbackDialog() {
		let feedbackWindow = createFeedbackDialogWindow(this.windowService, '');
		feedbackWindow.open();
	}

	refreshView(loading: boolean = false) {
        this._loading = loading;
        this.changeDetector.detectChanges();
    }

	onClose() {
		this.close.emit();
	}

	ngOnDestroy() {

	}
}