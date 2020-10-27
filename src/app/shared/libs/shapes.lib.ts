import {
	get as _get,
	indexOf as _indexOf,
	keys as _keys
} from 'lodash';
import { SHAPE_TYPE1, SHAPE_TYPE2, SHAPE_TYPE3,
	GLOGOOD_SHAPES, } from '@app-shared/constants/shapes';

export const setAttributes = (attributes: Object, e: SVGElement) => {
	_keys(attributes).forEach(k => {
		e.setAttribute(k, attributes[k]);
	});
};

export const setStyle = (attributes: Object, e: HTMLElement) => {
	e.removeAttribute('style');
	_keys(attributes).forEach(k => {
		e['style'][k] = attributes[k];
	});
};

export const appendPolygon = (polygons: string[], attributes: Object, g: SVGGElement) => { // <g>
	polygons.forEach(p => {
		const polygonEle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
		polygonEle.setAttribute('points', p);
		setAttributes(attributes, polygonEle);
		g.appendChild(polygonEle);
	});
};

export const setSVGToEle = (shape: string, attributes: Object, ele: HTMLElement) => {
	const svgEle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	const gEle = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	let pathEle;

	svgEle.setAttribute('preserveAspectRatio', 'none');
	svgEle.setAttribute('viewBox', GLOGOOD_SHAPES[shape].viewBox);
	svgEle.style.overflow = 'visible';
	svgEle.style.width = '100%';
	svgEle.style.height = '100%';

	switch (shape) {
		case 'line':
			pathEle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			setAttributes(
				{
					'd': GLOGOOD_SHAPES[shape].path,
					'vector-effect': 'non-scaling-stroke'
				},
				pathEle
			);
			gEle.appendChild(pathEle);
			break;
		case 'line_l':
		case 'line_r':
		case 'line_lr':
			pathEle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			setAttributes(
				{
					'd': GLOGOOD_SHAPES[shape].path,
					'vector-effect': 'non-scaling-stroke'
				},
				pathEle
			);
			gEle.appendChild(pathEle);
			appendPolygon(GLOGOOD_SHAPES[shape].polygons, {'vector-effect': 'non-scaling-stroke', 'stroke-width': 1}, gEle);
			break;

		case 'arrow_l':
		case 'arrow_r':
		case 'arrow_lr':
		case 'arrow_u':
		case 'arrow_d':
		case 'arrow_ud':
			svgEle.setAttribute('viewBox', GLOGOOD_SHAPES[shape].viewBox);
			appendPolygon(GLOGOOD_SHAPES[shape].polygons, {'vector-effect': 'non-scaling-stroke'}, gEle);
			break;

		default:
			pathEle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			setAttributes(
				{
					'd': GLOGOOD_SHAPES[shape].path,
					'vector-effect': 'non-scaling-stroke'
				},
				pathEle
			);
			gEle.appendChild(pathEle);
			break;
		}

	setAttributes(attributes, gEle);
	svgEle.appendChild(gEle);

	ele.innerHTML = '';
	ele.appendChild(svgEle);
	ele.style.paddingLeft = '5px';
	ele.style.paddingRight = '5px';
	ele.style.paddingBottom = '5px';
	ele.style.paddingTop = '5px';
};


export const setDIVToEle = (shape: string, attributes: Object, ele: HTMLElement) => {
	const divEle = document.createElement('div');
	setStyle(attributes, divEle);
	ele.innerHTML = '';
	ele.appendChild(divEle);
};

export const setPaddingToContainer = (storke_width: number, tanA: Object, ele: HTMLElement) => {
	ele.style.paddingTop = `${_get(tanA, 'top', 1) * storke_width / 2}px`;
	ele.style.paddingBottom = `${_get(tanA, 'bottom', 1) * storke_width / 2}px`;
	ele.style.paddingLeft = `${_get(tanA, 'left', 1) * storke_width / 2}px`;
	ele.style.paddingRight = `${_get(tanA, 'right', 1) * storke_width / 2}px`;
};
