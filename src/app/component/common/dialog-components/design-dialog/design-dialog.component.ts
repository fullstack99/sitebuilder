import {
		Component, Input, Output, EventEmitter, OnInit, OnDestroy, 
		OnChanges, SimpleChanges, ChangeDetectorRef, ElementRef, ViewChild, 
		Renderer, AfterViewInit
	} from '@angular/core';

import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { createColorPickerWindow, ColorPickerForm, ColorRgb, ColorPickerComponent
	} from '@app-dialogs/color-picker/color-picker.component';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { Maybe } from '@app-lib/maybe/maybe';
import { DesignInfo, DefaultDesignInfo } from '@app-models/design-info';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export { DesignInfo, DefaultDesignInfo } from '@app-models/design-info';

export class DesignInfoForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;		
		backColor: FormControl;
		hoverColor: FormControl;
		borderColor: FormControl;
		borderStyle: FormControl;
		borderWidth: FormControl;
		amount: FormControl;
		lTop: FormControl;
		rTop: FormControl;
		lBottom: FormControl;
		rBottom: FormControl;		
	};

	constructor(value: DesignInfo) {
		super({			
			backColor: new FormControl(value.backColor),
			hoverColor: new FormControl(value.hoverColor),
			borderColor: new FormControl(value.borderColor),
			borderStyle: new FormControl(value.borderStyle),
			borderWidth: new FormControl(value.borderWidth),
			amount: new FormControl(value.amount),
			lTop: new FormControl(value.lTop),
			rTop: new FormControl(value.rTop),
			lBottom: new FormControl(value.lBottom),
			rBottom: new FormControl(value.rBottom)			
		});
	}

	updateValue(value: DesignInfo, options: any) {
		const cs = this.controls;		
		cs.backColor.setValue(value.backColor, options);
		cs.hoverColor.setValue(value.hoverColor, options);
		cs.borderColor.setValue(value.borderColor, options);
		cs.borderStyle.setValue(value.borderStyle, options);
		cs.borderWidth.setValue(value.borderWidth, options);
		cs.amount.setValue(value.amount, options);
		cs.lTop.setValue(value.lTop, options);
		cs.rTop.setValue(value.rTop, options);
		cs.lBottom.setValue(value.lBottom, options);
		cs.rBottom.setValue(value.rBottom, options);		
	}
}

export function createDesignDialogWindow(
	windowService: WindowService,
	designInfo: DesignInfo = DesignInfo.empty()
): DialogWindow<DesignDialogComponent> {
	return windowService.create<DesignDialogComponent>(
		DesignDialogComponent,
		{
			width: 400,
			position: {
				left: 'calc(50% - 200px)',
				top: '0px'
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
		comp.designInfo = designInfo,
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	templateUrl: 'design-dialog.component.html',
	styleUrls: ['design-dialog.component.css']
})
export class DesignDialogComponent implements OnInit, OnDestroy {	
	@Input('designInfo') designInfo: DesignInfo;
	@Output('submit') submit = new EventEmitter<DesignInfo>();
	@Output('close') close = new EventEmitter<void>();

	@ViewChild('colorPalette') colorPalette: ElementRef;

	constructor(
		public _changeDetector: ChangeDetectorRef,
		public _elementRef: ElementRef,
		public _renderer: Renderer,
		public _windowService: WindowService,
	) { }

	public _colorElem: JQuery;
	public _elem: HTMLElement;	
	public kendoColorPalette: kendo.ui.ColorPalette;

	public _colorPickerWindow = Maybe.nothing<DialogWindow<ColorPickerComponent>>();
	public _onColorPicked = Maybe.nothing<(color: ColorRgb) => void>();

	public _radius: number[] = [0, 50];
	public _borderWidth: number[] = [0, 50];
	
	public designInfoForm: DesignInfoForm;
	public whichColor: FormControl = new FormControl('1');
	
	public defaultDesignInfo: DefaultDesignInfo = DefaultDesignInfo.empty();
	private _subs: Rx.Subscription[] = [];

	ngOnInit() {
		this._elem = this._elementRef.nativeElement;
		this.designInfoForm = new DesignInfoForm(this.designInfo);
		this._subs = [
			this.designInfoForm.valueChanges.subscribe(() => {
				this.designInfo.amount = Math.floor(this.designInfoForm.value.amount);
				this.designInfo.borderWidth = Math.floor(this.designInfoForm.value.borderWidth);
				this._changeDetector.detectChanges();
			}),
			this.whichColor.valueChanges.subscribe(() => {
				this._changeDetector.detectChanges();
			})
		];	

		this.createColorPaletee();
		this.createWindow();
		if (this.designInfo.backColor == 'transparent')
			this.designInfoForm.controls.backColor.setValue('#ADD8E6');
	}

	createColorPaletee() {
		$(this.colorPalette.nativeElement).kendoColorPalette({
			palette: "basic",
			value: "#ADD8E6",
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
		switch (this.whichColor.value) {
			case "1":
				this.designInfoForm.controls.backColor.setValue(e);				
				break;
			case "2":
				this.designInfoForm.controls.hoverColor.setValue(e);
				break;
			case "3":
				this.designInfoForm.controls.borderColor.setValue(e);
				break;
			default:
		}
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
				this.designInfoForm.controls.backColor.setValue(this.defaultDesignInfo.defaultBackColor);
				break;
			case 2:
				this.designInfoForm.controls.hoverColor.setValue(this.defaultDesignInfo.defaultHoverColor);
				break;
			case 3:
				this.designInfoForm.controls.borderWidth.setValue(0,{emitEvent: false});
				this.designInfoForm.controls.borderColor.setValue(this.defaultDesignInfo.defaultBorderColor);
				break;
		}
	}

	getBorder(): string{		
		if (this.designInfoForm.value.borderColor=='#ffffff') {
			return '#8c8c8c solid 1px';
		}
		else {
			return this.designInfoForm.value.borderColor + ' ' + this.designInfoForm.value.borderStyle + ' ' + this.designInfoForm.value.borderWidth+'px';
		}
	}

	getBorderRadius(arrow: string): number {
		if (this.designInfoForm.get(arrow).value && this.whichColor.value=='4')
			return this.designInfoForm.value.amount;
		else
			return 0;
	}

	onHoverButton(event: Event) {
		let target = event.target || event.srcElement;
		this._renderer.setElementStyle((target as HTMLElement), 'background-color', this.designInfoForm.value.hoverColor);
	}

	onLeaveButton(event: Event) {
		let target = event.target || event.srcElement;
		this._renderer.setElementStyle((target as HTMLElement), 'background-color', this.designInfoForm.value.backColor);
	}

	openFeedbackDialog() {
		createFeedbackDialogWindow(this._windowService, 'ca.n.116').open();		
	}	

	onAdd() {
		let designInfo: DesignInfo = this.designInfoForm.value;
		designInfo.amount = Math.floor(designInfo.amount);
		designInfo.borderWidth = Math.floor(designInfo.borderWidth);		
		// if (this.whichColor.value!='4')
		// 	designInfo.lTop = designInfo.rTop = designInfo.lBottom = designInfo.rBottom = false;
		this.submit.next(designInfo);
	}	

	onClose() {
		this.close.next();
	}

	ngOnDestroy() {
		this._subs.forEach(s => s.unsubscribe());
	}
}
