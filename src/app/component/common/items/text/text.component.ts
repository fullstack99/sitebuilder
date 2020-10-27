import { Component, Input, ElementRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
	OnChanges, OnDestroy, SimpleChanges, ViewChild, AfterViewInit, Renderer, HostBinding
} from '@angular/core';
import { Subscription } from 'rxjs';
import { get as _get } from 'lodash';
import { TextEditorTinyMceDirective } from '@app-directives/text-editor-tinymce/text-editor-tinymce.directive';
import { Box } from '@app-lib/rect/rect';

import { Item, TextItemContent, Link, BorderInfo } from '@app/models';
import { PageService } from '@app/services/page.service';
import { AppService } from '@app/app.service';

@Component({
	moduleId: module.id,
	selector: 'text-item',
	templateUrl: './text.component.html',
	styleUrls: ['./text.component.css']
})
export class TextComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
	@Input() item: Item;
	@Input() editable = false;
	@Input() editing  = false;
	@Input() selected  = false;
	@Input() pageLayout: number = 1; // 1: tablet, 2: mobile

	@Output('itemChange') itemChange = new EventEmitter<Item>();
   	@Output('itemChanged') itemChanged = new EventEmitter<{ command: string, prevState: any, newState: any}>();
	@Output('itemResize') itemResize = new EventEmitter<Box>();
	@Output('itemRemove') itemRemove = new EventEmitter<void>();
	@Output('outLink') outLink = new EventEmitter<Link>();
	@Output('hasLink') hasLink = new EventEmitter<boolean>();

	@ViewChild('textEditorElem') textEditorElem: ElementRef;
	@ViewChild('cloneTextElem') cloneTextElem: ElementRef;

	@ViewChild(TextEditorTinyMceDirective) textEditorTinyMceDirective: TextEditorTinyMceDirective;
	
	typing: boolean = false;
	padding: number = 10;
	extra_padding: number = 7;
	textBox: Box;

	hp: number;
	wp: number;
	itemBorderWidth: number = 2;
	borderType: number = 2;
	borderWidth: number = 0;
	border_amount: number = 0;
	parent: HTMLElement;
	viewInited: boolean = false;

	get textEleHeight(): number {
		return (<HTMLElement>this.textEditorElem.nativeElement).offsetHeight;
	}

	get textEleWidth(): number {
		return (<HTMLElement>this.textEditorElem.nativeElement).offsetWidth;
	}

	private _undoTextCommands: string[] = [];
	private _redoTextCommands: string[] = [];
	private _subs: Subscription[] = [];

	constructor(
		public _elementRef: ElementRef,
		public _changeDetectRef: ChangeDetectorRef,
		private _renderer: Renderer,
		private _pageService: PageService,
		private _appService: AppService,
	) {}

	ngOnInit() {
		this.parent = (this._elementRef.nativeElement as HTMLElement).parentElement.parentElement;
		const itemContent = this.item.content as TextItemContent;
		this.textBox = itemContent.box;

		if (itemContent.borderInfo.value) {
			this.borderWidth = itemContent.borderInfo.getDef(BorderInfo.empty()).borderWidth;
			this.border_amount = itemContent.borderInfo.getDef(BorderInfo.empty()).amount;
			this.padding += this.borderWidth;
			if (itemContent.borderInfo.getDef(BorderInfo.empty()).borderType == 1) {
				this.borderType = 1;
			} else {
				this.borderType = 2;
			}
		}
		this._subs = [
			this._pageService.changedItemSub.subscribe(res => {
				if (res.item == this.item) {
					if (this.textEditorTinyMceDirective.editor.value) {
						this.textEditorTinyMceDirective.editor.map(ed => {
							if (this._undoTextCommands.length > 0 && res.command == 'Undo') {
								this._redoTextCommands = [this._undoTextCommands[0], ...this._redoTextCommands];
								this._undoTextCommands.splice(1);
								ed.execCommand('Undo');
							} else if (this._redoTextCommands.length > 0 && res.command == 'Redo') {
								this._undoTextCommands = [this._redoTextCommands[0], ...this._undoTextCommands];
								this._redoTextCommands.splice(1);
								ed.execCommand('Redo');
							} else {
								ed.setContent(this.item.content['text']);
							}
						});
					} else {
						this._undoTextCommands = [];
						this._redoTextCommands = [];
						this.setTextContentToEditor();
					}
				}
			}),
		];
	}

	ngOnChanges(changes: SimpleChanges) {
		if (!this.viewInited) return;
	}

	ngAfterViewInit() {
		this.setTextContentToEditor();
		this.viewInited = true;
		const ele = this._elementRef.nativeElement;
		if (ele.offsetWidth == 0 && ele.offsetHeight == 0) return;
		if (this.isEmpty()) return;
		if (this.borderType == 1) {
			setTimeout(() => {
				this.setOptimizeHeight(true);
			});
		} else {
			setTimeout(() => {
				this.setBoxHeightType2();
			});
		}
	}

	setTextContentToEditor() {
		if (this.textEditorElem) {
			const textEle = this.textEditorElem.nativeElement as HTMLElement;
			textEle.innerHTML = (this.item.content as TextItemContent).text;
			this._renderer.setElementStyle(textEle, 'padding',  (this.item.content as TextItemContent).padding);
			this._renderer.setElementStyle(textEle, 'color',  (this.item.content as TextItemContent).color || `none`);
			const a_eles = textEle.getElementsByTagName('a');

			for (let i = 0; i < a_eles.length; i++) {
				a_eles[i].addEventListener('click', (e) => {
					if (!this.editable && a_eles[i].getAttribute('data-link')) {
						e.preventDefault();
						e.stopPropagation();
						this.onClick(a_eles[i].getAttribute('data-link'));
					} else if (!this.editable && a_eles[i].getAttribute('href')) {
						e.preventDefault();
						e.stopPropagation();
						open(a_eles[i].getAttribute('href'), '_blank');
					}
				});
			}
		}
	}

	onEditorDestroyed(text: string) {
		if (!this.viewInited) return;

		if (this.isEmpty()) {
			setTimeout(() => {
				this.itemRemove.emit();
			});
		} else {
			setTimeout(() => {
				if (this.borderType == 1) {
					this.setOptimizeHeight(true);
				} else {
					this.setBoxHeightType2(true);
				}
				console.log(this.item.content.box);
				this.itemChange.emit(this.item);
			});
		}
	}

	onEditorInputCommand(e: {command: string, content: string}) {
		this.onEditorInput(e.content, e.command);
	}

	onEditorInput(text: string, command: string = null) {
		this.typing = true;
		let th = this.textEleHeight + this.padding;
		let wp = this.padding;

		if (this.borderType == 2) {
			th = this.textEleHeight + this.borderWidth * 2;
		}

		const itemContent = this.item.content as TextItemContent;

		if (th > itemContent.box.height() && th > this.textBox.height()) {
			if (this.borderType == 1) {
				this.setOptimizeHeight(true);
			} else {
				this.setBoxHeightType2();
			}
		}

		if (command) {
			this._undoTextCommands = [command, ...this._undoTextCommands];
			this.itemChanged.emit({ command: command, prevState: {content: this.item.content}, newState: {content: itemContent.setText(text)}});
		} else {
			itemContent.text = text;
		}
	}

	// setOptimizeHeight(textFlag: boolean=false) {
	//	 if (this.itemContent.borderInfo) {
	//		 let rd = 0.01 * this.border_amount;
	//		 let rx = this.itemContent.box.width() * rd - this.borderWidth;
	//		 let minPw = 1;
	//		 let minH = 0;
	//		 for (let pw = this.borderWidth + 5; pw < rx/2; pw+=2) {
	//			 let h = this.setBoxHeight(pw);
	//			 if (h < minH || minH == 0) {
	//				 minPw = pw;
	//				 minH = h;
	//			 }
	//		 }
	//		 this.setBoxHeight(minPw, true, textFlag);
	//	 }
	// }

	setOptimizeHeight(textFlag: boolean = false) {
		const itemContent = this.item.content as TextItemContent;

		if (itemContent.borderInfo) {
			let rd = 0.01 * this.border_amount;
			let rx = itemContent.box.width() * rd - this.borderWidth;
			let minPw = this.borderWidth;
			let minPh = this.borderWidth;
			let minH = 0;
			let clone_ele = this.cloneTextElem.nativeElement as HTMLElement;
			clone_ele.innerHTML = (this.textEditorElem.nativeElement as HTMLElement).innerHTML;

  			for (let pw = this.borderWidth + 5; pw < rx / 2; pw += 2) {
				const r = this.setBoxHeight1(pw, rd, rx);
				if (r[0] < minH || minH == 0) {
					minPw = pw;
					minH = r[0];
					minPh = r[1];
				}
			}
			clone_ele.innerHTML = '';
			this.setItemHeight(minPw, minPh, minH);
		}
	}

	getTextHeight(ele: HTMLElement) {
		let children = ele.childNodes;
		let height = 0;
		for (let i = 0; i < children.length; i++) {
			height += (children.item(i) as HTMLElement).offsetHeight;
		}
		return height;
	}

	setBoxHeight1(pw: number, rd: number, rx: number) {
		const itemContent = this.item.content as TextItemContent;
		let ry = itemContent.box.height() * rd - this.borderWidth;
		let kkk = pw / rx * (2  - pw / rx);
		let kk = Math.sqrt(kkk) * ry;
		let ph = Math.ceil(ry - kk);
		let textHeight = 0;
		let clone_ele = this.cloneTextElem.nativeElement as HTMLElement;
		this._renderer.setElementStyle(clone_ele, 'padding',  ph + 'px ' + pw + 'px');
		textHeight = this.getTextHeight(clone_ele);
		return [textHeight + 2 * ph, ph];
	}

	setItemHeight(minPw, minPh, minH) {
		const itemContent = this.item.content as TextItemContent;

		if (minH + this.borderWidth * 2 + this.itemBorderWidth * 2 < itemContent.box.height()) return;
		let ele = this.textEditorElem.nativeElement as HTMLElement;
		this._renderer.setElementStyle(ele, 'padding',  minPh + 'px ' + minPw + 'px');
		this.textBox = itemContent.box.setBottom(itemContent.box.top + minH + this.borderWidth * 2 + this.itemBorderWidth * 2);
		itemContent.padding = minPh + 'px ' + minPw + 'px';
		itemContent.box.bottom = this.textBox.bottom;
	}

	setBoxHeight(pw: number, flag: boolean=false, textFlag: boolean=false): number {
		const itemContent = this.item.content as TextItemContent;

		if (itemContent.borderInfo) {
			this.wp = pw;
			let ele = this.textEditorElem.nativeElement as HTMLElement;
			let rd = 0.01 * this.border_amount;
			let rx = itemContent.box.width() * rd - this.borderWidth;
			let tw = itemContent.box.width() - 2 * this.wp;

			this._renderer.setElementStyle(ele, 'padding', '0px ' + this.wp + 'px');

			let th = this.textEleHeight + this.borderWidth;
			//let th = this.textEleHeight - this.borderWidth;

			let kkk1 = 1.0 - this.wp / rx;

			let kk = 1.0 - Math.sqrt(1.0 - kkk1 * kkk1);

			let h = Math.round(th / (1.0 - 2.0 * rd * kk));
			this.hp = (h - th) / 2;

			if (flag && !this.isEmpty()) {
				let itemPadding = Math.floor(this.hp) - 8 + 'px ' + this.wp + 'px';
				this._renderer.setElementStyle(ele, 'padding', itemPadding);
				// if (textFlag && this.itemContent.box.height() != h) {
				// if (textFlag && this.textHeight + 2 * (Math.floor(this.hp)) > this.itemContent.box.height()) {
				//	 this.textBox = this.itemContent.box.setBottom(this.itemContent.box.top + h);
				//	 //this.itemResize.emit(this.textBox);
				//	 this.itemContent.padding = itemPadding;
				//	 this.itemContent.box.bottom = this.textBox.bottom;
				// }
			}
			return h;
		}
		return 0;
	}

	setBoxHeightType2(destroy: boolean = false) {
		let itemPadding = '';
		let padding = 5;
		let ele = this.textEditorElem.nativeElement as HTMLElement;
		let eleWidth = 300;
		let eleHeight = 100;
		let cloneWidth = 300;
		let cloneHeight = 100;
		let extra_width = 0;
		let clone_ele = ele.cloneNode(true) as HTMLElement;

		const itemContent = this.item.content as TextItemContent;
		document.body.appendChild(clone_ele);
		// this._renderer.setElementStyle(clone_ele, 'display', 'inline-block');
		this._renderer.setElementStyle(clone_ele, 'display', 'block');
		this._renderer.setElementStyle(clone_ele, 'position', 'absolute');
		this._renderer.setElementStyle(clone_ele, 'z-index', '-100');
		this._renderer.setElementStyle(clone_ele, 'max-width', ele.offsetWidth + 'px');
		this._renderer.setElementStyle(clone_ele, 'min-height', '10px');
		this._renderer.setElementStyle(clone_ele, 'top', '0');
		this._renderer.setElementStyle(clone_ele, 'opacity', '0');

		if (itemContent.borderInfo.value && this.border_amount) {
			padding = Math.ceil(0 + this.border_amount - Math.sqrt(2) / 2 * this.border_amount + this.borderWidth);
		}

		if (this.textEditorElem) {
			itemPadding = padding - 2 + 'px ' + padding + 'px';
			this._renderer.setElementStyle(ele, 'padding', itemPadding);
			this._renderer.setElementStyle(clone_ele, 'padding', itemPadding);
		}
		cloneWidth = clone_ele.offsetWidth + 1;
		cloneHeight = clone_ele.offsetHeight;

		document.body.removeChild(clone_ele);

		eleWidth = ele.offsetWidth;
		eleHeight = cloneHeight;

		if (this.borderWidth == 0) {
			eleWidth -= 1;
			extra_width = 3;
		}

		if (eleWidth > cloneWidth)
			eleWidth = cloneWidth;

		if (!this.isEmpty() && (this.typing || eleHeight != (itemContent.box.height() - this.borderWidth * 2))) {
			this.textBox = itemContent.box
				.setBottom(itemContent.box.top + eleHeight + this.borderWidth * 2)
				.setRight(itemContent.box.left + eleWidth + this.borderWidth * 2 + extra_width);
			itemContent.padding = itemPadding;
			this.itemResize.emit(this.textBox);
			// this.itemContent.box.bottom = this.textBox.bottom;
			// this.itemContent.box.right = this.textBox.right;
		}

		// if (!this.isEmpty() && (this.typing || eleHeight != this.itemContent.box.height()-(padding-2 + this.borderWidth) * 2)) {
		//	 this.textBox = this.itemContent.box
		//		 .setBottom(this.itemContent.box.top + eleHeight + padding * 2 - 4 + this.borderWidth * 2)
		//		 .setRight(this.itemContent.box.left + eleWidth + padding * 2 + this.borderWidth * 2 + extra_width);
		//	 this.itemContent.padding = itemPadding;
		//	 this.itemContent.box.bottom = this.textBox.bottom;
		//	 this.itemContent.box.right = this.textBox.right;
		// }

		// else if (!this.isEmpty() && eleWidth < ele.offsetWidth - padding * 2 - extra_width) {
		//	 this.textBox = this.itemContent.box
		//		 .setBottom(this.itemContent.box.top + eleHeight + padding * 2 + this.borderWidth * 2)
		//		 .setRight(this.itemContent.box.left + eleWidth + padding * 2 + this.borderWidth * 2 + extra_width);
		//	 this.itemContent.padding = itemPadding;
		//	 this.itemContent.box.bottom = this.textBox.bottom;
		//	 this.itemContent.box.right = this.textBox.right;
		// }
	}

	isEmpty() {
		const itemContent = this.item.content as TextItemContent;
		return ($(itemContent.text).text().trim() == '');
	}

	ngOnDestroy() {
		this.viewInited = false;
	}

	onClick(link: any) {
		link = JSON.parse(link);
		if (!link) return;
		this.outLink.emit(link);
	}
}
