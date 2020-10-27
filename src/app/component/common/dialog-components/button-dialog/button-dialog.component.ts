import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef,	OnDestroy, ElementRef, ViewChild, Renderer,	AfterViewInit } from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { Maybe } from '@app-lib/maybe/maybe';

import { createColorPickerWindow, ColorPickerForm, ColorRgb, ColorPickerComponent } from '@app-dialogs/color-picker/color-picker.component';
import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { CommonItemContent, ButtonInfo } from '@app/models';

import { WindowService, DialogWindow } from '@app-common/window/window.service';
export { ButtonInfo } from '@app/models';

export class ButtonInfoForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;
		text		: FormControl;
		buttonType	: FormControl;
		backColor	: FormControl;
		hoverColor	: FormControl;
		borderColor: FormControl;
		wPadding	: FormControl;
		hPadding	: FormControl;
		width		: FormControl;
		height		: FormControl;
		border		: FormControl;
		corner		: FormControl;
		glow		: FormControl;
		shadow		: FormControl;
		bevel		: FormControl;
	};

	constructor(value: ButtonInfo) {
		super({
			text		: new FormControl(value.text),
			buttonType  : new FormControl(value.buttonType),
			backColor	: new FormControl(value.backColor),
			hoverColor	: new FormControl(value.hoverColor),
			borderColor: new FormControl(value.borderColor),
			wPadding	: new FormControl(value.wPadding),
			hPadding	: new FormControl(value.hPadding),
			width		: new FormControl(value.width),
			height		: new FormControl(value.height),
			border		: new FormControl(value.border),
			corner		: new FormControl(value.corner),
			glow		: new FormControl(value.glow),
			shadow		: new FormControl(value.shadow),
			bevel		: new FormControl(value.bevel)
		});
	}

	updateValue(value: ButtonInfo, options: any) {
		const cs = this.controls;
		cs.text.setValue(value.text, options);
		cs.buttonType.setValue(value.buttonType, options);
		cs.backColor.setValue(value.backColor, options);
		cs.hoverColor.setValue(value.hoverColor, options);
		cs.borderColor.setValue(value.borderColor, options);
		cs.wPadding.setValue(value.wPadding, options);
		cs.hPadding.setValue(value.hPadding, options);
		cs.width.setValue(value.width, options);
		cs.height.setValue(value.height, options);
		cs.border.setValue(value.border, options);
		cs.corner.setValue(value.corner, options);
		cs.glow.setValue(value.glow, options);
		cs.shadow.setValue(value.shadow, options);
		cs.bevel.setValue(value.bevel, options);
	}
}

export function createButtonDialogWindow(
	windowService: WindowService,
	itemContent: CommonItemContent<ButtonInfo>
): DialogWindow<ButtonDialogComponent> {
	return windowService.create<ButtonDialogComponent>(
		ButtonDialogComponent,
		{
			width: 320,
			position: {
				left: 'calc(50% - 160px)',
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
		comp.itemContent = itemContent;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	templateUrl: 'button-dialog.component.html',
	styleUrls: ['button-dialog.component.css']
})
export class ButtonDialogComponent implements OnInit, OnDestroy, AfterViewInit {

	@Input() itemContent: CommonItemContent<ButtonInfo> = new CommonItemContent<ButtonInfo>(Maybe.just(ButtonInfo.empty()));
	@Input() headerfooter: string = '';
	@Output() submit = new EventEmitter<CommonItemContent<ButtonInfo>>();
	@Output() close = new EventEmitter<void>();

	@ViewChild('resultButton') resultButton: ElementRef;
	@ViewChild('textEditor') textEditor: ElementRef;
	@ViewChild('colorPalette') colorPalette: ElementRef;

	public _colorElem: JQuery;
	public _elem: HTMLElement;
	public kendoColorPicker: kendo.ui.ColorPicker;
	public kendoColorPalette: kendo.ui.ColorPalette;

	public _colorPickerWindow = Maybe.nothing<DialogWindow<ColorPickerComponent>>();
	public _feedbackWindow : DialogWindow<FeedbackDialogComponent>;
	public _onColorPicked = Maybe.nothing<(color: ColorRgb) => void>();

	public _rangeWPadding	= [0, 100];
	public _rangeHPadding 	= [0, 100];
	public _rangeBorder 	= [0, 50];
	public _rangeCorner 	= [0, 100];
	public _rangeGlow 		= [0, 50];
	public _rangeShadow 	= [0, 30];
	public _rangeBevel 	= [0, 100];

	public textEditorEnabled = false;

	public _sampleInfo: ButtonInfo[] = [
		{ text: '<p style="margin: auto; font-size: 14px; color: rgb(27, 27, 27); font-weight: bold;">My Button</p>', buttonType: 0, backColor: '#00bff3', borderColor: '#8a8a8a', hoverColor: '#04c9ff', wPadding: 3, hPadding: 2, width: 97, height: 30, border: 2, corner: 10, glow: 0, shadow: 0, bevel: 0 },
		{ text: '<p style="margin: auto; font-size: 14px; color: rgb(27, 27, 27); font-weight: bold;">Sign Up</p>', buttonType: 1, backColor: '#abcd90', borderColor: '#454545', hoverColor: '#c1e3a2', wPadding: 18, hPadding: 6, width: 89, height: 35, border: 1, corner: 9, glow: 10, shadow: 5, bevel: 0 },
		{ text: '<p style="margin: auto; font-size: 16px; color: rgb(255, 255, 255); font-weight: bold;">Go</p>', buttonType: 2, backColor: '#5a5ab7', borderColor: '#5050b8', hoverColor: '#6c6cca', wPadding: 10, hPadding: 10, width: 45, height: 46, border: 0, corner: 27, glow: 0, shadow: 0, bevel: 2 },
		{ text: '<p style="margin: auto; font-size: 14px; color: rgb(255, 255, 255); font-weight: bold;">Buy Now</p>', buttonType: 3, backColor: '#09affd', borderColor: '#09affd', hoverColor: '#2cbcff', wPadding: 15, hPadding: 6, width: 89, height: 35, border: 1, corner: 0, glow: 0, shadow: 0, bevel: 4 },
		{ text: '<p style="margin: auto; font-size: 14px; color: rgb(255, 0, 0); font-weight: bold;">DONATE</p>', buttonType: 4, backColor: '#fafd04', borderColor: '#f85e28', hoverColor: '#f8fa3c', wPadding: 12, hPadding: 6, width: 100, height: 40, border: 3, corner: 40, glow: 0, shadow: 0, bevel: 0 }
	];

	public defaultButtonInfo = { text: '<p style="margin: auto; font-size: 14px; color: rgb(27, 27, 27);">My Button</p>', backColor: '#ffffff', borderColor: '#ffffff', hoverColor: '#ffffff', wPadding: 3, hPadding: 2, width: 97, height: 30, border: 3, corner: 15, glow: 0, shadow: 0, bevel: 0 };

	public buttonInfoForm: ButtonInfoForm;
	public whichColor: FormControl = new FormControl('1');
	public whichAmount: FormControl = new FormControl('0');

	public _subs: Rx.Subscription[] = [];

	constructor(
		public _changeDetector: ChangeDetectorRef,
		public _elementRef: ElementRef,
		public _renderer: Renderer,
		public _windowService: WindowService,
		public _sanitizer: DomSanitizer
	) {}

	public onTextEditorClick(event: MouseEvent): void {
		event.stopPropagation();
		event.preventDefault();
		if (!this.textEditorEnabled) {
			this.textEditorEnabled = true;
		}
		this._changeDetector.detectChanges();
	}

	public setDisableEditor(): void {
		if (this.textEditorEnabled) {
			this.textEditorEnabled = false;
		}
		this._changeDetector.detectChanges();
	}

	ngOnInit() {
		let buttonInfo = this.itemContent.info.getDef(ButtonInfo.empty());
		this._elem = this._elementRef.nativeElement;
		this._renderer.setElementStyle(this._elem.parentElement as HTMLElement, 'border-radius', '5px');

		this.buttonInfoForm = new ButtonInfoForm(buttonInfo);
		this.whichAmount.setValue(buttonInfo.buttonType.toString(), {});
		this.setButtonText(this.buttonInfoForm.value.text);
		this._subs = [
			this.whichColor.valueChanges.subscribe(() => {
				this._changeDetector.detectChanges();
			}),
			this.buttonInfoForm.valueChanges.subscribe(() => {
				this._changeDetector.detectChanges();
			})
		];
		this.createColorPaletee();
		this.createWindow();
	}

	selectButton(i: number) {
		this.buttonInfoForm.updateValue(this._sampleInfo[i], {});
		this.buttonInfoForm.controls.text.setValue(this._sampleInfo[i].text);
		this.setButtonText(this._sampleInfo[i].text);
	}

	setButtonText(text: string) {
		if (this.textEditor) {
			let ele = this.textEditor.nativeElement as HTMLElement;
			ele.innerHTML = text;
			this._renderer.setElementStyle(ele.getElementsByTagName('p').item(0) as HTMLElement, 'margin', 'auto');
		}
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
		colorPicker.componentRef.instance.close.subscribe(color => {
			this._elem.style.setProperty('opacity', '1');
			color.apply(this._onColorPicked);
		});
		this._colorPickerWindow = Maybe.just(colorPicker);
	}

	palette_change(e: string) {
		switch (this.whichColor.value) {
			case "1":
				this.buttonInfoForm.controls.backColor.setValue(e);
				break;
			case "2":
				this.buttonInfoForm.controls.hoverColor.setValue(e);
				break;
			case "3":
				this.buttonInfoForm.controls.borderColor.setValue(e);
				break;
			default:
		}
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
		switch (i) {
			case 1:
				this.buttonInfoForm.controls.backColor.setValue(this.defaultButtonInfo.backColor);
				break;
			case 2:
				this.buttonInfoForm.controls.hoverColor.setValue(this.defaultButtonInfo.hoverColor);
				break;
			case 3:
				this.buttonInfoForm.controls.borderColor.setValue(this.defaultButtonInfo.borderColor);
				break;
		}
	}

	getButtonText(text: string): SafeHtml {
		return (this._sanitizer.bypassSecurityTrustHtml(text));
	}

	getShadow(buttonInfo: ButtonInfo): SafeStyle {
		let bevel = buttonInfo.bevel;
		let glow = buttonInfo.glow;
		let shadow = buttonInfo.shadow;
		let result = '';
		result = shadow + 'px ' + shadow + 'px ';
		result += glow + 'px rgba(0,0,0,0.4),';
		result += ' inset ' + bevel + 'px ' + bevel + 'px 2px rgba(255,255,255,0.6),';
		result += ' inset -' + bevel + 'px -' + bevel + 'px 2px rgba(0,0,0,0.4)';
		return (this._sanitizer.bypassSecurityTrustStyle(result));
	}

	onEditorInput(event: string) {
		if (event == '')
			return;
		if (this.textEditor) {
			this.buttonInfoForm.controls.text.setValue(event,{});
			let ele = this.textEditor.nativeElement as HTMLElement;
			this._renderer.setElementStyle(ele.getElementsByTagName('p').item(0) as HTMLElement, 'margin', 'auto');
		}
	}

	onHoverButton(event: Event) {
		this._renderer.setElementStyle(this.resultButton.nativeElement, 'background-color', this.buttonInfoForm.value.hoverColor);
	}

	onLeaveButton(event: Event) {
		this._renderer.setElementStyle(this.resultButton.nativeElement, 'background-color', this.buttonInfoForm.value.backColor);
	}

	openFeedbackDialog() {
		this._feedbackWindow = createFeedbackDialogWindow(this._windowService, 'ca.b.125');
		this._feedbackWindow.open();
	}

	onAdd() {
		this.setDisableEditor();
		setTimeout(() => {
			let buttonInfo = this.buttonInfoForm.value;
			let left = this.itemContent.box.left;
			let top = this.itemContent.box.top;
			buttonInfo.width = (this.resultButton.nativeElement as HTMLElement).offsetWidth;
			buttonInfo.height = (this.resultButton.nativeElement as HTMLElement).offsetHeight;

			this.submit.next(
				this.itemContent
					.setInfo(Maybe.just(buttonInfo))
					.setBox(this.itemContent.box.setRight(left+buttonInfo.width).setBottom(top+buttonInfo.height))
				);
		});
	}

	onClose() {
		this.setDisableEditor();
		this.close.next();
	}

	ngOnDestroy() {

	}
}
