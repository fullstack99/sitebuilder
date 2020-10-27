import {
	Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef,
	OnDestroy, ElementRef, OnChanges, SimpleChanges, ViewChild, Renderer2,
	AfterViewInit
} from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import {
	Subscription,
} from 'rxjs';
import {
	get as _get,
	indexOf as _indexOf,
} from 'lodash';
import { SHAPE_TYPE1, SHAPE_TYPE2, SHAPE_TYPE3,
	GLOGOOD_SHAPES, } from '@app-shared/constants/shapes';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { createColorPickerWindow, ColorPickerForm, ColorRgb, ColorPickerComponent } from '@app-dialogs/color-picker/color-picker.component';
import { Maybe } from '@app-lib/maybe/maybe';
import { setSVGToEle, setDIVToEle, setAttributes, setStyle, setPaddingToContainer } from '@app-shared/libs/shapes.lib';

import { Item, ItemContent, ShapeItemContent } from '@app-models/item-info';
import { FeedbackDialogComponent, createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

import { ShapeInfo } from '@app-models/shape-info';

export { ShapeInfo } from '@app-models/shape-info';

export class ShapeInfoForm extends FormGroup {
	controls: {
		[key: string]: AbstractControl;
		shapeType: FormControl;
		lineStyle: FormControl;
		color: FormControl;
		hoverColor: FormControl;
		borderColor: FormControl;
		thickness: FormControl;
		glow: FormControl;
		border: FormControl;
		shadow: FormControl;
		curve: FormControl;
		lTop: FormControl;
		rTop: FormControl;
		lBottom: FormControl;
		rBottom: FormControl;
	};

	constructor(value: ShapeInfo) {
		super({
			shapeType: new FormControl(value.shapeType),
			lineStyle: new FormControl(value.lineStyle),
			color: new FormControl(value.color || 'white'),
			hoverColor: new FormControl(value.hoverColor || ''),
			borderColor: new FormControl(value.borderColor || ''),
			thickness: new FormControl(value.thickness || 2),
			glow: new FormControl(value.glow || 0),
			border: new FormControl(value.border || 2),
			shadow: new FormControl(value.shadow || 0),
			curve: new FormControl(value.curve || 0),
			lTop: new FormControl(value.lTop),
			rTop: new FormControl(value.rTop),
			lBottom: new FormControl(value.lBottom),
			rBottom: new FormControl(value.rBottom)
		});
	}

	updateValue(value: ShapeInfo, options: any) {
		const cs = this.controls;
		cs.shapeType.setValue(value.shapeType, options);
		cs.lineStyle.setValue(value.lineStyle, options);
		cs.color.setValue(value.color, options);
		cs.hoverColor.setValue(value.hoverColor || '', options);
		cs.borderColor.setValue(value.borderColor || '', options);
		cs.thickness.setValue(value.thickness || 0, options);
		cs.glow.setValue(value.glow || 0, options);
		cs.border.setValue(value.border || 0, options);
		cs.shadow.setValue(value.shadow || 0, options);
		cs.curve.setValue(value.curve || 0, options);
		cs.lTop.setValue(value.lTop || false, options);
		cs.rTop.setValue(value.rTop || false, options);
		cs.lBottom.setValue(value.lBottom || false, options);
		cs.rBottom.setValue(value.rBottom || false, options);
	}
}

export function createShapeDialogWindow(
	windowService: WindowService,
	itemContent: ItemContent
): DialogWindow<ShapeDialogComponent> {
	return windowService.create<ShapeDialogComponent>(
		ShapeDialogComponent,
		{
			width: 320,
			position: {
				left: 'calc(50% - 160px)',
				top: '20px'
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
		comp.itemContent = <ShapeItemContent>itemContent;
		comp.submit.subscribe(() => window.close());
		comp.close.subscribe(() => window.close());
	});
}

@Component({
	moduleId: module.id,
	templateUrl: 'shape-dialog.component.html',
	styleUrls: ['shape-dialog.component.css']
})
export class ShapeDialogComponent implements OnInit, OnDestroy, AfterViewInit {
	@Input('itemContent') itemContent: ShapeItemContent = new ShapeItemContent();
	@Input('headerfooter') headerfooter: string = '';
	@Output('submit') submit = new EventEmitter<ShapeItemContent>();
	@Output('close') close = new EventEmitter<void>();

	@ViewChild('resultContainer') resultContainer: ElementRef;
	@ViewChild('resultShape') resultShape: ElementRef;
	@ViewChild('cloneShape') cloneShape: ElementRef;
	@ViewChild('colorPalette') colorPalette: ElementRef;

	@ViewChild('line') line_ele: ElementRef;
	@ViewChild('line_r') line_r_ele: ElementRef;
	@ViewChild('line_lr') line_lr_ele: ElementRef;

	@ViewChild('rect') rect_ele: ElementRef;
	@ViewChild('rect_round') rect_round_ele: ElementRef;
	@ViewChild('rect_quatre') rect_quatre_ele: ElementRef;
	@ViewChild('rect_oval') rect_oval_ele: ElementRef;
	@ViewChild('rect_round_lr') rect_round_lr_ele: ElementRef;

	@ViewChild('arrow_l') arrow_l_ele: ElementRef;
	@ViewChild('arrow_r') arrow_r_ele: ElementRef;
	@ViewChild('arrow_lr') arrow_lr_ele: ElementRef;
	@ViewChild('arrow_u') arrow_u_ele: ElementRef;
	@ViewChild('arrow_d') arrow_d_ele: ElementRef;
	@ViewChild('arrow_ud') arrow_ud_ele: ElementRef;

	@ViewChild('callout_round_rect') callout_round_rect_ele: ElementRef;
	@ViewChild('callout_ellipse') callout_ellipse_ele: ElementRef;
	@ViewChild('callout_cloud') callout_cloud_ele: ElementRef;

	@ViewChild('star_explosion') star_explosion_ele: ElementRef;
	@ViewChild('star_8') star_8_ele: ElementRef;
	@ViewChild('banner') banner_ele: ElementRef;
	@ViewChild('banner_flag') banner_flag_ele: ElementRef;

	public shapeInfoForm: ShapeInfoForm = new ShapeInfoForm(ShapeInfo.empty());
	public _colorElem: JQuery;
	public _elem: HTMLElement;
	public kendoColorPicker: kendo.ui.ColorPicker;
	public kendoColorPalette: kendo.ui.ColorPalette;

	public _colorPickerWindow = Maybe.nothing<DialogWindow<ColorPickerComponent>>();
	public _feedbackWindow: DialogWindow<FeedbackDialogComponent>;
	public _onColorPicked = Maybe.nothing<(color: ColorRgb) => void>();

	public _rangeThickness		= [1, 40];
	public _rangeBorder 	= [1, 20];
	public _rangeGlow 		= [0, 30];
	public _rangeShadow 	= [0, 100];
	public _rangeCurve = [0, 100];

	public _selectShape: boolean = true;

	public defaultShapeInfo = { color: '#ffffff', borderColor: '#ffffff', hoverColor: '#ffffff', borderWidth: 1};
	public current_shape = '';
	public whichColor: FormControl = new FormControl('3');

	private _subs: Subscription[] = [];

	constructor(
		private _changeDetector: ChangeDetectorRef,
		private _elementRef: ElementRef,
		private _renderer: Renderer2,
		private _windowService: WindowService,
		private _sanitizer: DomSanitizer
	) {}

	ngOnInit() {
		const info = this.itemContent.info.getDef(ShapeInfo.empty());
		this._elem = this._elementRef.nativeElement;
		this.current_shape = info.shapeType;
		this._selectShape = true;
		this.shapeInfoForm = new ShapeInfoForm(info);
	}

	ngAfterViewInit() {
		if (this.current_shape != '')
			this.selectShape(this.current_shape, 1);
		this.setShapes();
		this.createColorPaletee();
		this.createColorPickerWindow();

		this._subs = [
			this.shapeInfoForm.valueChanges.subscribe(() => {
				this.setResultShapeStyle();
			}),
			this.whichColor.valueChanges.subscribe(() => {
				this.setColor();
				this._changeDetector.detectChanges();
			})
		];
	}

	setShapes() {
		setSVGToEle('line', GLOGOOD_SHAPES['line'].attributes, this.line_ele.nativeElement);
		setSVGToEle('line_r', GLOGOOD_SHAPES['line_r'].attributes, this.line_r_ele.nativeElement);
		setSVGToEle('line_lr', GLOGOOD_SHAPES['line_lr'].attributes, this.line_lr_ele.nativeElement);

		setSVGToEle('arrow_l', GLOGOOD_SHAPES['arrow_l'].attributes, this.arrow_l_ele.nativeElement);
		setSVGToEle('arrow_r', GLOGOOD_SHAPES['arrow_r'].attributes, this.arrow_r_ele.nativeElement);
		setSVGToEle('arrow_u', GLOGOOD_SHAPES['arrow_u'].attributes, this.arrow_u_ele.nativeElement);
		setSVGToEle('arrow_d', GLOGOOD_SHAPES['arrow_d'].attributes, this.arrow_d_ele.nativeElement);
		setSVGToEle('arrow_lr', GLOGOOD_SHAPES['arrow_lr'].attributes, this.arrow_lr_ele.nativeElement);
		setSVGToEle('arrow_ud', GLOGOOD_SHAPES['arrow_ud'].attributes, this.arrow_ud_ele.nativeElement);

		setDIVToEle('rect', GLOGOOD_SHAPES['rect'].attributes, this.rect_ele.nativeElement);
		setDIVToEle('rect_round', GLOGOOD_SHAPES['rect_round'].attributes, this.rect_round_ele.nativeElement);
		setDIVToEle('rect_quatre', GLOGOOD_SHAPES['rect_quatre'].attributes, this.rect_quatre_ele.nativeElement);
		setDIVToEle('rect_oval', GLOGOOD_SHAPES['rect_oval'].attributes, this.rect_oval_ele.nativeElement);
		setDIVToEle('rect_round_lr', GLOGOOD_SHAPES['rect_round_lr'].attributes, this.rect_round_lr_ele.nativeElement);

		setSVGToEle('callout_round_rect', GLOGOOD_SHAPES['callout_round_rect'].attributes, this.callout_round_rect_ele.nativeElement);
		setSVGToEle('callout_ellipse', GLOGOOD_SHAPES['callout_ellipse'].attributes, this.callout_ellipse_ele.nativeElement);
		setSVGToEle('callout_cloud', GLOGOOD_SHAPES['callout_cloud'].attributes, this.callout_cloud_ele.nativeElement);

		setSVGToEle('star_explosion', GLOGOOD_SHAPES['star_explosion'].attributes, this.star_explosion_ele.nativeElement);
		setSVGToEle('star_8', GLOGOOD_SHAPES['star_8'].attributes, this.star_8_ele.nativeElement);
		setSVGToEle('banner', GLOGOOD_SHAPES['banner'].attributes, this.banner_ele.nativeElement);
		setSVGToEle('banner_flag', GLOGOOD_SHAPES['banner_flag'].attributes, this.banner_flag_ele.nativeElement);
	}

	viewSelectShape() {
		this._selectShape = true;
		this.current_shape = '';
		this._changeDetector.detectChanges();
	}

	createColorPaletee() {
		$(this.colorPalette.nativeElement).kendoColorPalette({
			palette: 'basic',
			value: this.shapeInfoForm.value.shapeType == 'line' ? (this.shapeInfoForm.value.color ? this.shapeInfoForm.value.color : '#ffaabb') : this.shapeInfoForm.value.borderColor ? this.shapeInfoForm.value.borderColor : '#ffaabb',
			tileSize: {
				width: 10, height: 10
			},
			change: (e: any) => {
				this.palette_change(e.value);
			}
		});
		this.kendoColorPalette = $(this.colorPalette.nativeElement).data('kendoColorPalette');
	}

	createColorPickerWindow() {
		const colorPicker = createColorPickerWindow(this._windowService, new ColorPickerForm(new ColorRgb()));
		colorPicker.componentRef.instance.close.asObservable().subscribe(color => {
			this._elem.style.setProperty('opacity', '1');
			color.apply(this._onColorPicked);
		});
		this._colorPickerWindow = Maybe.just(colorPicker);
	}

	palette_change(e: string) {
		if (this.isLine()) {
			this.shapeInfoForm.controls.color.setValue(e);
		} else {
			switch (this.whichColor.value) {
				case '1':
					this.shapeInfoForm.controls.color.setValue(e);
					break;
				case '2':
					this.shapeInfoForm.controls.hoverColor.setValue(e);
					break;
				case '3':
					this.shapeInfoForm.controls.borderColor.setValue(e);
					break;
			}
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
		const colorPalette = $(this.colorPalette.nativeElement).data('kendoColorPalette');

		switch (i) {
			case 1:
				this.shapeInfoForm.controls.color.setValue('');
				colorPalette.value(this.defaultShapeInfo.color);
				break;
			case 2:
				this.shapeInfoForm.controls.hoverColor.setValue('');
				colorPalette.value(this.defaultShapeInfo.hoverColor);
				break;
			case 3:
				this.shapeInfoForm.controls.borderColor.setValue('');
				colorPalette.value(this.defaultShapeInfo.borderColor);
				break;
		}
	}

	setColor() {
		const colorPalette = $(this.colorPalette.nativeElement).data('kendoColorPalette');

		if (!colorPalette) return;
		if (this.isLine()) {
			if (!this.shapeInfoForm.value.color || this.shapeInfoForm.value.color == 'white')
				colorPalette.value('black');
			else
				colorPalette.value(this.shapeInfoForm.value.color);
		} else {
			switch (this.whichColor.value) {
				case '1':
					colorPalette.value(this.shapeInfoForm.value.color);
					break;
				case '2':
					colorPalette.value(this.shapeInfoForm.value.hoverColor ? this.shapeInfoForm.value.hoverColor : '#ffaabb');
					break;
				case '3':
					colorPalette.value(this.shapeInfoForm.value.borderColor ? this.shapeInfoForm.value.borderColor : '#ffaabb');
					break;
			}
		}
	}

	onHoverShape(event: Event) {
		const ele = this.resultShape.nativeElement as HTMLElement;

		if (this.isRectangle()) {
			this._renderer.setStyle(ele, 'background-color', _get(this.shapeInfoForm, ['value', 'hoverColor']) || 'unset');
		} else if (this.isShape()) {
			const child_ele = $(ele).find('g')[0] as HTMLElement;
			if (child_ele) {
				this._renderer.setStyle(child_ele, 'fill', _get(this.shapeInfoForm, ['value', 'hoverColor']) || 'unset');
			}
		}
		this._changeDetector.detectChanges();
	}

	onLeaveShape(event: Event) {
		const ele = this.resultShape.nativeElement as HTMLElement;

		if (this.isRectangle()) {
			this._renderer.setStyle(ele, 'background-color', _get(this.shapeInfoForm, ['value', 'color']) || 'unset');
		} else if (this.isShape()) {
			const child_ele = $(ele).find('g')[0] as HTMLElement;
			if (child_ele) {
				this._renderer.setStyle(child_ele, 'fill', _get(this.shapeInfoForm, ['value', 'color']) || 'unset');
			}
		}
		this._changeDetector.detectChanges();
	}

	setShadow() {
		const shadow = _get(this.shapeInfoForm, ['value', 'shadow'], 0);
		const glow = _get(this.shapeInfoForm, ['value', 'glow'], 0);

		const resultShapeEle = this.resultShape.nativeElement as HTMLElement;
		const cloneEle = this.cloneShape.nativeElement as HTMLElement;

		const svgEle = $(resultShapeEle).children('svg')[0].cloneNode(true) as HTMLElement;
		cloneEle.innerHTML = '';
		cloneEle.appendChild(svgEle);

		const g = $(svgEle).find('g')[0] as HTMLElement;

		if (g) {
			g.setAttribute('filter', 'url(#shape-filter)');
			this._renderer.setStyle(g, 'fill', '#8c8c8c');
		}
		// this._renderer.setStyle(child_ele, 'stroke', this.shapeInfoForm.value.borderColor);
		// this._renderer.setStyle(child_ele, 'stroke-width', (this.shapeInfoForm.value.border ? this.shapeInfoForm.value.border : 1) + 'px');

		const blur_ele = $(this.resultContainer.nativeElement as HTMLElement).find('feGaussianBlur')[0] as HTMLElement;

		if (blur_ele)
			blur_ele.setAttribute('stdDeviation', `${glow}`);
		this._renderer.setStyle(cloneEle, 'left', `${shadow}px`);
		this._renderer.setStyle(cloneEle, 'top', `${shadow}px`);
	}

	getBorderRadius(arrow: string): string {
		if (this.shapeInfoForm.value[arrow]) {
			return _get(this.shapeInfoForm, ['value', 'curve']) + '%';
		} else {
			return '0%';
		}
	}

	openFeedbackDialog() {
		this._feedbackWindow = createFeedbackDialogWindow(this._windowService, 'ca.b.125');
		this._feedbackWindow.open();
	}

	isLine(): boolean {
		return _indexOf(SHAPE_TYPE1, this.current_shape) > -1 ? true : false;
	}

	isRectangle(): boolean {
		return _indexOf(SHAPE_TYPE2, this.current_shape) > -1 ? true : false;
	}

	isShape(): boolean {
		return _indexOf(SHAPE_TYPE3, this.current_shape) > -1 ? true : false;
	}

	setResultShapeStyle() {
		const ele = this.resultShape.nativeElement as HTMLElement;

		if (this.isRectangle()) {
			const shadow = _get(this.shapeInfoForm, ['value', 'shadow'], 0);
			const glow = _get(this.shapeInfoForm, ['value', 'glow'], 0);
			let result = `${shadow}px ${shadow}px`;
			result = `${result} ${glow}px rgba(0,0,0,0.4)`;

			setStyle(
				{
					'background-color': this.shapeInfoForm.value.color,
					'border-color': this.shapeInfoForm.value.borderColor,
					'border-style': 'solid',
					'border-width': this.shapeInfoForm.value.borderColor ? (this.shapeInfoForm.value.thickness ? `${this.shapeInfoForm.value.thickness}px` : `1px`) : 0,
					'border-top-left-radius': this.getBorderRadius('lTop'),
					'border-top-right-radius': this.getBorderRadius('rTop'),
					'border-bottom-left-radius': this.getBorderRadius('lBottom'),
					'border-bottom-right-radius': this.getBorderRadius('rBottom'),
					'box-shadow': result,
					'width': '100%',
					'height': '100%',
				},
				ele
			);
			(this.cloneShape.nativeElement as HTMLElement).innerHTML = '';
			(this.resultShape.nativeElement as HTMLElement).style.paddingLeft = '0';
			(this.resultShape.nativeElement as HTMLElement).style.paddingRight = '0';
			(this.resultShape.nativeElement as HTMLElement).style.paddingTop = '0';
			(this.resultShape.nativeElement as HTMLElement).style.paddingBottom = '0';
		} else if (this.isLine()) {
			let child_ele: any = $(ele).find('path')[0];

			if (child_ele) {
				setAttributes(
					{
						'color': this.shapeInfoForm.value.color,
						'stroke-dasharray': this.shapeInfoForm.value.lineStyle
					},
					child_ele
				);
			}

			child_ele = $(ele).find('g')[0];

			if (child_ele) {
				setAttributes(
					{
						'stroke': this.shapeInfoForm.value.color,
						'stroke-width': `${_get(this.shapeInfoForm, ['value', 'thickness'], 1)}px`,
					},
					child_ele
				);
			}

			this.setShadow();
			setPaddingToContainer(1, GLOGOOD_SHAPES[this.current_shape]['tanA'], this.resultShape.nativeElement);
			setPaddingToContainer(1, GLOGOOD_SHAPES[this.current_shape]['tanA'], this.cloneShape.nativeElement);
		} else {
			const child_ele: any = $(ele).find('g')[0];
			const stroke_width = _get(this.shapeInfoForm, ['value', 'border'], 1);

			if (child_ele) {
				setAttributes(
					{
						'stroke': this.shapeInfoForm.value.borderColor,
						'stroke-width': `${stroke_width}px`,
						'stroke-dasharray': this.shapeInfoForm.value.lineStyle,
						'fill': this.shapeInfoForm.value.color,
						'fill-rule': 'evenodd'
					},
					child_ele
				);
			}

			this.setShadow();
			setPaddingToContainer(stroke_width, GLOGOOD_SHAPES[this.current_shape]['tanA'], this.resultShape.nativeElement);
			setPaddingToContainer(stroke_width, GLOGOOD_SHAPES[this.current_shape]['tanA'], this.cloneShape.nativeElement);
		}
		this._changeDetector.detectChanges();
	}

	selectShape(shape: string, flag: number = 0) {
		if (this.resultShape) {
			const containerEle = this.resultContainer.nativeElement as HTMLElement;
			const ele = this.resultShape.nativeElement as HTMLElement;

			this.current_shape = shape;
			this._selectShape = false;

			ele.innerHTML = '';
			ele.removeAttribute('style');

			switch (shape) {
				case 'rect':
					if (!flag)
						this.shapeInfoForm.patchValue(
							{ 	...ShapeInfo.empty(),
								shapeType: shape,
								lTop: false,
								rTop: false,
								lBottom: false,
								rBottom: false,
							},
							{ emitEvent: false }
						);
					this.setSize(containerEle, 80, 80);
					break;
				case 'rect_round':
					this.shapeInfoForm.patchValue(
						{
							...ShapeInfo.empty(),
							shapeType: shape,
							lTop: true,
							rTop: true,
							lBottom: true,
							rBottom: true,
							curve: 10,
						},
						{ emitEvent: false }
					);
					this.setSize(containerEle, 80, 80);
					break;
				case 'rect_quatre':
					if (!flag)
						this.shapeInfoForm.patchValue(
							{
								...ShapeInfo.empty(),
								shapeType: shape,
								lTop: false,
								rTop: true,
								lBottom: false,
								rBottom: false,
								curve: 100,
							},
							{ emitEvent: false }
						);
					this.setSize(containerEle, 80, 80);
					break;
				case 'rect_oval':
					if (!flag)
						this.shapeInfoForm.patchValue(
							{
								...ShapeInfo.empty(),
								shapeType: shape,
								lTop: false,
								rTop: false,
								lBottom: false,
								rBottom: false,
								curve: 50,
							},
							{ emitEvent: false }
						);
					this.setSize(containerEle, 80, 80);
					break;
				case 'rect_round_lr':
					if (!flag)
						this.shapeInfoForm.patchValue(
							{
								...ShapeInfo.empty(),
								shapeType: shape,
								lTop: false,
								rTop: true,
								lBottom: true,
								rBottom: false,
								curve: 10,
							},
							{ emitEvent: false }
						);
					this.setSize(containerEle, 80, 80);
					break;

				case 'line':
				case 'line_r':
				case 'line_lr':
					if (!flag)
						this.shapeInfoForm.patchValue(
							{
								...ShapeInfo.empty(),
								shapeType: shape,
								color: 'black',
								thickness: 2,
							},
							{
								emitEvent: false,
							}
						);

					this.setSize(containerEle, 150, 30);
					setSVGToEle(shape, {}, ele);
					break;
				default:
					if (!flag)
						this.shapeInfoForm.patchValue(
							{
								...ShapeInfo.empty(),
								shapeType: shape,
								color: 'white',
								border: 2,
							},
							{
								emitEvent: false,
							}
						);
					this.setSize(containerEle, 80, 80);
					setSVGToEle(shape, {}, ele);
			}

			setTimeout(() => {
				this.setResultShapeStyle();
				this.setColor();
			});
		}
	}

	setSize(ele: HTMLElement, width: number, height: number) {
		this._renderer.setStyle(ele, 'height', `${height}px`);
		this._renderer.setStyle(ele, 'width', `${width}px`);
	}

	getInt(value: number) {
		return Math.floor(value);
	}

	onCanvasMouseDown(event: MouseEvent) {
		event.stopPropagation();
	}

	onAdd() {
		const result = this.itemContent
			.setInfo(Maybe.just(this.shapeInfoForm.value));

		this.submit.next(result);
	}

	onClose() {
		this.close.next();
	}

	ngOnDestroy() {}
}

