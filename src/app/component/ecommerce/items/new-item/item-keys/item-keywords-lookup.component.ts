import { Component, EventEmitter, Output, ChangeDetectorRef, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Validators, FormControl } from '@angular/forms';
import { Observable, Subject, Subscription } from 'rxjs/Rx';
import {
	cloneDeep as _cloneDeep,
	get as _get,
	orderBy as _orderBy,
	sortedUniq as _sortedUniq,
} from 'lodash';
import * as differenceDeep from '@app-lib/functions/difference-deep';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { AlertService, ProductService } from '@app/services';
import { WindowService, DialogWindow } from '@app-common/window/window.service';


export function createProductKeywordsLookupWindow(
	windowService: WindowService,
	keywords: string[],
): DialogWindow<ItemKeywordsLookupComponent> {

	return windowService.create<ItemKeywordsLookupComponent>(
		ItemKeywordsLookupComponent,
		{
			modal: true,
			draggable: false,
			width: 320,
			height: 430,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.selectedKeywords = _cloneDeep(keywords);
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	selector: 'item-keywords-lookup',
	templateUrl: './item-keywords-lookup.component.html',
	styleUrls: ['./item-keywords-lookup.component.css']
})
export class ItemKeywordsLookupComponent implements OnInit, AfterViewInit, OnDestroy {

	@ViewChild('keywordsContainer') keywordsContainer: ElementRef;
	@Output() submit = new EventEmitter<string[]>();
	@Output() close = new EventEmitter<void>();

	keywords: any = []; // [{id, keyword}....]
	_loading = false;

	public keywordsContainerScroll = new Subject<void>();
	public search = new FormControl('');

	selectedKeywords: any = [];

	public viewInited = false;
	private total = 0;
	private callingAPI: Subscription;
	private subs: Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private productService: ProductService,
		private alertService: AlertService,
		private windowService: WindowService
	) {	}

	ngOnInit() {
		this.getKeywords();
		this.subs = [
			this.search.valueChanges.debounceTime(1500).subscribe(res => {
				this.getKeywords(0, 10, res);
			}),
			this.keywordsContainerScroll.subscribe(() => {
				const el = this.keywordsContainer.nativeElement as HTMLElement;
				if (el.scrollHeight - el.offsetHeight - el.scrollTop === 0 && this.keywords.length < this.total) {
					this.getKeywords(this.keywords.length, 10);
				}
			})

		];
	}

	ngAfterViewInit() {
		this.viewInited = true;
	}

	private getKeywords(skip: number = 0, take: number = 10, search: string = null) {
		this._loading = true;

		this.callingAPI = this.productService.getProductKeywords(false, skip, take, search).pipe().subscribe(
			res => {
				this._loading = false;
				const data = _get(res, ['data']) || [];
				this.total = _get(res, ['total']) || 0;

				if (skip === 0)
					this.keywords = data;
				else
					this.keywords = this.keywords.concat(data);

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

	onDeleteKeyword(k: {id: number, keyword: string}) {
		this.callingAPI = this.productService.deleteProductKeyword(false, k.keyword).pipe().subscribe(
			res => {
				const deletedKeywords = this.keywords.filter(i => i.keyword == k.keyword);

				this._loading = false;
				this.keywords = this.keywords.filter(i => i.keyword != k.keyword);

				if (deletedKeywords.length) {
					this.getKeywords(this.keywords.length, deletedKeywords.length);
				} else if (this.viewInited) {
					this.refreshView();
				}
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

	isSelected(keyword) {
		return this.selectedKeywords.findIndex(sk => sk.id === keyword.id) >= 0;
	}

	onCheck(event: any, index: number) {
		if (event.srcElement['checked'] === true && this.selectedKeywords.findIndex(sk => sk.id == this.keywords[index].id) < 0)
			this.selectedKeywords.push(this.keywords[index]);
		else if (event.srcElement['checked'] === false) {
			this.selectedKeywords = this.selectedKeywords.filter(i => i.id !== this.keywords[index].id);
		}
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

	onAdd() {
		this.submit.emit(this.selectedKeywords);
	}

	ngOnDestroy() {

	}
}