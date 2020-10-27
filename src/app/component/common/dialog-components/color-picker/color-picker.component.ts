import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy,
		 Renderer, ViewChild, ElementRef, HostListener
	   } from '@angular/core';
import { Observable, Subject, BehaviorSubject, Subscription } from 'rxjs';

import * as lodash from 'lodash';

import { FormGroup, AbstractControl, FormControl } from '@angular/forms';
import { drawVerticalGradientLine, ColorRgba, ColorRgbaLinearGradient } from '@app-lib/dom/graphics';
import { pageToElement } from '@app-lib/dom/dom';
import { DragSessionService } from '@app-directives/drag-session/drag-session.service';
import { Maybe } from '@app-lib/maybe/maybe';

import { AppService } from '@app/app.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

/** */
export function createColorPickerWindow(
	windowService: WindowService,
	form: ColorPickerForm
): DialogWindow<ColorPickerComponent> {
	return windowService.create<ColorPickerComponent>(
		ColorPickerComponent,
		{
			width: 700,
			height: 400,
			modal: true,
			draggable: false,
			resizable: false,
			scrollable: false,
			visible: false,
			title: false
		}
	)
	.changeInputs((comp, window) => {
		comp.form = form;
		comp.close.subscribe(() => window.close());
	});
}

/** RGB color. Channels values are integers in range 0..255. */
export class ColorRgb {
	get r(): number { return this._r; } public _r: number;
	get g(): number { return this._g; } public _g: number;
	get b(): number { return this._b; } public _b: number;

	get hex(): string {
		return lodash.padStart(this.r.toString(16), 2, '0')
			 + lodash.padStart(this.g.toString(16), 2, '0')
			 + lodash.padStart(this.b.toString(16), 2, '0');
	}

	static fromHex(hex: string) {
		const str = lodash.padStart(hex, 6, '0');
		return new ColorRgb(
			parseInt(str.slice(0, 2), 16),
			parseInt(str.slice(2, 4), 16),
			parseInt(str.slice(4, 6), 16)
		);
	}

	constructor(
		r = 0,
		g = 0,
		b = 0
	) {
		this._r = lodash.clamp(Math.round(r), 0, 255);
		this._g = lodash.clamp(Math.round(g), 0, 255);
		this._b = lodash.clamp(Math.round(b), 0, 255);
	}

	toString() {
		return `rgb(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)})`;
	}
}

export class ColorPickerForm extends FormGroup {

	get colorValue(): ColorRgb {
		return new ColorRgb(
			this.controls.r.value, this.controls.g.value, this.controls.b.value);
	}

	get valueColorChanges(): Observable<ColorRgb> { return this._changes; }

	public _changes: Observable<ColorRgb>;

	constructor(value: ColorRgb) {
		super({
			r  : new FormControl(value.r),
			g  : new FormControl(value.g),
			b  : new FormControl(value.b),
			hex: new FormControl(value.hex)
		});

		const r   = this.controls.r  .valueChanges.startWith(value.r  );
		const g   = this.controls.g  .valueChanges.startWith(value.g  );
		const b   = this.controls.b  .valueChanges.startWith(value.b  );
		const hex = this.controls.hex.valueChanges.startWith(value.hex);

		Observable.combineLatest(r, g, b)
			.subscribe(([r, g, b]) =>
				this.controls.hex.setValue(new ColorRgb(r, g, b).hex, { emitEvent: false }));

		this.controls.hex.valueChanges.subscribe(hex => {
			const c = ColorRgb.fromHex(hex);
			this.controls.r.setValue(c.r, { emitEvent: false });
			this.controls.g.setValue(c.g, { emitEvent: false });
			this.controls.b.setValue(c.b, { emitEvent: false });
		});

		this._changes =
			Observable.merge(
				Observable.combineLatest(r, g, b)
					.map(([r, g, b]) => new ColorRgb(r, g, b)),
				this.controls.hex.valueChanges.map(ColorRgb.fromHex))
			.publish().refCount();
	}

	updateValue(value: ColorRgb, options: any) {
		const cs = this.controls;
		cs.r  .setValue(value.r  , options);
		cs.g  .setValue(value.g  , options);
		cs.b  .setValue(value.b  , options);
		cs.hex.setValue(value.hex, options);
	}
}


// /** */
// export class ColorPickerForm extends FormGroup {
//	 get value(): ColorRgb {
//		 return new ColorRgb(
//			 this.controls.r.value, this.controls.g.value, this.controls.b.value);
//	 }

//	 public _changes: Rx.Observable<ColorRgb>;
//	 get valueChanges(): Rx.Observable<ColorRgb> { return this._changes; }

//	 controls: {
//		 [key: string]: AbstractControl;
//		 r  : FormControl;
//		 g  : FormControl;
//		 b  : FormControl;
//		 hex: FormControl;
//	 };

//	 constructor(value: ColorRgb) {
//		 super({
//			 r  : new FormControl(value.r),
//			 g  : new FormControl(value.g),
//			 b  : new FormControl(value.b),
//			 hex: new FormControl(value.hex)
//		 });

//		 const r   = this.controls.r  .valueChanges.startWith(value.r  );
//		 const g   = this.controls.g  .valueChanges.startWith(value.g  );
//		 const b   = this.controls.b  .valueChanges.startWith(value.b  );
//		 const hex = this.controls.hex.valueChanges.startWith(value.hex);

//		 Rx.Observable.combineLatest(r, g, b)
//			 .subscribe(([r, g, b]) =>
//				 this.controls.hex.setValue(new ColorRgb(r, g, b).hex, { emitEvent: false }));

//		 this.controls.hex.valueChanges.subscribe(hex => {
//			 const c = ColorRgb.fromHex(hex);
//			 this.controls.r.setValue(c.r, { emitEvent: false });
//			 this.controls.g.setValue(c.g, { emitEvent: false });
//			 this.controls.b.setValue(c.b, { emitEvent: false });
//		 });

//		 this._changes =
//			 Rx.Observable.merge(
//				 Rx.Observable.combineLatest(r, g, b)
//					 .map(([r, g, b]) => new ColorRgb(r, g, b)),
//				 this.controls.hex.valueChanges.map(ColorRgb.fromHex))
//			 .publish().refCount();
//	 }

//	 updateValue(value: ColorRgb, options: any) {
//		 const cs = this.controls;
//		 cs.r  .setValue(value.r  , options);
//		 cs.g  .setValue(value.g  , options);
//		 cs.b  .setValue(value.b  , options);
//		 cs.hex.setValue(value.hex, options);
//	 }
// }

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
	moduleId: module.id,
	selector: 'color-picker',
	templateUrl: 'color-picker.component.html',
	styleUrls: ['color-picker.component.css']
})
export class ColorPickerComponent implements OnInit, OnDestroy {
	@Input() form: ColorPickerForm = new ColorPickerForm(new ColorRgb);

	@Output() close = new EventEmitter<Maybe<ColorRgb>>();

	@ViewChild('huePicker') public _huePickerElemRef: ElementRef;
	get _huePickerElem(): HTMLCanvasElement { return this._huePickerElemRef.nativeElement; }

	@ViewChild('colorPicker') public _colorPickerElemRef: ElementRef;
	get _colorPickerElem(): HTMLCanvasElement { return this._colorPickerElemRef.nativeElement; }

	// ---------------------------------------------------------------
	public _colorPickerWidth  = 200;
	public _colorPickerHeight = 200;
	public _huePickerWidth	= 20;
	public _huePickerHeight   = this._colorPickerHeight;
	public _huePickerGradient = new ColorRgbaLinearGradient([
		{ offset: 0	, value: { r: 255, g:   0, b:   0, a: 255 }},
		{ offset: 1 / 6, value: { r: 255, g: 255, b:   0, a: 255 }},
		{ offset: 2 / 6, value: { r:   0, g: 255, b:   0, a: 255 }},
		{ offset: 3 / 6, value: { r:   0, g: 255, b: 255, a: 255 }},
		{ offset: 4 / 6, value: { r:   0, g:   0, b: 255, a: 255 }},
		{ offset: 5 / 6, value: { r: 255, g:   0, b: 255, a: 255 }},
		{ offset: 1	, value: { r: 255, g:   0, b:   0, a: 255 }}
	]);

	public _standardColors = [
		'ffffff', 'e6e6e6', 'dadada', 'cdcdcd', 'c1c1c1', 'b4b4b4', 'a7a7a7',
		'9a9a9a', '8e8e8e', '818181', '737373', '666666', '595959', '4b4b4b',
		'3d3d3d', '303030', '212121', '131313', '050505', '000000', 'ff0000',
		'f69679', 'f26c4f', 'ed1c24', '9e0b0e', '790000', '7b2e00', 'a0410d',
		'f26522', 'f9ad81', '7d4900', 'a36209', 'f7941d', 'fbaf5d', 'fdc689',
		'fff799', 'fff568', 'fff200', 'ffff00', 'aba000', '827b00', '406618',
		'598527', '8dc63f', 'acd373', 'c4e99b', '005e20', '197b30', '39b54a',
		'7cc576', 'a3d39c', '005826', '007236', '00a651', '00ff00', '3cb878',
		'82ca9c', '7accc8', '1cbbb4', '00a99d', '00746b', '005952', '005b7f',
		'0076a3', '00aeef', '00bff3', '6dcff6', '00ffff', '7da7d9', '448ccb',
		'0072bc', '004a80', '003663', '002157', '003471', '0054a6', '0000ff',
		'5674b9', '8781bd', 'a186be', '5c5ca8', '2e3192', '1b1464', '0d004c',
		'32004b', '440e62', '662d91', '8560a8', 'a186be', 'bd8cbf', 'a864a8',
		'92278f', '630660', '4b0049', '7b0046', '9e005d', 'ec008c', 'f06eaa',
		'f49ac1', 'ff00ff', 'f5989d', 'fc6d7d', 'ed145b', '9e0039', '7a0026',
		'c7b299', '998675', '736357', '534741', '362f2d', 'c69c6d', 'a67c52',
		'8c6239', '754c24', '603913', '7030a0'
	];

	public _customColors: string[] = [];
	visibleDeleteColorButton = false;
	// ----------------------- Inputs --------------------------------
	public _huePickerMouseDown   = new Subject<MouseEvent>();
	public _huePickerMouseMove   = new Subject<MouseEvent>();
	public _colorPickerMouseDown = new Subject<MouseEvent>();
	public _colorPickerMouseMove = new Subject<MouseEvent>();

	// ----------------------- State ---------------------------------
	public _hue	   : number = 0;
	public _saturation: number = 1;
	public _colorValue: number = 1;

	public _color	  : ColorRgba;
	public _colorString: string;

	// ---------------------------------------------------------------
	private active_view: boolean = true;
	private subs: Subscription[];

	// ---------------------------------------------------------------
	constructor(
		private _changeDetector: ChangeDetectorRef,
		private _renderer: Renderer,
		private _dragSessionService: DragSessionService,
		private _appService: AppService,
	) {
		this.form = new ColorPickerForm(new ColorRgb());
	}

	ngOnInit() {
		const initialHue = 0;
		const initialSaturation = 1;
		const initialColorValue = 1;
		const hueValue = Observable.merge(
			Observable.of(initialHue),
			this._huePickerMouseDown
				.filter(e => e.button === 0)
				.map(e =>
					this._dragSessionService.startDrag(e.pageX, e.pageY)
						.drag.map(d => ({ x: d.pageX, y: d.pageY }))
						.startWith({ x: e.pageX, y: e.pageY }))
				.switch()
				.map(({ x, y }) => pageToElement(this._huePickerElem, x, y))
				.filter(({ x, y }) =>
					x >= 0 && x < this._huePickerWidth
					&& y >= 0 && y < this._huePickerHeight)
				.distinctUntilChanged((a, b) => a.y === b.y)
				.map(({ y }) => 1 - y / (this._huePickerHeight - 1))
		);

		const saturationColorValue = Observable.merge(
			Observable.of({ s: initialSaturation, v: initialColorValue }),
			this._colorPickerMouseDown
				.filter(e => e.button === 0)
				.map(e =>
					this._dragSessionService.startDrag(e.pageX, e.pageY)
						.drag.map(d => ({ x: d.pageX, y: d.pageY }))
						.startWith({ x: e.pageX, y: e.pageY }))
				.switch()
				.map(({ x, y }) => pageToElement(this._colorPickerElem, x, y))
				.filter(({ x, y }) =>
					x >= 0 && x < this._colorPickerWidth
					&& y >= 0 && y < this._colorPickerHeight)
				.map(({ x, y }) =>
					({ s: x / (this._colorPickerWidth  - 1),
					v: 1 - y / (this._colorPickerHeight - 1) }))
		);

		const colorValue = hueValue.combineLatest(saturationColorValue).map(([h, {s, v}]) => this._HsvToRgba(h, s, v));

		const anyChange =
			Observable.merge(
				colorValue,
				this.form.valueChanges)
			.publish().refCount();

		this.subs = [
			anyChange.subscribe(() => {
				this.refreshView();
			}),

			this.form.valueColorChanges.pipe()
				.map(c => this._RgbToHsv(c))
				.subscribe(({ h, s, v }) => this._redrawColorPicker(h, s, v)),

			this.form.valueColorChanges.pipe()
				.map(c => this._RgbToHsv(c).h)
				.distinctUntilChanged()
				.subscribe(h => this._redrawHuePickerImage(h)),

			colorValue.pipe().subscribe(c => {
				this._color = c;
				this._colorString = _RgbaToString(c);
				this.form.updateValue(new ColorRgb(c.r, c.g, c.b), { emitEvent: true })
			})
		];
		this._customColors = this._appService.customColors;
		this.refreshView();
	}

	ngOnDestroy() {
		this.active_view = false;
		this.subs.forEach(s => s.unsubscribe());
	}

	onClose() {
		this.close.emit(Maybe.nothing<ColorRgb>());
	}

	chooseColor() {
		let c = this._color;
		let cRGB = new ColorRgb(c.r, c.g, c.b);
		if (this.form.colorValue.hex)
			cRGB = ColorRgb.fromHex(this.form.colorValue.hex);
		this.close.emit(Maybe.just(cRGB));
	}

	colorButtonClick(hex: string) {
 		this.form.patchValue({
			hex: hex,
		});
	}

	addCustomColor() {
		this._customColors.push(this.form.colorValue.hex);
		this._appService.customColors = this._customColors;
		this.refreshView();
	}

	deleteCustomColor() {
		this._customColors = this._customColors.filter(c => c !== this.form.colorValue.hex);
		this._appService.customColors = this._customColors;
		this.refreshView();
	}

	public _redrawHuePickerImage(hue: number) {
		const canvas = this._huePickerElem;
		canvas.width = this._huePickerWidth;
		canvas.height = this._huePickerHeight;
		const ctx = canvas.getContext('2d');
		if (!ctx) { throw 'CanvasRenderingContext2D not supported.'; }

		const image = ctx.getImageData(0, 0, canvas.width, canvas.height);

		for (let x = 0; x < canvas.width; x++) {
			drawVerticalGradientLine(
				image, x, this._colorPickerHeight, this._huePickerGradient.reverse());
		}

		ctx.putImageData(image, 0, 0);

		const y = (1 - hue) * (canvas.height - 1);
		ctx.strokeStyle = 'white';
		ctx.fillStyle = 'black';

		ctx.beginPath();
		ctx.moveTo(5, y);
		ctx.lineTo(0, y - 5);
		ctx.lineTo(0, y + 5);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();

		const x = canvas.width - 5;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + 5, y - 5);
		ctx.lineTo(x + 5, y + 5);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}

	public _saturationGradient(hue: number): ColorRgbaLinearGradient {
		return new ColorRgbaLinearGradient([
			{ offset: 0, value: { r: 255, g: 255, b: 255, a: 255   }},
			{ offset: 1, value: this._huePickerGradient.valueAt(hue)}
		]);
	}

	public _colorValueGradient(color: ColorRgba): ColorRgbaLinearGradient {
		return new ColorRgbaLinearGradient([
			{ offset: 0, value: { r: 0, g: 0, b: 0, a: 255 }},
			{ offset: 1, value: color					   }
		]);
	}

	public _HsvToRgba(hue: number, saturation: number, value: number): ColorRgba {
		return this._colorValueGradient(
			this._saturationGradient(hue).valueAt(saturation))
		.valueAt(value);
	}

	public _RgbToHsv(color: ColorRgb): { h: number, s: number, v: number } {
		const r = color.r / 255;
		const g = color.g / 255;
		const b = color.b / 255;
		const cmax = Math.max(r, g, b);
		const cmin = Math.min(r, g, b);
		const delta = cmax - cmin;

		const h =
			  delta === 0 ? 0
			: cmax  === r ? (1 / 6) * ((g - b) / delta	 )
			: cmax  === g ? (1 / 6) * ((b - r) / delta  + 2)
			: cmax  === b ? (1 / 6) * ((r - g) / delta  + 4)
			: 0 / 0; // Unreachable.

		const s = cmax === 0 ? 0 : delta / cmax;

		const v = cmax;

		return { h: h < 0 ? h + 1 : h, s, v };
	}

	public _redrawColorPicker(hue: number, saturation: number, value: number) {
		const canvas = this._colorPickerElem;
		canvas.width  = this._colorPickerWidth;
		canvas.height = this._colorPickerHeight;
		const ctx = canvas.getContext('2d');
		if (!ctx) { throw 'CanvasRenderingContext2D not supported.'; }

		const image = ctx.getImageData(0, 0, canvas.width, canvas.height);

		const saturationGradient = this._saturationGradient(hue);

		const cols = saturationGradient.rasterize(canvas.width);

		cols.forEach((c, x) =>
			drawVerticalGradientLine(
				image, x, canvas.height, this._colorValueGradient(c).reverse()));

		const x = saturation  * (canvas.width  - 1);
		const y = (1 - value) * (canvas.height - 1);

		ctx.putImageData(image, 0, 0);

		ctx.strokeStyle = '#ccc';
		ctx.beginPath();
		ctx.arc(x, y, 4.5, 0, 2 * Math.PI);
		ctx.stroke();
	}

	refreshView() {
		this.visibleDeleteColorButton = this._customColors.indexOf(this.form.colorValue.hex) >= 0;

		if (this.active_view)
			this._changeDetector.detectChanges();
	}

	@HostListener('keydown', ['$event'])
	onKeyDown(event: KeyboardEvent) {
		if ((event.keyCode < 48  || event.keyCode > 70 || event.keyCode > 57 && event.keyCode < 65) && event.keyCode != 46 && event.keyCode != 8 ) {
			event.preventDefault();
			event.stopPropagation();
		}
	}
}

function _RgbaToString(c: ColorRgba) {
	return `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
}
