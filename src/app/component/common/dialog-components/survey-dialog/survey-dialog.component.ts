import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, ViewChildren, ElementRef, HostListener, Input, QueryList, AfterViewInit, Renderer } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { SwiperComponent, SwiperDirective, SwiperConfigInterface,
	SwiperScrollbarInterface, SwiperPaginationInterface } from 'ngx-swiper-wrapper';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { ancestors, elementOffsetRect } from '@app-lib/dom/dom';
import { Maybe } from '@app-lib/maybe/maybe';
import { Box, Rect } from '@app-lib/rect/rect';;
import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { CommonCanvasComponent } from '@app-common/common-canvas/common-canvas.component';
import { Page,
		Item, ItemContent,
	ImageItemContent, TextItemContent, ItemGroupContent,
		SurveyItemContent, CommonItemContent,
		SurveyInfo, Branch, Question, SurveySingleTextInfo, EndSurveyInfo } from '@app/models';
import { BranchDialogComponent, createBranchDialogWindow } from '@app-dialogs/survey-dialog/branch/branch-dialog.component';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { WSService, SitemapService } from '@app/services';
import { AppService } from '@app/app.service';
import { environment } from "@app-environments/environment";

export function createSurveyDialogWindow(
	windowService: WindowService,
	itemContent: ItemContent = new SurveyItemContent(),
	addOrEdit: number = -1, // 0: add, 1: edit
	b_no: number = 0,
	q_no: number = -1,
	width: number = 860,
	height: number = 650
): DialogWindow<SurveyDialogComponent> {
	return windowService.create<SurveyDialogComponent>(
		SurveyDialogComponent,
		{
			width: width,
			height: height,
			modal: true,
			draggable: true,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.itemContent = <SurveyItemContent>itemContent;
		comp.addOrEdit = addOrEdit;
		comp.b_no = b_no;
		comp.q_no = q_no;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}


export interface CanvasTool {
	name: string;
	caption: string;
	activate: boolean;
	item_class: string;
	hasImage: boolean;
	url: string;
}

@Component({
	moduleId: module.id,
	templateUrl: './survey-dialog.component.html',
	styleUrls: [
		'./survey-dialog.component.css',
		'../../../../../assets/styles/canvas-nav.css']
})
export class SurveyDialogComponent implements OnInit, OnDestroy, AfterViewInit{

  	@Input() itemContent: SurveyItemContent = new SurveyItemContent();
	@Input() addOrEdit: number = -1; // 0: add, 1: edit
	@Input() b_no: number = 0; // branch#
	@Input() q_no: number = -1; // question#

	@Output() submit = new EventEmitter<SurveyItemContent>();
	@Output() close = new EventEmitter<void>();

	@ViewChild('usefulSwiper') usefulSwiper: any;
	@ViewChild(SwiperDirective) directiveRef: SwiperDirective;

  	@ViewChild(CommonCanvasComponent) commonCanvas: CommonCanvasComponent;
	@ViewChild('textEle') textEle: ElementRef;

	public survey_info: SurveyInfo = new SurveyInfo();
	public _page: Page = new Page();

	public dispRange = lodash.range(0, 4);
	public _tools: CanvasTool[] = [
			{ name: 'Required', caption: 'Required', activate: true, item_class: 'required', hasImage: false, url: '' },
			{ name: 'AddBranch', caption: 'Add Branch', activate: true, item_class: 'img-responsive', hasImage: false, url: '' },
			{ name: 'ImageItem', caption: 'Image', activate: true, item_class: 'font-icon btb bt-camera', hasImage: false, url: '' },
			// { name: 'Skipping', caption: 'Skipping', activate: true, item_class: 'font-icon btb bt-sign-in', hasImage: false, url: '' },
			{ name: 'TextItem', caption: 'Text', activate: true, item_class: 'img-responsive', hasImage: true, url: '/assets/images/canvas/text.png' },
			{ name: 'ButtonItem', caption: 'Button', activate: true, item_class: 'font-icon btb bt-checkbox-intermediate', hasImage: false, url: '' },
			{ name: 'Background', caption: 'Background', activate: true, item_class: 'font-icon btb bt-photo', hasImage: false, url: '' },
			{ name: 'Border', caption: 'Border', activate: true, item_class: 'img-responsive border', hasImage: true, url: '/assets/images/canvas/border.png' },
			];

	activeIndex: number = 0;
	isBeginning: boolean = true;
	isEnd: boolean = false;

	public activeQuestionIndex: number[] = [0, -1]; // [branchIndex, questionIndex]
  	public _prevQuestion = new Rx.Subject<void>();
	public _nextQuestion = new Rx.Subject<void>();
	public _gotoQuestion = new Rx.Subject<number[]>();

	public left: number;
	public top: number;
	public dialogLeft: number;
	public dialogTop: number;

	public swiperConfig: SwiperConfigInterface = {
		direction: 'horizontal',
		observer: true,
		initialSlide: -1,
		slidesPerView: "auto",
		grabCursor: true
	};

	themeCategories: any = [];
	subThemeCategories: any = [];
	activeThemeCategory: any;
	themeQuestions: any = [];
	selectedThemeQuestions = [];
	visibleQALibrary: boolean = false;

	viewMode = 1; // 1: laptop, 2: mobile
	changed: boolean = false;
	private viewInited: boolean = false;
	private subs: Rx.Subscription[] = [];

  	constructor(
		private changeDetector: ChangeDetectorRef,
		private elementRef: ElementRef,
		private sitemapService: SitemapService,
		private windowService: WindowService,
		private wsService: WSService,
		private appService: AppService,
		private sanitizer: DomSanitizer,
		private renderer: Renderer
	) { }

	ngOnInit() {
		this.dialogLeft = Number.parseFloat(((this.elementRef.nativeElement as HTMLElement).parentElement.style.left.split('px')[0]));
		this.dialogTop = Number.parseFloat(((this.elementRef.nativeElement as HTMLElement).parentElement.style.top.split('px')[0]));

		const dialogWidth = Number.parseFloat(((this.elementRef.nativeElement as HTMLElement).parentElement.style.width.split('px')[0]));

		if (dialogWidth < 420) {
			this.viewMode = 2;
		}

		this._page.items = [];
		this.left = this.itemContent.box.width() < 980 ? 20 : 0;
		this.top = 20;
		let info = this.itemContent.info.value;

		let branches = info.branches.map(branch =>
			branch.setQuestions(
				branch.questions.map(
					question => question.setItems(
						question.items.map(item =>
							item.setContent(item.content.setBox(item.content.box.moveBy(this.left, this.top)))
						)
					)
				)
			)
		);

		const categories = this.wsService.getCategories(null, environment.QALibrary);

		this.survey_info = info.setBranches(branches);

		// this._questions = [].concat(...this.survey_info.branches.map(branch=>branch.questions));

		this.subs = [
			this._prevQuestion.subscribe(() => {
					if (this.addOrEdit != 0) {
						this.updateQuestion();
					} else {
						this.addOrEdit = -1;
					}

					const c_branch = this.survey_info.branches[this.activeQuestionIndex[0]];
					if (this.activeQuestionIndex[1] <= 0) {
						if (this.activeQuestionIndex[0] == 0) {
							this.activeQuestionIndex = [this.activeQuestionIndex[0], this.activeQuestionIndex[1]];
						} else {
							let index = lodash.max([this.survey_info.branches.findIndex(b=>b.name == c_branch.name) - 1, 0]);
							this.activeQuestionIndex = [index, this.survey_info.branches[index].questions.length - 1];
						}
					} else {
						this.activeQuestionIndex = [this.activeQuestionIndex[0], this.activeQuestionIndex[1] - 1]
					}
					this.updatePageItems();
				}),

			this._nextQuestion.subscribe(() => {
					if (this.addOrEdit != 0) {
						this.updateQuestion();
					} else {
						this.addOrEdit = -1;
					}

					const c_branch = this.survey_info.branches[this.activeQuestionIndex[0]];
					if (this.activeQuestionIndex[1] == c_branch.questions.length - 1) {
						let index = this.survey_info.branches.findIndex(b => b.name == c_branch.name) + 1;
						if (index < this.survey_info.branches.length)
							this.activeQuestionIndex = [index, this.survey_info.branches[index].questions.length>0 ? 0 : -1];
						else
							this.activeQuestionIndex = [this.activeQuestionIndex[0], this.activeQuestionIndex[1]]
					}
					else {
						this.activeQuestionIndex = [this.activeQuestionIndex[0], this.activeQuestionIndex[1]+1]
					}
					this.updatePageItems();
				}),

			this._gotoQuestion.subscribe((r) => {
					this.activeQuestionIndex = [<number>r[0], <number>r[1]];
					this.updatePageItems();
				}),

			categories.subscribe(
					(res: any) => {
						if (!res) return;
						this.themeCategories = res;
						if (this.themeCategories.length > 0) {
							this.onClickCategory(this.themeCategories[0]);
						}
						this.refreshView();
					},
					error => {
					},
					() => {
					}
				)
		];

		switch (this.addOrEdit) {
			case 0:
			case 1:
				this._gotoQuestion.next([this.b_no, this.q_no]);
				break;
			default:
				this._nextQuestion.next();
		}
	}

	ngAfterViewInit() {
		this.viewInited = true;
		this.subs.push(
			this.commonCanvas.history.value.subscribe(r=> {
				this.refreshView();
			})
		)
		setTimeout(() => {
			(this.textEle.nativeElement as HTMLElement).focus();
			this.directiveRef.update();
		},500);
  }

	updatePageItems() {
		const c_branch = this.survey_info.branches[this.activeQuestionIndex[0]];
		const m = this.activeQuestionIndex[1];
		if (this.addOrEdit == 0) {
			this._page.items = [];
		} else {
			this._page.items = m >= 0 && c_branch.questions[m] ? c_branch.questions[m].items : [];
		}
		this._page = lodash.cloneDeep(this._page);
		this.appService._surveyInfo = this.survey_info;
		if (this.viewInited)
			this.refreshView();
	}

	get isSaving(): boolean {
		return (this.countQuestions > 0 && this.survey_info.surveyName) ? true : false;
	}

	get placeHolder(): string[] {
		let result: string[] = [];
		if (this.activeQuestionIndex[0] > 0)
			result.push('Branch ' + this.survey_info.branches[this.activeQuestionIndex[0]].name);
		result.push('Choose Below');
		result.push('Your Question Will Go Here');
		return result;
	}

	get questionNo() {
		//let no = this.activeQuestionIndex[1]+1;
		//if (this.survey_info.branches[this.activeQuestionIndex[0]] && this.survey_info.branches[this.activeQuestionIndex[0]].questions.length)
		return this.activeQuestionIndex[1]+1;
	}

	get countQuestions() {
		let count = 0;
		this.survey_info.branches.forEach(branch=> {
				count += branch.questions.length > 0 ? branch.questions.length - 1 : 0;
			}
		);
		return count;
	}

	isQuestion(tool: string) {
		return lodash.indexOf(
			['SurveySingleChoiceItem', 'SurveyMultiChoiceItem', 'SurveyDropdownItem', 'SurveySingleTextItem',
			'RatingStarsItem', 'RatingSliderItem', 'RankDropdownItem',
			'EndSurveyItem','EnterDateItem','EnterTimeItem', 'SurveyCommentItem',
			'MatrixOneChoiceItem','MatrixMultiChoiceItem','MatrixEditableDropdownItem',
			'SurveyMultiTextsItem'], tool) >= 0 ? true : false;
	}

	isSurveyItem(itemType: string) {
		return lodash.indexOf(
			[ 'RatingItem', 'RankItem', 'EndSurveyItem', 'MatrixChoiceItem', 'DateItem', 'TimeItem',
			 'SurveySingleTextItem', 'SurveySingleCheckItem', 'SurveyCommentItem', 'SurveyMultiChoiceItem',
			 'SurveyMultiTextsItem'], itemType) >= 0 ? true : false;
	}

	canActiveTool(tool: string): boolean {
		const someItems = (items: Item[], pred: (item: Item) => boolean) => {
			const go: (item: Item) => boolean = (item: Item) =>
				item.content instanceof ItemGroupContent
					? item.content.items.some(go)
					: pred(item);

			return items.some(go);
		};

		const itemTypeInSelection = (type: string) =>
					someItems(this.commonCanvas.currentState.selectedItems, i => i.itemType == type);

		switch (tool) {
			case 'Undo':
				return this.commonCanvas.isActiveUndo;
			case 'Redo':
				return this.commonCanvas.isActiveRedo;
			case 'Required':
				let sItem = this.commonCanvas.selectedItem;
				if (sItem && sItem.itemType=='SurveySingleTextItem' && (sItem.content as CommonItemContent<SurveySingleTextInfo>).info.value.required)
					return true;
			default:
				return itemTypeInSelection(tool);
		}
	}

	selectedTools() {
		return this.commonCanvas.currentState.selectedItems.map(i=>i.itemType);
	}

	clickTool(tool: string) {

	if (tool == 'SurveyQALibrary') {
		this.visibleQALibrary = true;
		this.refreshView();
		return;
	} else {
	  	this.visibleQALibrary = false;
	}

	if (tool == 'AddBranch') {
		this.openBranchDialog();
		return;
	}

	let c_branch = this.survey_info.branches[this.activeQuestionIndex[0]];
	if (this.isQuestion(tool)) {
	  if (this.addOrEdit != 0) {
		this.updateQuestion();
	  }
			this.commonCanvas.clickCanvasTool('ClearDocument');
		}

		if (this.isQuestion(tool)) {
			if (c_branch.questions.length==0 && tool!='EndSurveyItem') {
				this.clickTool('EndSurveyItem');
				this.commonCanvas.clickCanvasTool('ClearDocument');
			}

			this.commonCanvas.clickCanvasTool(tool);
			let c_qNo = this.activeQuestionIndex[1];
	  		c_branch = this.survey_info.branches[this.activeQuestionIndex[0]];

			if (c_qNo < 0) {
				this.addQuestion(0);
				this._nextQuestion.next();
			} else if (c_qNo == c_branch.questions.length-1) {
				this.addQuestion(c_qNo);
				this.refreshView();
			} else {
				this.addQuestion(c_qNo+1);
				this._gotoQuestion.next([this.activeQuestionIndex[0], c_qNo + 1]);
			}
		} else {
			this.commonCanvas.clickCanvasTool(tool);
		}
		this.changed = true;
		this.addOrEdit = -1;
	}

	onAddQuestion() {
		if (this.addOrEdit != 0) {
			this.updateQuestion();
		}
		this.addOrEdit = 0;
		let c_branch = this.survey_info.branches[this.activeQuestionIndex[0]];
		let q_no = c_branch.questions.length - 1;
		this._gotoQuestion.next([this.activeQuestionIndex[0], q_no]);
	}

	// For the Current Branch
	addQuestion(q_no: number) {
		let c_branch = this.survey_info.branches[this.activeQuestionIndex[0]];
		let question: Question = new Question(c_branch.name, c_branch.questions.length-1, this.commonCanvas.resultItems);
		this.survey_info = this.survey_info.updateBranch(c_branch.addQuestion(q_no, question));
	}

	updateQuestion() {
		let c_branch = this.survey_info.branches[this.activeQuestionIndex[0]];
		let q_no = this.activeQuestionIndex[1];
		if (q_no >= 0) {
			let items = this.commonCanvas.resultItems;
			let question = c_branch.questions[q_no];
			this.survey_info = this.survey_info.updateBranch(c_branch.updateQuestion(q_no, new Question(c_branch.name, question.qNo, items)));
		}
	}

	selectBranch(b_no: number) {
		const q_no = this.survey_info.branches[b_no].questions.length>0 ? 0 : -1;
		this._gotoQuestion.next([b_no,q_no]);
	}

  	openFeedbackDialog() {
		let feedbackWindow: DialogWindow<FeedbackDialogComponent>;
		feedbackWindow = createFeedbackDialogWindow(this.windowService, 'su.d.114');
		feedbackWindow.open();
	}

	openBranchDialog() {
		let branchWindow: DialogWindow<BranchDialogComponent>;
		branchWindow = createBranchDialogWindow(this.windowService);
		branchWindow.componentRef.instance.submit.asObservable().subscribe(result => {
			this.survey_info = this.survey_info.addBranch();
			this._gotoQuestion.next([this.survey_info.branches.length-1, -1]);

		});
		branchWindow.open();
	}

	onItemRemove(event: Item) {
		if (this.isSurveyItem(event.itemType)) {
			let c_branch = this.survey_info.branches[this.activeQuestionIndex[0]];
			this.survey_info = this.survey_info.updateBranch(c_branch.removeQuestion(this.activeQuestionIndex[1]));
			this._gotoQuestion.next([this.activeQuestionIndex[0], this.activeQuestionIndex[1]-1]);
		}
	}

	onRemoveBranch(event: MouseEvent, branch: Branch) {
		let c_branch = this.survey_info.branches[this.activeQuestionIndex[0]];
		let q_no = this.survey_info.branches[this.activeQuestionIndex[0]-1].questions.length>0 ? 0 : -1;
		this.survey_info = this.survey_info.removeBranch(c_branch);
		this._gotoQuestion.next([this.activeQuestionIndex[0]-1, q_no]);
	}

	onSubmit(event: MouseEvent) {
		if (!this.isSaving)
	  		return;
		if (this.addOrEdit != 0)
			this.updateQuestion();
		let info = this.survey_info;
		let boxes: Box[] = [];
		let height = 10;
		let branches = info.branches.map(branch=>
			branch.setQuestions(
				branch.questions.map(
					question=> {
						let box = Box.boundingBox(question.items.map(i=> {
							height += i.content.box.height() + 20; //margin-bottom
							return i.content.box;
						}));
						boxes.push(box.value);
						height +=10;
						return question.setItems(
							question.items.map(item=>
								item.setContent(item.content.setBox(item.content.box.moveBy(-box.value.left, -box.value.top)))
							)
						);
					}
				)
			)
		);
		info = info.setBranches(branches);

		let width = Box.boundingBox(boxes).value.width();

			this.itemContent =
				this.itemContent
					.setInfo(new Maybe(info))
					.setBox(
						this.itemContent.box
							.setRight(
								this.itemContent.box.left + width
							)
							.setBottom(this.itemContent.box.top + height + 50)
					);

			this.submit.emit(this.itemContent);
		}

	indexChanged(event: number) {
		this.isBeginning = (event == 0);
		this.isEnd = (event == this._tools.length-2);
		this.activeIndex = event;
		this.changeDetector.detectChanges();
	}

	onClickCategory(item) {
		this.activeThemeCategory = item;
		this.subThemeCategories = [];
		this.themeQuestions = {};
		this.selectedThemeQuestions = [];

		this.wsService.getCategories(this.activeThemeCategory.uid, environment.QALibrary)
			.pipe()
			.subscribe(
				(res: any) => {
					this.subThemeCategories = res;
					this.subThemeCategories.forEach(sc=> {
						this.getThemePages(sc.uid);
					})
					this.refreshView();
				},
				error => {
					this.refreshView();
				},
				() => {}
			);
	}

	getThemePages(uid: string) {
		this.themeQuestions[uid] = [];
		this.wsService.getThemePage(uid, 0, 100, '0', true, true, environment.QALibrary)
		.pipe()
		.subscribe(
			(res: any) => {
				if (res && res.data) {
					res.data.forEach(r=> {
						let surveyItems = r.items.filter(i=>i.itemType == 'SurveyItem');
						surveyItems.forEach(i => {
							const info = i.content.info.value
							const branches = info.branches;
							branches.forEach(b => {
								let questions = b.questions.filter(q => q.qNo >= 0);
								questions.forEach(q=> {
									const items = q.items;
									items.forEach(item => {
										const label = item.content.info.value.label
										if (label) {
											this.themeQuestions[uid].push(item)
											// this.themeQuestions.push(q);
											// this.themeQuestionLabels.push(label);
										}
									});
								});
							});
						});
					});
					this.refreshView();
				}
			},
			error => {
			})
	}

	isCheckedQuestion(i) {
		return this.selectedThemeQuestions.indexOf(i) >= 0;
	}

	onCheckQuestion(event, i) {
		if (event.target.checked)
			this.selectedThemeQuestions.push(i);
		else
			this.selectedThemeQuestions = this.selectedThemeQuestions.filter(s=>s!=i);
		this.refreshView();
	}

	onChooseThemeQuestions(event) {
		this.visibleQALibrary = false;

		if (this.selectedThemeQuestions.length > 0) {
			let c_branch = this.survey_info.branches[this.activeQuestionIndex[0]];
			let q_no = c_branch.questions.length - 1;

			if (q_no < 0) {
				let endSurveyItem = new Item(0, 0, '', 'EndSurveyItem', new CommonItemContent<EndSurveyInfo>(Maybe.just<EndSurveyInfo>(new EndSurveyInfo), new Box(50, 350, 50, 150)));
				let question = new Question(c_branch.name, q_no, [endSurveyItem]);
				c_branch = c_branch.addQuestion(0, question);
				q_no = 0;
			}

			this.selectedThemeQuestions.forEach(s => {
				let question = lodash.cloneDeep(s);
				let newItem = this.appService.createItem(question);
				newItem = newItem.setContent(newItem.content.setBox(newItem.content.box.moveBy(this.left, this.top)))
				question = new Question(c_branch.name, q_no, [newItem]);
				c_branch = c_branch.addQuestion(q_no, question);
				q_no += 1;
			});

			this.survey_info = this.survey_info.updateBranch(c_branch);
			this._gotoQuestion.next([this.b_no, Math.max(this.q_no, 0)]);

		} else {
			this.refreshView();
		}
	}

	onCloseChooseThemeQuestions(event) {
		this.visibleQALibrary = false;
		this.refreshView();
	}

	onClose(event: MouseEvent) {
		this.close.emit();
	}

	refresh(event: KeyboardEvent) {
		event.stopPropagation();
		setTimeout(() => {
			this.changeDetector.detectChanges();
		},0);
	}

	refreshView() {
		if (this.viewInited)
			this.changeDetector.detectChanges();
	}

	ngOnDestroy() {
		this.viewInited = false;
		this.subs.forEach(s => s.unsubscribe());
	}
}
