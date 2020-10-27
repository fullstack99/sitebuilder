import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef,OnDestroy, ElementRef, OnChanges, SimpleChanges, ViewChild, Renderer, AfterViewInit
} from '@angular/core';
import { trigger,style,transition,animate,keyframes,query,stagger } from '@angular/animations';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { Ng2Highcharts } from 'ng2-highcharts';
import * as Rx from 'rxjs/Rx';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

export function createChartDialogWindow(
	windowService: WindowService,
	title: string = '',
	categories: string[],
	series: any
	
): DialogWindow<ChartDialogComponent> {
	return windowService.create<ChartDialogComponent>(
		ChartDialogComponent,
		{
			width: 480,
			position: {
				left: 'calc(50% - 240px)',
				top: '50px'
			},
			maxHeight: 1000,
			modal: true,
			draggable: false,
			resizable: true,
			scrollable: false,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.title = title;
		comp.categories = categories;
		comp.series = series;
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	templateUrl: 'chart-dialog.component.html',
	styleUrls: ['chart-dialog.component.css']	
})
export class ChartDialogComponent implements OnInit, OnDestroy, AfterViewInit {
	@Input() title: String = '';
	@Input() categories: string[] = [];
	@Input() series: any = [];
	@Output('close') close = new EventEmitter<void>();   
		
	@ViewChild(Ng2Highcharts) chartElement: Ng2Highcharts;

	chartTypes = ['pie','bar','line','area','column'];
	chartOptions: any;
	selectedChartType: string = 'pie';	
	private subs: Rx.Subscription[] = [];

	constructor(
		private changeDetector: ChangeDetectorRef,
		private elementRef: ElementRef,
		private renderer: Renderer,
		private windowService: WindowService,
		private sanitizer: DomSanitizer
	) {}	

	ngOnInit() {

		this.chartOptions = {
			chart: {
				plotBackgroundColor: null,
				plotBorderWidth: null,
				plotShadow: false,
				type: this.selectedChartType,
				zoomType: 'x',
				width: 450,
				height: 300
			},
			credits: {
				enabled: false
			},
			legend: {
				layout: 'vertical',
				align: 'right',
				verticalAlign: 'middle'
			},
			title: {
				text: this.title
			},
			
			plotOptions: {
				allowPointSelect: true,
				cursor: 'pointer',
				pie: {					
					dataLabels: {
						enabled: true,
						format: '<b>{point.name}</b>: {point.percentage:.1f} %',
						style: {
							color: 'black'
						}
					}
				}				
			},
			xAxis: {
				categories: this.categories
			},
			series: this.series			
		}		
	}   

	ngAfterViewInit() {		
	}

	onDownload() {

	}

	onSelectChartType(type: string) {		
		this.chartOptions.chart.type = type;		
		this.chartElement.draw(this.chartOptions);		
	}
		
	openFeedbackDialog() {
		let feedbackWindow = createFeedbackDialogWindow(this.windowService, 'ch.125');
		feedbackWindow.open();
	}
	
	onClose() {	
		this.close.next();
	}

	ngOnDestroy() {
		
	}	
}