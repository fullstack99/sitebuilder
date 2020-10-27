import {
	Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef,
	OnDestroy, ElementRef, OnChanges, SimpleChanges, ViewChild, Renderer,
	AfterViewInit, forwardRef
} from '@angular/core';

import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { AbstractControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { createColorPickerWindow, ColorPickerForm, ColorRgb, ColorPickerComponent } from '@app-dialogs/color-picker/color-picker.component';
import { FormControl, FormGroup } from '@angular/forms';
import { Maybe } from '@app-lib/maybe/maybe';
import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

import { BackgroundInfo, BackgroundColorInfo, BackgroundImageInfo, BackgroundTilingInfo, BackgroundVideoInfo, Item } from '@app/models';
import { BorderInfo } from '@app/models';

export { BorderInfo } from '@app/models';

export class BorderInfoForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;
		borderType	 : FormControl;
		borderColor : FormControl;
		borderWidth : FormControl;
		shadow		 : FormControl;
		amount		 : FormControl;
		lTop		 : FormControl;
		rTop		 : FormControl;
		lBottom	 : FormControl;
		rBottom	 : FormControl;
	};

	constructor(value: BorderInfo) {
		super({
			borderType	: new FormControl(value.borderType),
			borderColor	: new FormControl(value.borderColor),
			borderWidth	: new FormControl(value.borderWidth),
			shadow		: new FormControl(value.shadow),
			amount		: new FormControl(value.amount),
			lTop		: new FormControl(value.lTop),
			rTop		: new FormControl(value.rTop),
			lBottom	: new FormControl(value.lBottom),
			rBottom	: new FormControl(value.rBottom)
		});
	}

	updateValue(value: BorderInfo, options: any) {
		const cs = this.controls;
		cs.borderType.setValue(value.borderType, options);
		cs.borderColor.setValue(value.borderColor, options);
		cs.borderWidth.setValue(value.borderWidth, options);
		cs.shadow.setValue(value.shadow, options);
		cs.amount.setValue(value.amount, options);
		cs.lTop.setValue(value.lTop, options);
		cs.rTop.setValue(value.rTop, options);
		cs.lBottom.setValue(value.lBottom, options);
		cs.rBottom.setValue(value.rBottom, options);
	}
}

export function createBorderDialogWindow(
	windowService: WindowService,
	borderInfo: BorderInfo
): DialogWindow<BorderDialogComponent> {
	return windowService.create<BorderDialogComponent>(
		BorderDialogComponent,
		{
			width: 320,
			position: {
				left: 'calc(50% - 160px)',
				top: '50px'
			},
			modal: true,
			draggable: false,
			resizable: true,
			scrollable: true,
			visible: false,
			title: false
		}
	).changeInputs((comp, window) => {
		comp.borderInfo = borderInfo;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	templateUrl: 'border-dialog.component.html',
	styleUrls: ['border-dialog.component.css']
})
export class BorderDialogComponent implements OnInit, OnDestroy, AfterViewInit {

	@Input('borderInfo') borderInfo: BorderInfo;
	@Input('headerfooter') headerfooter: string = '';
	@Output('submit') submit = new EventEmitter<BorderInfo>();
	@Output('close') close = new EventEmitter<void>();

	@ViewChild('resultBorder') resultBorder: ElementRef;
	@ViewChild('colorPalette') colorPalette: ElementRef;

	public _colorElem: JQuery;
	public _elem: HTMLElement;
	public kendoColorPicker: kendo.ui.ColorPicker;
	public kendoColorPalette: kendo.ui.ColorPalette;

	public _colorPickerWindow = Maybe.nothing<DialogWindow<ColorPickerComponent>>();
	public _feedbackWindow: DialogWindow<FeedbackDialogComponent>;
	public _onColorPicked = Maybe.nothing<(color: ColorRgb) => void>();

	public _rangeWidth  = [0, 50];
	public _rangeShadow = [0, 30];
	public _rangeAmount = [0, 50];

	public _sampleInfo: BorderInfo[] = [
		{ borderType: 0, borderColor: '#000000', borderWidth: 2, shadow: 0, amount: 0, lTop: false, rTop: false, lBottom: false, rBottom: false },
		{ borderType: 1, borderColor: 'gray',    borderWidth: 2, shadow: 0, amount: 50, lTop: true, rTop: true, lBottom: true, rBottom: true },
		{ borderType: 2, borderColor: '#0000ff', borderWidth: 2, shadow: 0, amount: 20, lTop: true, rTop: false, lBottom: true, rBottom: true },
		{ borderType: 3, borderColor: '#ff0000', borderWidth: 2, shadow: 0, amount: 20, lTop: false, rTop: true, lBottom: false, rBottom: false },
		{ borderType: 4, borderColor: '#ffff00', borderWidth: 2, shadow: 0, amount: 20, lTop: true, rTop: false, lBottom: false, rBottom: true },
		{ borderType: 5, borderColor: '#00ff00', borderWidth: 2, shadow: 0, amount: 20, lTop: true, rTop: true, lBottom: true, rBottom: true },
	];

	public borderInfoForm: BorderInfoForm;
	public whichColor: FormControl = new FormControl('1');
	public whichAmount: FormControl = new FormControl('0');

	public _subs: Rx.Subscription[] = [];

	constructor(
		public _changeDetector: ChangeDetectorRef,
		public _elementRef: ElementRef,
		public _renderer: Renderer,
		public _windowService: WindowService,
		public _sanitizer: DomSanitizer
	) { }


	ngOnInit() {
		this._elem = this._elementRef.nativeElement;
		this._renderer.setElementStyle(this._elem.parentElement as HTMLElement, 'border-radius', '5px');
		this.borderInfoForm = new BorderInfoForm(this.borderInfo);
		this.whichAmount.setValue(this.borderInfo.borderType.toString(), {});
		this._subs = [
			this.whichColor.valueChanges.subscribe(() => {
				this._changeDetector.detectChanges();
			}),
			this.borderInfoForm.valueChanges.subscribe(() => {
				this.borderInfoForm.patchValue({
					amount: parseInt(this.borderInfoForm.value.amount.toString()),
					borderWidth: parseInt(this.borderInfoForm.value.borderWidth.toString()),
					shadow: parseInt(this.borderInfoForm.value.shadow.toString())
				},{emitEvent:false})
				this._changeDetector.detectChanges();
			})
		];
		this.createColorPaletee();
		this.createWindow();
	}

	selectBorder(i: number) {
		this.borderInfoForm.updateValue(this._sampleInfo[i], {});
	}

	ngAfterViewInit() {
	}

	createColorPaletee() {
		$(this.colorPalette.nativeElement).kendoColorPalette({
			palette: "basic",
			value: "#fff",
			tileSize: {
				width: 10, height: 10
			},
			change: (e: any) => {
				this.palette_change(e.value);
			}
		});
		this.kendoColorPalette = $(this.colorPalette.nativeElement).data("kendoColorPalette");
	}

	createWindow() {
		const colorPicker = createColorPickerWindow(this._windowService, new ColorPickerForm(new ColorRgb()));
		colorPicker.componentRef.instance.close.asObservable().subscribe(color => {
			this._elem.style.setProperty('opacity', '1');
			color.apply(this._onColorPicked);
		});
		this._colorPickerWindow = Maybe.just(colorPicker);
	}

	palette_change(e: string) {
		this.borderInfoForm.controls.borderColor.setValue(e);
		this._changeDetector.detectChanges();
	}

	openColorPicker() {
		this._colorPickerWindow.map(w => {
			this._onColorPicked = Maybe.just((c: ColorRgb) => this.setPickedColor(c.toString()));
			this._elem.style.setProperty('opacity', '0');
			w.open();
		});
	}

	setPickedColor(color: string) {
		Maybe.match(color, /rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
			.map(() => {
				this.palette_change(color);
			});
	}

	clearColor(i: number) {
		this.borderInfoForm.controls.borderColor.setValue('#000000');

	}

	getBorderRadius(item: BorderInfo, arrow: string): string {
		if (item[arrow])
			if (item['borderType']==1)
				return ''+ item.amount + '%';
			else
				return '' + item.amount + 'px';
		else
			return '0px';
	}

	getShadow(borderInfo: BorderInfo): SafeStyle {
		let shadow = borderInfo.shadow;
		let result = '';
		result = shadow + 'px ' + shadow + 'px 5px rgba(0,0,0,0.4)';
		return (this._sanitizer.bypassSecurityTrustStyle(result));

	}

	removeBorder() {
		this.submit.next(undefined);
	}

	openFeedbackDialog() {
		this._feedbackWindow = createFeedbackDialogWindow(this._windowService, 'ca.d.135');
		this._feedbackWindow.open();
	}

	onAdd() {
		this.submit.next(this.borderInfoForm.value);
	}

	onClose() {
		this.close.next();
	}

	ngOnDestroy() { }
}
