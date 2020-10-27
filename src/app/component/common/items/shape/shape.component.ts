import { Component, Input, Output, ElementRef, OnInit, OnChanges, EventEmitter, ViewChild, AfterViewInit, Renderer2, SimpleChanges, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import {
	get as _get,
	indexOf as _indexOf,
} from 'lodash';
import { SHAPE_TYPE1, SHAPE_TYPE2, SHAPE_TYPE3,
	GLOGOOD_SHAPES, } from '@app-shared/constants/shapes';
import { setSVGToEle, setDIVToEle, setAttributes, setStyle, setPaddingToContainer } from '@app-shared/libs/shapes.lib';
import { Item, ShapeItemContent, Link, ShapeInfo } from '@app/models';

@Component({
	moduleId: module.id,
	selector: 'shape-item',
	templateUrl: './shape.component.html',
	styleUrls: ['./shape.component.css']
})
export class ShapeComponent implements OnInit, OnDestroy {
	@Input() item: Item;
	@Input() loading: boolean = false;
	@Output() outLink = new EventEmitter<Link>();

	@ViewChild('resultContainer') resultContainer: ElementRef;
	@ViewChild('resultShape') resultShape: ElementRef;
	@ViewChild('cloneShape') cloneShape: ElementRef;
	@ViewChild('colorPalette') colorPalette: ElementRef;

	itemContent: ShapeItemContent;
	info: ShapeInfo;
	itemUid = '';

	private _subs: Subscription[] = [];

	constructor(
		private _elementRef: ElementRef,
		private _renderer: Renderer2,
		private _sanitizer: DomSanitizer,
	) { }

	ngOnInit() {
		this.itemContent = this.item.content as ShapeItemContent;
		this.info = _get(this.item, ['content', 'info', 'value']);
		this.itemUid = this.item.uid;

		const svgEle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		const defsEle = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
		const filterEle = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
		const feGaussianBlurEle = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');

		svgEle.setAttribute('id', `${this.item.uid}`);
		svgEle.setAttribute('width', '0');
		svgEle.setAttribute('height', '0');

		filterEle.setAttribute('id', `shape_filter_${this.item.uid}`);
		filterEle.setAttribute('x', '0');
		filterEle.setAttribute('y', '0');

		feGaussianBlurEle.setAttribute('in', 'SourceGraphic');
		feGaussianBlurEle.setAttribute('stdDeviation', '0');

		filterEle.appendChild(feGaussianBlurEle);
		defsEle.appendChild(filterEle);
		svgEle.appendChild(defsEle);

		(this.resultContainer.nativeElement as HTMLElement).appendChild(svgEle);

		this.setShape();

		this._subs = [
		];
	}

	setShadow() {
		const shadow = _get(this.info, 'shadow', 0);
		const glow = _get(this.info, 'glow', 0);

		const resultShapeEle = this.resultShape.nativeElement as HTMLElement;
		const cloneEle = this.cloneShape.nativeElement as HTMLElement;

		const svgEle = $(resultShapeEle).children('svg')[0].cloneNode(true) as HTMLElement;
		cloneEle.innerHTML = '';
		cloneEle.appendChild(svgEle);

		const g = $(svgEle).find('g')[0] as HTMLElement;

		if (g) {
			g.setAttribute('filter', `url(#shape_filter_${this.item.uid})`);
			this._renderer.setStyle(g, 'fill', '#8c8c8c');
		}
		// this._renderer.setElementStyle(child_ele, 'stroke', this.shapeInfoForm.value.borderColor);
		// this._renderer.setElementStyle(child_ele, 'stroke-width', (this.shapeInfoForm.value.border ? this.shapeInfoForm.value.border : 1) + 'px');

		const blur_ele = $(this.resultContainer.nativeElement as HTMLElement).find('feGaussianBlur')[0] as HTMLElement;

		if (blur_ele)
			blur_ele.setAttribute('stdDeviation', `${glow}`);
		this._renderer.setStyle(cloneEle, 'left', `${shadow}px`);
		this._renderer.setStyle(cloneEle, 'top', `${shadow}px`);
	}

	setShape() {
		if (this.resultShape) {
			const containerEle = this.resultContainer.nativeElement as HTMLElement;
			const ele = this.resultShape.nativeElement as HTMLElement;

			ele.innerHTML = '';
			ele.removeAttribute('style');

			switch (this.info.shapeType) {
				case 'rectangle':
					this.item.content['info'].value.shapeType = 'rect';
					break;
				case 'round-rectangle':
					this.item.content['info'].value.shapeType = 'rect_round';
					break;
				case 'quatre-rectangle':
					this.item.content['info'].value.shapeType = 'rect_quatre';
					break;
				case 'oval':
					this.item.content['info'].value.shapeType = 'rect_oval';
					break;
				case 'round-rectangle-lr':
					this.item.content['info'].value.shapeType = 'rect_round_lr';
					break;
					
				case 'line-r':
					this.item.content['info'].value.shapeType = 'line_r';
					break;
				case 'line-lr':
					this.item.content['info'].value.shapeType = 'line_lr';
					break;

				case 'arrow-lr':
					this.item.content['info'].value.shapeType = 'arrow_lr';
					break;
				case 'arrow-r':
					this.item.content['info'].value.shapeType = 'arrow_r';
					break;
				case 'arrow-l':
					this.item.content['info'].value.shapeType = 'arrow_l';
					break;
				case 'arrow-u':
					this.item.content['info'].value.shapeType = 'arrow_u';
					break;
				case 'arrow-ud':
					this.item.content['info'].value.shapeType = 'arrow_ud';
					break;
			}

			switch (this.info.shapeType) {
				case 'rect':
				case 'rect_round':
				case 'rect_quatre':
				case 'rect_oval':
				case 'rect_round_lr':
					const shadow = _get(this.info, 'shadow', 0);
					const glow = _get(this.info, 'glow', 0);
					let result = `${shadow}px ${shadow}px`;
					result = `${result} ${glow}px rgba(0,0,0,0.4)`;

					setStyle(
						{
							'background-color': _get(this.info, 'color'),
							'border-color': _get(this.info, 'borderColor'),
							'border-style': 'solid',
							'border-width': _get(this.info, 'borderColor') ? `${_get(this.info, 'thickness', 1)}px` : 0,
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
					break;

				case 'line':
				case 'line_r':
				case 'line_lr':
					setSVGToEle(
						this.info.shapeType,
						{
							'fill': _get(this.info, 'color'),
							'stroke': _get(this.info, 'color'),
							'stroke-dasharray': _get(this.info, 'lineStyle'),
							'stroke-width': _get(this.info, 'thickness'),
						},
						ele
					);

					setPaddingToContainer(1, GLOGOOD_SHAPES[this.info.shapeType]['tanA'], this.resultShape.nativeElement);
					setPaddingToContainer(1, GLOGOOD_SHAPES[this.info.shapeType]['tanA'], this.cloneShape.nativeElement);
					break;

				default:
					setSVGToEle(
						this.info.shapeType,
						{
							'stroke': _get(this.info, 'borderColor'),
							'stroke-width': `${_get(this.info, 'border', 1)}px`,
							'stroke-dasharray': _get(this.info, 'lineStyle'),
							'fill': _get(this.info, 'color'),
							'fill-rule': 'evenodd'
						},
						ele
					);
					this.setShadow();
					setPaddingToContainer(_get(this.info, 'border', 1), GLOGOOD_SHAPES[this.info.shapeType]['tanA'], this.resultShape.nativeElement);
					setPaddingToContainer(_get(this.info, 'border', 1), GLOGOOD_SHAPES[this.info.shapeType]['tanA'], this.cloneShape.nativeElement);
			}
		}
	}

	isLine(): boolean {
		return _indexOf(SHAPE_TYPE1, _get(this.info, 'shapeType')) > -1 ? true : false;
	}

	isRectangle(): boolean {
		return _indexOf(SHAPE_TYPE2, _get(this.info, 'shapeType')) > -1 ? true : false;
	}

	isShape(): boolean {
		return _indexOf(SHAPE_TYPE3, _get(this.info, 'shapeType')) > -1 ? true : false;
	}

	getBorderRadius(arrow: string): string {
		if (_get(this.info, arrow)) {
			return `${_get(this.info, 'curve', 0)}%`;
		} else {
			return '0%';
		}
	}

	onHoverShape(event: Event) {
		const hoverColor = _get(this.info, ['hoverColor']);

		if (!hoverColor)
			return;

		const ele = this.resultShape.nativeElement as HTMLElement;

		if (this.isRectangle()) {
			this._renderer.setStyle(ele, 'background-color', hoverColor);
		} else if (this.isShape()) {
			const child_ele = $(ele).find('g')[0] as HTMLElement;
			if (child_ele) {
				this._renderer.setStyle(child_ele, 'fill', hoverColor);
			}
		}
	}

	onLeaveShape(event: Event) {
		const color = _get(this.info, ['color']);

		if (!color)
			return;

		const ele = this.resultShape.nativeElement as HTMLElement;

		if (this.isRectangle()) {
			this._renderer.setStyle(ele, 'background-color', color);
		} else if (this.isShape()) {
			const child_ele = $(ele).find('g')[0] as HTMLElement;
			if (child_ele) {
				this._renderer.setStyle(child_ele, 'fill', color);
			}
		}
	}

	onClick() {
		if (!this.itemContent.link) return;
		this.outLink.emit(this.itemContent.link);
	}

	ngOnDestroy() {
		if (this._subs) {
			this._subs.forEach(s => s.unsubscribe());
		}
	}
}
