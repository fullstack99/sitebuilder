import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
	OnChanges, OnDestroy, SimpleChanges, ViewChild, AfterViewInit, Renderer, HostBinding,
	ChangeDetectionStrategy, HostListener
} from '@angular/core';
import * as lodash from 'lodash';
import * as Rx from 'rxjs/Rx';
import { Maybe } from '@app-lib/maybe/maybe';
import { updateArrayAt, moveArrayElements, padArray, withArray } from '@app-lib/array/array';
import { createSurveyDialogWindow, SurveyDialogComponent } from '@app-dialogs/survey-dialog/survey-dialog.component';
import { Item, SurveyItemContent } from '@app-models/item-info';
import { Branch, Question, SurveyInfo } from '@app-models/survey-info';
import { AlertService, FeedbackService } from '@app/services';
import { AppService } from '@app/app.service';
import { WindowService } from '@app-common/window/window.service';

@Component({
	moduleId: module.id,
	selector: 'survey-item',
	templateUrl: './survey.component.html',
	styleUrls: ['./survey.component.css']
})

export class SurveyComponent implements OnInit, AfterViewInit {
	@Input() item: Item;
	@Input() editable: boolean = true;
	@Input() readOnly = false;
	@Input() containerWidth: number = 1100;
	@Input('animation') _animation: boolean = false;

	@Output() itemChange = new EventEmitter<Item>();

	@ViewChild('surveyContainer') _surveyContainer: ElementRef;

	public changes: boolean = false;

	public itemContent: SurveyItemContent;
	public info: SurveyInfo = new SurveyInfo();
	public parent: HTMLElement;

	public _linkDragStart = new Rx.Subject<[number, number]>();
	public _linkDragEnd = new Rx.Subject<[number, number]>();
	public _linkDrag = new Rx.Subject<[number, number, number]>();
	public _linkIndexChange = new Rx.Subject<[number, number[]]>();

	public _activeQuestionIndex: number[] = [0, 0];
	public _prev = new Rx.Subject<void>();
	public _next = new Rx.Subject<void>();
	public _goto = new Rx.Subject<number[]>();

	public setSurveyItemContent = new Rx.Subject<SurveyItemContent>();

	public _subs: Rx.Subscription[] = [];

	constructor(
		public _elementRef: ElementRef,
		public _changeDetectRef: ChangeDetectorRef,
		private _alertService: AlertService,
		private _windowService: WindowService,
		private _feedbackService: FeedbackService,
		private _appService: AppService
	) {}

	ngOnInit() {
		this.parent = (this._elementRef.nativeElement as HTMLElement).parentElement.parentElement;

		this._subs = [
			this._prev.subscribe(() => {
				if (this._activeQuestionIndex[1]<=0) {
					if (this._activeQuestionIndex[0]==0) {
						this._activeQuestionIndex = [this._activeQuestionIndex[0], this._activeQuestionIndex[1]];
					}
					else {
						let index = lodash.max([this.info.branches.findIndex(b=>b.name == this.info.branches[this._activeQuestionIndex[0]].name) - 1, 0]);
						this._activeQuestionIndex = [index, this.info.branches[index].questions.length-1];
					}
				}
				else {
					this._activeQuestionIndex = [this._activeQuestionIndex[0], this._activeQuestionIndex[1]-1]
				}
			}),
			this._next.subscribe(() => {
				let c_branch = this.info.branches[this._activeQuestionIndex[0]];
				if (this._activeQuestionIndex[1] == c_branch.questions.length-1) {
					let index = this.info.branches.findIndex(b=>b.name == c_branch.name) + 1;
					if (index < this.info.branches.length)
						return [index, this.info.branches[index].questions.length>0 ? 0 : -1];
					else
						return [this._activeQuestionIndex[0], this._activeQuestionIndex[1]]
				}
				else {
					return [this._activeQuestionIndex[0], this._activeQuestionIndex[1]+1]
				}
			}),
			this._goto.subscribe(r=> {
				this._activeQuestionIndex = [<number>r[0], <number>r[1]];
			}),
			this._linkIndexChange.subscribe(arr=> {
				this.info.branches[arr[0]].questions = withArray(this.info.branches[arr[0]].questions, ar =>
				arr[1].forEach((di: number, j: number) => {
				  ar[j + di] = this.info.branches[arr[0]].questions[j];
				}));
				//this.changes = true;
				this.emmitItemChange();
			}),

			this.setSurveyItemContent.subscribe(result => {
				this.itemContent = result;
				this.info = this.itemContent.info.value;
				this._changeDetectRef.detectChanges();
				if (this._surveyContainer) {
				  this.parent.style.height = $(this._surveyContainer.nativeElement as HTMLElement).height() + 20 + 'px';
				}

			}),

			Rx.Observable.merge(
			  this._linkDragStart,
			  this._linkDragEnd,
			  this._linkDrag,
			  this._linkIndexChange
			)
			.subscribe(() => {
				this._changeDetectRef.detectChanges();
			})
		];

		this.setSurveyItemContent.next(this.item.content as SurveyItemContent);
	}

	ngAfterViewInit() {
		// this.parent.style.height = $(this._surveyContainer.nativeElement as HTMLElement).height() + 30 + 'px';
		setTimeout(() => {
			const height = this.item.content.box.height();
			const eleHeight = (this._surveyContainer.nativeElement as HTMLElement).offsetHeight;
			if (height != eleHeight)
				this.itemChange.emit(this.item.setContent(this.itemContent.setBox(this.itemContent.box.setBottom(this.itemContent.box.top + eleHeight))));
		});
	}

	get isPrev(): boolean {
		if (this._activeQuestionIndex[0] > 0)
			return true;
		if (this._activeQuestionIndex[0] == 0  &&  this._activeQuestionIndex[1] > 0)
			return true;
		return false;
	}

	get isNext(): boolean {
		if (this._activeQuestionIndex[0] < this.info.branches.length-1)
			return true;
		if (this._activeQuestionIndex[0] == this.info.branches.length-1  &&  this._activeQuestionIndex[1] < this.info.branches[this._activeQuestionIndex[0]].questions.length-1)
			return true;
		return false;
	}

	getQuestion(): Question{
		return this.info.branches[this._activeQuestionIndex[0]].questions[this._activeQuestionIndex[1]];
	}

	getQuestionNo(): number{
		return this._activeQuestionIndex[1];
	}

	addQuestion(b_no: number) {
		this.openSurveyDialog(b_no,this.info.branches[b_no].questions.length-1);
	}

	removeQuestion(b_no: number, q_no: number) {
		this.info.branches[b_no].questions.splice(q_no,1);
		this._changeDetectRef.detectChanges();
		this.parent.style.height = $(this._surveyContainer.nativeElement as HTMLElement).height() + 30 + 'px';
		this.changes = true;
	}

	openSurveyDialog(b_no: number, q_no: number, add_edit: number = 0) {  // 0: add, 1: edit
		//let itemContent = this.itemContent.setInfo(Maybe.just(this.itemContent.info.value.setBranches([this.info.branches[b_no]])));
		let itemContent = this.itemContent;
		let dialog = createSurveyDialogWindow(this._windowService, itemContent, add_edit, b_no, q_no);
		dialog.componentRef.instance.submit.subscribe(result => {

			result = result.setBox(result.box.moveTo((this.containerWidth - result.box.width()) / 2, result.box.top));

			const left = result.box.left;
			const width = result.box.width();

			this.setSurveyItemContent.next(result);

			this.parent.style.width = width + 'px';

			this.itemChange.emit(
				  this.item
						.setContent(
							this.itemContent
								.setBox(
									this.itemContent.box
										.setRight(left + width)
										.setBottom(this.itemContent.box.top + this.parent.offsetHeight)
									)
						)
			);
			dialog.destroy();
		});
		dialog.componentRef.instance.close.subscribe(result => {
		  dialog.destroy();
	  });
		dialog.open();
	}

	emmitItemChange() {
		this.itemChange.emit(
			this.item
					.setContent(
						this.itemContent
							.setBox(
								this.itemContent.box
									.setRight(this.itemContent.box.left + this.parent.offsetWidth)
									.setBottom(this.itemContent.box.top + this.parent.offsetHeight)
								)
					)
		);
	}

	onSubmit(e: MouseEvent) {
	  e.stopPropagation();
	  let formData = {};

	  if (this.info) {
		formData['form'] = this.item.uid;
		formData['branches']=[];
		this.info.branches.forEach(b => {
		  let branch = {};
		  b.questions.forEach(q => {
			if (q.qNo >= 0) {
			  q.items.forEach(i => {
				const info = lodash.get(i, 'content.info.value');

				switch (i.itemType) {
				  case 'SurveyCommentItem':
					branch[q.uid] = info['value'];
					break;
				  case 'SurveyMultiChoiceItem':
					const texts = info.texts.filter(t => t.value);
					if (!lodash.get(texts, length))
					  break;
					if (info.type == 'option') {
					  branch[q.uid] = texts[0].text;
					} else {
					  branch[q.uid] = texts.map(t => t.text);
					}
				}
			  })
			}
		  });

		  formData['branches'].push(branch);
		})
	  }

	  this._alertService.playToast('Success', 'Thank you for your feedback', 0);
	  this._feedbackService.sendFormData(formData).
		pipe()
		.subscribe(
		  res => {
			this._appService.closeDialog.next();
		  },
		  error => {
			this._appService.closeDialog.next();
		  }
		)
	}

	// getAnchor() {
	//   return this.question.branchName+this.question.qNo
	// }

	@HostListener('document:click', ['$event'])
	public onClick(event: MouseEvent) {
		const clickedInside = this._elementRef.nativeElement.contains(event.target);
		if (!clickedInside && this.changes) {
			this.emmitItemChange();
		}
	}
}
