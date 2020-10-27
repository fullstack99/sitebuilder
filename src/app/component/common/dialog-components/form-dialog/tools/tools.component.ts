import {
	Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
	ViewChildren, ElementRef, AfterViewInit, Renderer, ViewChild, Input
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { SwiperComponent, SwiperDirective, SwiperConfigInterface,
    SwiperScrollbarInterface, SwiperPaginationInterface } from 'ngx-swiper-wrapper';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { FormItemContent } from '@app-models/item-info';
import { CanvasTool } from '@app-common/page-canvas/tools/page-canvas-tools.component';
import { FormInfo, SingleCheckBoxInfo, SingleTextInfo, MultipleChoiceInfo, FormItemInfo, ChoiceType } from '@app-models/form-info';
import { FormService } from '@app-dialogs/form-dialog/form.service';

@Component({
	moduleId: module.id,
    selector   : 'form-tools',
	templateUrl: './tools.component.html',
	styleUrls: ['./tools.component.css']
})

export class FormToolsComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() viewMode = 1; // 1: laptop, 2: mobile

    @Output() selectedTool = new EventEmitter<string>();

    @ViewChild(SwiperDirective) directiveRef: SwiperDirective;

    _activeIndex: number = 0;
    isBeginning: boolean = true;
    isEnd: boolean = false;
    swiperUpdated: boolean = false;

    swiperConfig: SwiperConfigInterface = {
      direction: 'horizontal',
      observer: true,
      initialSlide: -1,
      slidesPerView: this.viewMode === 1 ? 3 : 1,
      spaceBetween: 10,
      grabCursor: true
    };

    public _tools: CanvasTool[] = [
        // { name: 'SingleTextItem', caption: '', activate: true, item_class: 'img-form-tool', hasImage: true, url: '/assets/images/canvas/single-text-1.png', level: [0] },
        { name: 'SingleText2Item', caption: '', activate: true, item_class: 'img-form-tool', hasImage: true, url: '/assets/images/canvas/single-text.png', level: [0] },
        { name: 'SingleChoiceItem', caption: '', activate: true, item_class: 'img-form-tool', hasImage: true, url: '/assets/images/canvas/single-choice.png', level: [0] },
        { name: 'MultiChoiceItem', caption: '', activate: true, item_class: 'img-form-tool', hasImage: true, url: '/assets/images/canvas/multi-choice.png', level: [0] },
        { name: 'DropdownItem', caption: '', activate: true, item_class: 'img-form-tool', hasImage: true, url: '/assets/images/canvas/dropdown.png', level: [0] },
        { name: 'CommentItem', caption: '', activate: true, item_class: 'img-form-tool', hasImage: true, url: '/assets/images/canvas/comment.png', level: [0] },
        { name: 'SingleCheckBoxItem', caption: '', activate: true, item_class: 'img-form-tool', hasImage: true, url: '/assets/images/canvas/single-check.png', level: [0] },
        { name: 'SingleDateItem', caption: '', activate: true, item_class: 'img-form-tool', hasImage: true, url: '/assets/images/canvas/single-date.png', level: [0] }
    ];

    private subs: Rx.Subscription[] = [];

    constructor(
      private changeDetector: ChangeDetectorRef,
      private elementRef: ElementRef,
      private sanitizer: DomSanitizer,
      private renderer: Renderer
	) { }

    ngOnInit() {
        this.swiperConfig.slidesPerView = this.viewMode === 1 ? 3 : 1;

        this.subs = [
		    ];
    }

    ngAfterViewInit() {
        this.directiveRef.update();
    }

    onToolClick(tool: CanvasTool) {
        this.selectedTool.emit(tool.name);
    }

    backgroundImage(url: string): SafeStyle {
        return url ? this.sanitizer.bypassSecurityTrustStyle(`url('${url}')`) : '';
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


