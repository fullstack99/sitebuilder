import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,	ViewChild, ElementRef, HostListener, AfterViewInit, Renderer } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { SwiperComponent, SwiperDirective, SwiperConfigInterface,
    SwiperScrollbarInterface, SwiperPaginationInterface } from 'ngx-swiper-wrapper';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { CanvasTool } from '@app-common/page-canvas/tools/page-canvas-tools.component';
import { SingleCheckBoxInfo, SingleTextInfo, MultipleChoiceInfo, ChoiceType,
     SurveyInfo, SurveyItemInfo } from '@app/models';
import { SurveyService } from '@app-dialogs/survey-dialog/survey.service';

@Component({
	moduleId: module.id,
    selector   : 'survey-tools',
	templateUrl: './tools.component.html',
	styleUrls: ['./tools.component.css']
})

export class SurveyToolsComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() selectedTools: string[] = [];
    @Input() viewMode = 1; // 1: laptop, 2: mobile

    @Output() clickTool = new EventEmitter<string>();

    @ViewChild('usefulSwiper') usefulSwiper: any;
    @ViewChild(SwiperDirective) directiveRef: SwiperDirective;


    _tools: CanvasTool[] = [
        { name: 'SurveyQALibrary', caption: 'Q & A Library', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '', level: [0] },
        { name: 'SurveySingleChoiceItem', caption: '', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '/assets/images/canvas/single-choice.png', level: [0] },
        { name: 'SurveyMultiChoiceItem', caption: '', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '/assets/images/canvas/multi-choice.png', level: [0] },
        { name: 'SurveyDropdownItem', caption: '', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '/assets/images/canvas/dropdown.png', level: [0] },
        { name: 'SurveySingleTextItem', caption: '', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '/assets/images/canvas/survey-single-text.png', level: [0] },
        { name: 'SurveyCommentItem', caption: '', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '/assets/images/canvas/comment.png', level: [0] },
        { name: 'SurveyMultiTextsItem', caption: '', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '/assets/images/canvas/multi-textboxes.png', level: [0] },
        { name: 'RatingStarsItem', caption: '', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '/assets/images/canvas/rating-stars.png', level: [0] },
        { name: 'RatingSliderItem', caption: '', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '/assets/images/canvas/rating-slider.png', level: [0] },
        { name: 'RankDropdownItem', caption: '', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '/assets/images/canvas/rank-dropdown.png', level: [0] },
        { name: 'EnterDateItem', caption: '', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '/assets/images/canvas/enter-date.png', level: [0] },
        { name: 'EnterTimeItem', caption: '', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '/assets/images/canvas/enter-time.png', level: [0] },
        { name: 'MatrixOneChoiceItem', caption: '', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '/assets/images/canvas/matrix-one-choice.png', level: [0] },
        { name: 'MatrixMultiChoiceItem', caption: '', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '/assets/images/canvas/matrix-multi-choice.png', level: [0] },
        { name: 'MatrixEditableDropdownItem', caption: '', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '/assets/images/canvas/matrix-editable-dropdown.png', level: [0] },
        { name: 'EndSurveyItem', caption: '', activate: true, item_class: 'img-survey-tool', hasImage: true, url: '/assets/images/canvas/end-survey.png', level: [0] },
    ];

    _activeIndex: number = 0;
    isBeginning: boolean = true;
    isEnd: boolean = false;
    swiperUpdated: boolean = false;

    swiperConfig: SwiperConfigInterface = {
        direction: 'horizontal',
        observer: true,
        initialSlide: -1,
        slidesPerView: 2,
        spaceBetween: 10,
        breakpoints: {
            1800: {
                slidesPerView: 2
            },
            512: {
                slidesPerView: 1
            }
        },
		grabCursor: true
    };

    private subs: Rx.Subscription[] = [];

    constructor(
        private changeDetector: ChangeDetectorRef,
        private elementRef: ElementRef,
        private sanitizer: DomSanitizer,
        private renderer: Renderer
    ) { }

    ngOnInit() {
        this.swiperConfig.slidesPerView = this.viewMode === 1 ? 3 : 1;
        this.swiperConfig.breakpoints = {
          1800: {
              slidesPerView: 1
          },
          512: {
              slidesPerView: 1
          }
        }

        this.subs = [
        ];
    }

    ngAfterViewInit() {
        this.directiveRef.update();
    }

    onToolClick(tool: CanvasTool) {
      this.clickTool.emit(tool.name);
    }

    backgroundImage(url: string): SafeStyle {
        return url ? this.sanitizer.bypassSecurityTrustStyle(`url('${url}')`) : '';
    }

    onFocus(event: any) {
        if (!this.swiperUpdated) {
            this.swiperUpdated = true;
            event.update();
        }
    }

    indexChanged(event: number) {
        this.isBeginning = (event == 0);
        this.isEnd = (event == this._tools.length-2);
        this._activeIndex = event;
        this.changeDetector.detectChanges();
    }

    ngOnDestroy() {
        this.subs.forEach(s => s.unsubscribe());
    }
}



