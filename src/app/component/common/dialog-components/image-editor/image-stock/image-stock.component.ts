import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';

@Component({
	moduleId: module.id,
	selector: 'image-stock',
	templateUrl: 'image-stock.component.html',
	styleUrls: ['image-stock.component.css']
})
export class ImageStockComponent implements OnInit, OnDestroy {

	@Output() close = new EventEmitter<void>();

	freeUrls = [
		{ name: 'Pixabay', url: 'https://pixabay.com'},
		{ name: 'Pexels', url: 'https://www.pexels.com'},
		{ name: 'Public Domain Photos', url: 'http://www.public-domain-photos.com'},
		{ name: 'Avopix', url: 'https://avpix.com'}
	];

	paidUrls = [
		{ name: 'ShutterStock', url: 'https://www.shutterstock.com/home'},
		{ name: 'iStock', url: 'http://www.istockphoto.com'},
		{ name: 'Adobe', url: 'https//stock.adobe.com/images'},
		{ name: 'Dreamstime', url: 'https//www.dreamstime.com/ShutterStock'}
	]

	constructor(
	) {}

	ngOnInit() {
	}

	onBackClick() {
		this.close.emit();
	}

	ngOnDestroy() {	
	}
}
