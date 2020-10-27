import { Component, Input, Output, ElementRef, Renderer, OnInit, AfterViewInit, EventEmitter, ViewChild } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { Item, ImageItemContent, Link } from '@app/models';
import { Box } from '@app-lib/rect/rect';
import * as imageUrl from '@app-lib/functions/image-url';

@Component({
	moduleId: module.id,
	selector: 'image-item',
	templateUrl: './image.component.html',
	styleUrls: ['./image.component.css']
})

export class ImageComponent implements OnInit, AfterViewInit {
	@Input('item') item: Item;

	@Output() itemResize = new EventEmitter<Box>();
	@Output() outLink = new EventEmitter<Link>();

	@ViewChild('resultImage') resultImage: ElementRef;

	itemContent: ImageItemContent;

	constructor(
		private elementRef: ElementRef
	) { }

	ngOnInit() {
		this.itemContent = this.item.content as ImageItemContent;
		if (this.itemContent.image && this.itemContent.image['createdate']) {
			delete this.itemContent.image['createdate'];
		}
	}

	ngAfterViewInit() {
		if (this.resultImage && this.itemContent.image) {
			this.resultImage.nativeElement.style.setProperty('background-image', imageUrl.imageUrl(this.itemContent.image));
		}
	}

	onClick() {
		if (!this.itemContent.link) return;
		this.outLink.emit(this.itemContent.link);
	}
}
