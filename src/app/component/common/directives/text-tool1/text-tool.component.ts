import { Component, ElementRef, OnInit, Input, OnChanges, SimpleChanges, Renderer, Output, EventEmitter, OnDestroy, HostListener, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';

import * as lodash from 'lodash';
import { Box } from '@app-lib/rect/rect';
import { ancestors, ancestorsUpTo } from '@app-lib/dom/dom';
import { Maybe } from '@app-lib/maybe/maybe';

import { createColorPickerWindow, ColorPickerForm, ColorRgb, ColorPickerComponent } from '@app-dialogs/color-picker/color-picker.component';
import { createFontPickerDialogWindow, FontPickerDialogComponent, FontsService } from '@app-dialogs/font-picker/font-picker.component';
import { createLinkingDialogWindow, LinkingDialogComponent, LinkingForm } from '@app-dialogs/linking-dialog/linking-dialog.component';
import { LinkPage, LinkLookup, LinkSiteMap, LinkWebsite, LinkEmail, LinkMaps, LinkAnchor, Link, LinkingFormJson, LinkSource } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

@Component({
	templateUrl: './text-tool.component.html',
	styleUrls: ['./text-tool.component.css']
})
export class TextToolComponent implements OnInit {
	@Input('text-tool-host') host: HTMLElement | undefined;
	@Input('text-tool-target') targetId: string = '';
	@Input('text-tool-width') toolbarWidth: number = 503;
	@Input('text-tool-showLink') showLink: boolean = false;
	@Input('text-tool-type') toolbarType: number = 0; //0: Default, 1: Button-Dialog, 2: Nav-Dialog
	@Input('text-tool-fontsize-type') fontSizeType: number = 0; //0: Default, 1: 30px, 2: 18px

	@Input('text-tool-input') inputValue: any = {fontSize: '14px', fontFamily: '', bold: false, italic: false, underline: false, color: 'black', backgroundColor: 'white'}
	@Input('text-tool-input-link') inputLink: Link = null;

	@Output('text-tool-output') outputValue = new EventEmitter<any>();
	@Output('text-tool-output-Link') outputLink = new EventEmitter<Link>();

	public _fontSizes: any = [
		{ type: 'menuitem', text: '8px' },
		{ type: 'menuitem', text: '10px' },
		{ type: 'menuitem', text: '12px' },
		{ type: 'menuitem', text: '14px' },
		{ type: 'menuitem', text: '16px' },
		{ type: 'menuitem', text: '18px' },
		{ type: 'menuitem', text: '24px' },
		{ type: 'menuitem', text: '30px' },
		{ type: 'menuitem', text: '36px' },
		{ type: 'menuitem', text: '50px' },
		{ type: 'menuitem', text: '72px' }
	];

	constructor(
		private elementRef: ElementRef,
		private renderer: Renderer,
		private windowService: WindowService,
		private fontService: FontsService
	) { }

	ngOnInit() {
	}

	onClickButton(type: string) {

	}

	public fonts(): string {
		const defaultFonts = [
			'Andale Mono',
			'Arial',
			'Arial Black',
			'Book Antiqua',
			'Comic Sans MS',
			'Courier New',
			'Georgia',
			'Helvetica',
			'Impact',
			'Lato',
			'Symbol',
			'Tahoma',
			'Terminal',
			'Times New Roman',
			'Trebuchet MS',
			'Verdana',
			'Webdings',
			'Wingdings',
		];

		return this.fontService.myFonts.map(f => f.family)
			.concat(defaultFonts)
			.map(f => f + '=' + f)
			.join(';');
	}

}
