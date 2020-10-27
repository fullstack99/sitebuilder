import { Component, Input, Output, EventEmitter,
		OnInit, OnChanges, SimpleChanges, OnDestroy, AfterViewInit,
		ChangeDetectorRef,
		ViewChildren,
		QueryList,
	   } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, AbstractControl, FormArray } from '@angular/forms';
 import { Subscription } from 'rxjs';
import {
	get as _get
} from 'lodash';

import * as differenceDeep from '@app-lib/functions/difference-deep';
import { Box } from '@app-lib/rect/rect';
import { Maybe } from '@app-lib/maybe/maybe';
import { SurveyItemContent, CommonItemContent,
	SurveyInfo, Branch, Question, EventInfo, Item,
	SurveyMultiChoiceInfo, SurveySingleTextInfo,  RatingInfo, EndSurveyInfo, } from '@app/models';

import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { createSurveyDialogWindow } from '@app-dialogs/survey-dialog/survey-dialog.component';
import { UUID } from '@app-lib/uuid/uuid.service';

import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { AppService } from '@app/app.service';

export function createEventFeedbackDialogWindow(
	windowService: WindowService,
	survey: Item,
): DialogWindow<EventFeedbackDialogComponent> {
	return windowService.create<EventFeedbackDialogComponent>(
		EventFeedbackDialogComponent,
		{
			width: 520,
			height: '100%',
			modal: true,
			draggable: true,
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
	moduleId: module.id,
	selector: 'event-feedback-dialog',
	templateUrl: './event-feedback-dialog.component.html',
	styleUrls: ['./event-feedback-dialog.component.css']
})
export class EventFeedbackDialogComponent implements OnInit, OnChanges, OnDestroy {

	@Input() eventSurvey: Item = null;

	@Output() submit = new EventEmitter<any>();
	@Output() close = new EventEmitter<void>();

	noThanks: FormControl = new FormControl(false);
	eventFeedbackSurveyItem: Item = new Item(
			0, 0, UUID.UUID(), 'SurveyItem',
			new SurveyItemContent(
				new Box(0, 465, 0, 875),
				[],
				Maybe.just(new SurveyInfo(
						'Event Feedback',
						[
							new Branch(
								'Main',
								[
									new Question(
										'Main',
										0,
										[
											new Item(
												0,
												0,
												UUID.UUID(),
												'RatingItem',
												new CommonItemContent<RatingInfo>(
													Maybe.just(
														new RatingInfo(
															'star',
															'How many stars would you rate this event?'
														)
													),
													new Box(0, 300, 0, 150)
												)
											)
										],
										UUID.UUID()
									),
									new Question(
										'Main',
										1,
										[
											new Item(
												0,
												0,
												UUID.UUID(),
												'SurveyMultiChoiceItem',
												new CommonItemContent<SurveyMultiChoiceInfo>(
													Maybe.just(
														new SurveyMultiChoiceInfo(
															'option',
															'Overall, how satisfied with this event?',
															[
																{
																	text: 'Extremely satisfied',
																	type: '',
																	value: false,
																	link: null
																},
																{
																	text: 'Very satisfied',
																	type: '',
																	value: false,
																	link: null
																},
																{
																	text: 'Neutral',
																	type: '',
																	value: false,
																	link: null
																},
																{
																	text: 'Not so satisfied',
																	type: '',
																	value: false,
																	link: null
																},
																{
																	text: 'Not at all satisfied',
																	type: '',
																	value: false,
																	link: null
																},
															]
														)
													),
													new Box(0, 400, 0, 220)
												)
											),
										],
										UUID.UUID()
									),
									new Question(
										'Main',
										2,
										[
											new Item(
												0,
												0,
												UUID.UUID(),
												'SurveySingleTextItem',
												new CommonItemContent<SurveySingleTextInfo>(
													Maybe.just(
														new SurveySingleTextInfo(
															'If you changed just one thing about this event what would it be?',
															'',
															new Box(0, 435, 0, 40)
														)
													),
													new Box(0, 465, 0, 130)
												)
											)
										],
										UUID.UUID()
									),
									new Question(
										'Main',
										-1,
										[
											new Item(
												0,
												0,
												UUID.UUID(),
												'EndSurveyItem',
												new CommonItemContent<EndSurveyInfo>(
													Maybe.just(
														new EndSurveyInfo()
													)
												)
											)
										],
										UUID.UUID()
									),
								],
								UUID.UUID()
							)
						],
						'single'
					),
				),
			)
		);

	private _subs: Subscription[] = [];

	constructor(
		private _formBuilder: FormBuilder,
		private _changeDetector: ChangeDetectorRef,
		private _windowService: WindowService,
		private _appService: AppService,
	) {
		this._subs = [
		];
	}

	ngOnInit() {
		if (this.eventSurvey)
			this.eventFeedbackSurveyItem = this._appService.createItem(this.eventSurvey);
	}

	ngOnChanges(changes: SimpleChanges) {
	}

	ngOnDestroy() {
		this._subs.forEach(s => s.unsubscribe());
	}

	openSurveyDialog() {
		const dialog = createSurveyDialogWindow(this._windowService, this.eventFeedbackSurveyItem.content, -1, 0, -1);
		dialog.componentRef.instance.submit.subscribe(res => {
			this.eventFeedbackSurveyItem.content = res;
			this.submit.emit(this.eventFeedbackSurveyItem);
		});
		dialog.componentRef.instance.close.subscribe(res => {
		});
		dialog.open();
	}

	openFeedbackDialog() {
		const dialog = createFeedbackDialogWindow(this._windowService, 'fund.001');
		dialog.open();
	}

	onClose(event: MouseEvent) {
		this.close.emit();
	}
}
