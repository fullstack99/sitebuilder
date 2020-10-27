import { Component, Input, OnInit, HostBinding, Output, EventEmitter } from '@angular/core';
import * as lodash from 'lodash';
import { Box } from '@app-lib/rect/rect';
import { Branch, Question, SurveyInfo, SurveyMultiChoiceInfo } from '@app-models/survey-info';
import { Item, SurveyItemContent, CommonItemContent } from '@app-models/item-info';

@Component({
	moduleId: module.id,
	selector: 'question-item',
	templateUrl: './question.component.html',
	styleUrls: ['./question.component.css']
})

export class QuestionComponent implements OnInit {
	@Input('question') question: Question = new Question('');
	@Input('no') no: number = 0;
	@Input('qlength') qlength: number = 0;
	@Input() editable: boolean = true;
	@Input('readOnly') readOnly = false;
	@Input('containerWidth') containerWidth: number = 1100;

	  @Output('add') add = new EventEmitter<void>();
	@Output('edit') edit = new EventEmitter<void>();
	@Output('remove') remove = new EventEmitter<void>();

	@HostBinding('style.width') get styleWidth() {
		return '100%';
	}
	@HostBinding('style.height') get styleHeight() {
		let box = Box.boundingBox(this.question.items.map((item: Item) => {
					return item.content.box;
				}
			));
		return box.value.height();
	}

	constructor() {
	}

	ngOnInit() {
	}

	addQuestion() { this.add.emit(); }
	editQuestion() { this.edit.emit(); }
	removeQuestion() { this.remove.emit(); }
	getAnchor() {
		return this.question.branchName+this.question.qNo
	}
}
