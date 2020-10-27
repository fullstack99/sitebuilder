import { Directive, ElementRef, OnInit, Input, OnChanges, SimpleChanges,  Renderer, Output, EventEmitter, OnDestroy, HostListener, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import * as lodash from 'lodash';
import { Box } from '@app-lib/rect/rect';
import { ancestors, ancestorsUpTo } from '@app-lib/dom/dom';
import { Maybe } from '@app-lib/maybe/maybe';
import { createColorPickerWindow, ColorPickerForm, ColorRgb, ColorPickerComponent } from '@app-dialogs/color-picker/color-picker.component';
import { createFontPickerDialogWindow, FontPickerDialogComponent, FontsService } from '@app-dialogs/font-picker/font-picker.component';
import { createLinkingDialogWindow, LinkingDialogComponent, LinkingForm } from '@app-dialogs/linking-dialog/linking-dialog.component';
import { createAddFontSizeDialogWindow } from '@app-dialogs/add-fontsize-dialog/add-fontsize-dialog.component';
import { Item, TextItemContent, LinkFormData, Link, LinkingFormJson, LinkSource } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { AppService } from '@app/app.service';
// declare var tinymce: any;

let tinyMceId = 0;

@Directive({
	selector: '[text-editor-tinymce]',
	providers: [WindowService]
})
export class TextEditorTinyMceDirective implements OnInit, OnChanges, OnDestroy {

	@Input('text-editor-enabled') enabled = false;
	@Input('text-editor-host') host: HTMLElement | undefined;
	@Input('text-editor-item') item: any;
	@Input('text-editor-items') items: Item[] = [];
	@Input('text-editor-toolbar-width') toolBarWidth = 503;
	@Input('text-editor-inline') inline = true;
	@Input('text-editor-hide-links') hideLinks = false;
	@Input('text-editor-toolbar-type') toolbarType = 0; //0: Default, 1: Button-Dialog, 2: Nav-Dialog
	@Input('text-editor-fontsize-type') fontSizeType = 0; //0: Default, 1: 30px, 2: 18px
	@Input('text-editor-fontsize') fontSize = '14px';
	@Input('text-editor-fontfamily') fontFamily = '';
	@Input('text-editor-input-stop') textInputStop = false;

	@Output('text-editor-destroyed') destroyed = new EventEmitter<string>();
	@Output('text-editor-input') input = new EventEmitter<string>();
	@Output('text-editor-input-text') inputText = new EventEmitter<string>();
	@Output('text-editor-input-command') inputCommand = new EventEmitter<{command: string, content: string}>();
	@Output('text-editor-has-link') hasLink = new EventEmitter<boolean>();

	private _elem: HTMLElement;

	private _tinyMceId: number;

	public editor = Maybe.nothing<Tinymce.Editor>();
	public _toolbar: JQuery;

	private _fontPickerWindow = Maybe.nothing<DialogWindow<FontPickerDialogComponent>>();
	private _colorPickerWindow = Maybe.nothing<DialogWindow<ColorPickerComponent>>();
	private _linkingDialogWindow = Maybe.nothing<DialogWindow<LinkingDialogComponent>>();

	public _onColorPicked = Maybe.nothing<(color: ColorRgb) => void>();

	public _stopListenFns: Function[] = [];

	public _cursorOffset = Maybe.nothing<number>();

	public _startingFont = Maybe.nothing<string>();

	public _fontlistClasses: any = ['', '', 'nav-fontlist'];

	constructor(
		private _elementRef: ElementRef,
		private _renderer: Renderer,
		private _windowService: WindowService,
		private _fontService: FontsService,
		private _appService: AppService,
		@Inject(DOCUMENT) private document: Document
	) { }

	ngOnInit() {
		this._elem = this._elementRef.nativeElement;
		this._tinyMceId = tinyMceId;
		this._renderer.setElementClass(this._elem, 'tinyMceId' + this._tinyMceId, true);
		tinyMceId++;
	}

	ngOnChanges(changes: SimpleChanges) {
		const enabledCh = changes['enabled'];
		if (enabledCh && this._elem) {
			if (enabledCh.currentValue === true) {
				this.createWindows();
				this.createEditor();
			} else {
				this.destroyEditor(true);
				this.destroyWindows();
			}
		}
	}

	createWindows() {
		const fontPicker = createFontPickerDialogWindow(this._windowService);
		fontPicker.componentRef.instance.close.asObservable().subscribe(fonts => {
			this._startingFont = Maybe.at(fonts.reverse(), 0).map(f => f.family);
			this.editor.map(editor => {
				if (editor.targetElm) {
					const container = editor.selection.getRng().startContainer;
					const elem = container instanceof HTMLElement
						? container
						: container.parentNode!;
					$(editor.targetElm).find('.__editor_cursor').removeClass('__editor_cursor');
					$(elem).addClass('__editor_cursor');
					this._cursorOffset = Maybe.just(editor.selection.getRng().startOffset);
				}
			});
			this.destroyEditor(false);
			this.createEditor();
		});

		this._fontPickerWindow = Maybe.just(fontPicker);

		const colorPicker = createColorPickerWindow(this._windowService, new ColorPickerForm(new ColorRgb()));
		colorPicker.componentRef.instance.close.asObservable().subscribe(color => {
			if (this._toolbar)
			  	this._toolbar.css({ opacity: 1 });
			color.apply(this._onColorPicked);
		});

		this._colorPickerWindow = Maybe.just(colorPicker);

		const linkingDialog = createLinkingDialogWindow(this._windowService, new LinkingForm());
		linkingDialog.componentRef.instance.close.subscribe(() => {
			this._toolbar.css({ opacity: 1 });
		});

		linkingDialog.componentRef.instance.submit.subscribe(link => {
			if (this._toolbar)
				this._toolbar.css({ opacity: 1 });
			this.editor.map(ed => {
				const rng = ed.selection.getRng();
				if (link) {
					const json = JSON.stringify(link);
					if (rng.collapsed) {
						const a = <HTMLAnchorElement>ancestors(rng.startContainer)
							.find(e => e instanceof HTMLAnchorElement);
						if (a) {
							a.removeAttribute('href');
							a.dataset['link'] = json;
						}
					} else {
						const a = document.createElement('a');
						a.dataset['link'] = json;
						a.text = rng.cloneContents().textContent || '';
						rng.deleteContents();
						rng.insertNode(a);
						document.getSelection().selectAllChildren(a);
						document.getSelection().collapseToEnd();
					}
				} else {
					const endContainer = rng.endContainer;
					const parentNode = endContainer.parentNode;
					const nextSibling = parentNode.nextSibling;
					const grandParentNode = parentNode.parentNode;

					if (parentNode.nodeName.toUpperCase() != 'A')
					  	return;

					const text = endContainer.textContent || '';
					const textNode = document.createTextNode(text);

					grandParentNode.removeChild(parentNode);
					grandParentNode.insertBefore(textNode, nextSibling);
					if (textNode.nextSibling) {
						document.getSelection().selectAllChildren(textNode.nextSibling);
						document.getSelection().collapseToEnd();
					}
				}
				this.inputText.emit(ed.getContent({ format: 'raw' }));
			});
		});
		this._linkingDialogWindow = Maybe.just(linkingDialog);
	}

	createEditor() {
		let toolbar1 = 'fontlist fontsizecombo bold italic underline strikethrough removeformat';
		let toolbar2 = 'forecolor backcolor alignleft aligncenter alignright alignjustify bullist numlist lineheightselect letterspacingselect moreactions';

		switch (this.toolbarType) {
			case 1:
				toolbar1 = 'fontlist fontsizecombo bold';
				toolbar2 = 'italic underline forecolor lineheightselect letterspacingselect';
				break;
			case 2:
				toolbar1 = ' navfontlist fontsizecombo';
				toolbar2 = 'bold italic underline forecolor hilitecolor backcolor';
				break;
			default:
				// code...
				break;
		}

		tinymce.init({
			// plugins: 'advlist textcolor colorpicker lineheight letterspacing '
			//	 + 'moreactions currentcolor charmap',
			plugins: 'paste advlist textcolor colorpicker lineheight letterspacing '
				+ 'moreactions',
			skin_url: '/assets/styles/tinymce/skins/lightgray',
			selector: '.tinyMceId' + this._tinyMceId,
			// content_style: ".mce-content-body {font-family:Arial,sans-serif;font-size:14px;}",
			statusbar: false,
			menubar: false,
			toolbar1: toolbar1,
			toolbar2: toolbar2,
			inline: this.inline,
			allow_html_in_named_anchor: true,
			font_formats: this._fonts(),
			paste_text_sticky: true,
			browser_spellcheck: true,
			lineheight_formats: '5px 10px 15px 20px 30px 40px Clear',
			color_picker_callback: (setColor, currColor) => {
				this._onColorPicked = Maybe.just((c: ColorRgb) => {
					const color = c.toString();
					const temp = Math.min(this._appService.textToolCustomColors.length, 7);
					setColor(c.toString());
					this._appService.textToolCustomColors[temp] = color;
				});
				if (this._toolbar) {
					this._toolbar.css({ opacity: 0 });
				}
				this._colorPickerWindow.map(w => w.open());
			},
			init_instance_callback: (editor) => {
			 	editor.pasteAsPlainText = true;
				setTimeout(() => {
					try {
						const hiliteColorBtn = new Maybe(editor.theme.panel)
							.bind(panel =>
								<Maybe<Tinymce.ui.ColorButton>>findWidget(panel, w =>
									w.type === 'colorbutton'
									&& (<Tinymce.ui.ColorButton>w).settings.format === 'hilitecolor'));
						hiliteColorBtn.map(btn => {
							btn.color(this._appService._textBackgroundColor);
							btn.on('click', ev => {
								const color = btn.color();
								if (this._appService._textBackgroundColor != color)
									this._appService._textBackgroundColor = color;
								});
						});
					} catch (err) {
					}

					try {
						const foreColorBtn = new Maybe(editor.theme.panel)
							.bind(panel =>
								<Maybe<Tinymce.ui.ColorButton>>findWidget(panel, w =>
									w.type === 'colorbutton'
									&& (<Tinymce.ui.ColorButton>w).settings.format === 'forecolor'));
						foreColorBtn.map(btn => {
							btn.color(this._appService._textForcolor);
							btn.on('click', ev => {
								const color = btn.color();
								if (this._appService._textForcolor != color)
									this._appService._textForcolor = color;
							});
						});
					} catch (err) {
					}
				});
			},
			setup: (editor) => {
				function toTimeHtml(date: any) {
					return '<time datetime="' + date.toString() + '">' + date.toDateString() + '</time>';
				}

				function insertDate() {
					let html = toTimeHtml(new Date());
					editor.insertContent(html);
				}

				editor.addButton<Tinymce.ui.ButtonOptions>('addfont', {
					type: 'button',
					text: 'ADD FONT',
					classes: 'add-font',
					onclick: () => {
						if (this._toolbar) {
						  	this._toolbar.css({ opacity: 0 });
						}
						this._fontPickerWindow.map(w => w.open());
					}
				});

				editor.addCommand('mycommand', (ui, v) => {
				});

				try {
					const fontSize: any = [...this._appService._fontSize[this.fontSizeType].map(f => ({type: 'menuitem', text: f + 'px' })), {type: 'menuitem', text: 'Custom Size'}];
					editor.addButton<Tinymce.ui.ComboboxOptions>('fontsizecombo', {
						type: 'combobox',
						tooltip: 'Font Size',
						classes: 'fontsizecombo',
						menu: fontSize,
						placeholder: 'Font Size',
						onPostRender: comboboxHandler(
							editor,
							style => style ? style.fontSize : undefined,
							comboBox => {
								comboBox.$el.find('input')
									.on('blur', function (this: HTMLInputElement, ev: Tinymce.Event) {
										const val = this.value;
										setTimeout(() => {
											// editor.execCommand('FontSize', false, val);
										}, 0);
									});
							}

						),
						onmousedown: (ev) => {
							ev.preventDefault();
							ev.stopPropagation();
							if (ev.control.text() == 'Custom Size') {
								const addFontSizeWin = createAddFontSizeDialogWindow(this._windowService);
								addFontSizeWin.componentRef.instance.submit.subscribe(res => {
									addFontSizeWin.destroy();
									let index = this._appService._fontSize[this.fontSizeType].findIndex(f => f == res);
									if (index < 0) {
										index = this._appService._fontSize[this.fontSizeType].findIndex(f => f > res);
										if (index < 0) {
											this._appService._fontSize[this.fontSizeType].push(res);
										} else {
											this._appService._fontSize[this.fontSizeType].splice(index, 0, res);
										}
									}
									editor.execCommand('FontSize', false, res + 'px');
									setTimeout(() => {
										this.destroyEditor(false);
										this.createEditor();
									});
								});
								addFontSizeWin.componentRef.instance.close.subscribe(res => {
									addFontSizeWin.destroy();
								});
								addFontSizeWin.open();
							}
						},
						onclick: (ev) => {
							ev.preventDefault();
							ev.stopPropagation();
							const fontSize = ev.control.text();
							const parent2 = ev.control.parent().parent();
							if (parent2.type === 'combobox') {
								//(<Tinymce.ui.Combobox><any>parent2).value(fontSize);
								editor.execCommand('FontSize', false, fontSize);
							}
						}
					});
				} catch (err) { }

				try {
					editor.addButton('fontlist', () => {
						const defaultFontsFormats =
							'Andale Mono=andale mono,monospace;' +
							'Arial=arial,helvetica,sans-serif;' +
							'Arial Black=arial black,sans-serif;' +
							'Book Antiqua=book antiqua,palatino,serif;' +
							'Comic Sans MS=comic sans ms,sans-serif;' +
							'Courier New=courier new,courier,monospace;' +
							'Georgia=georgia,palatino,serif;' +
							'Helvetica=helvetica,arial,sans-serif;' +
							'Impact=impact,sans-serif;' +
							'Symbol=symbol;' +
							'Tahoma=tahoma,arial,helvetica,sans-serif;' +
							'Terminal=terminal,monaco,monospace;' +
							'Times New Roman=times new roman,times,serif;' +
							'Trebuchet MS=trebuchet ms,geneva,sans-serif;' +
							'Verdana=verdana,geneva,sans-serif;' +
							'Webdings=webdings;' +
							'Wingdings=wingdings,zapf dingbats';

						const fontFormats = (editor.settings.font_formats || defaultFontsFormats)
							.split(';')
							.map(format => {
								const xs = format.split('=');
								return { name: xs[0], style: xs[1] };
							})
							.filter(format => !!format.style);

						const values = fontFormats.map(format =>
							({
								text: { raw: format.name },
								value: format.style,
								textStyle: format.style.indexOf('dings') === -1 ? 'font-family:' + format.style : ''
							}));

						return {
							type: 'listbox',
							text: 'Font Family',
							tooltip: 'Font Family',
							values: values,
							fixedWidth: true,
							onPostRender: function (this: Tinymce.ui.ListBox) {
								editor.on('nodeChange', (ev) => {
									let res = Maybe.nothing<string>();
									lodash.forEach(ev.parents, (node: any) => {
										lodash.forEach(values, (v: any) => {
											if (editor.formatter.matchNode(node, 'fontname', { value: v.value })) {
												res = Maybe.just(v.value);
												return false;
											}
										});
										if (res.hasValue()) {
											return false;
										}
									});

									if (res.hasValue()) {
										this.value(res.get());
									} else {
										new Maybe(getComputedStyle(ev.element).fontFamily)
											.map(fonts => fonts.split(',')[0])
											.map(font => this.value(font));
									}
								});
							},
							onselect: (ev: Tinymce.Event) => {
								const listbox = (<Tinymce.ui.ListBox><any>ev.control);
								if (listbox.settings.value) {
									editor.execCommand('FontName', false, listbox.settings.value);
								}
							}
						};
					});

				} catch (err) { }

				try {
					editor.addButton('navfontlist', () => {
						const defaultFontsFormats =
							'Andale Mono=andale mono,monospace;' +
							'Arial=arial,helvetica,sans-serif;' +
							'Arial Black=arial black,sans-serif;' +
							'Book Antiqua=book antiqua,palatino,serif;' +
							'Comic Sans MS=comic sans ms,sans-serif;' +
							'Courier New=courier new,courier,monospace;' +
							'Georgia=georgia,palatino,serif;' +
							'Helvetica=helvetica,arial,sans-serif;' +
							'Impact=impact,sans-serif;' +
							'Symbol=symbol;' +
							'Tahoma=tahoma,arial,helvetica,sans-serif;' +
							'Terminal=terminal,monaco,monospace;' +
							'Times New Roman=times new roman,times,serif;' +
							'Trebuchet MS=trebuchet ms,geneva,sans-serif;' +
							'Verdana=verdana,geneva,sans-serif;' +
							'Webdings=webdings;' +
							'Wingdings=wingdings,zapf dingbats';

						const fontFormats = (editor.settings.font_formats || defaultFontsFormats)
							.split(';')
							.map(format => {
								const xs = format.split('=');
								return { name: xs[0], style: xs[1] };
							})
							.filter(format => !!format.style);
						const values = fontFormats.map(format =>
							({
								text: { raw: format.name },
								value: format.style,
								textStyle: format.style.indexOf('dings') === -1 ? 'font-family:' + format.style : ''
							}));

						return {
							type: 'listbox',
							text: 'Font Family',
							classes: 'navfontlist',
							tooltip: 'Font Family',
							values: values,
							fixedWidth: true,
							onPostRender: function (this: Tinymce.ui.ListBox) {
								editor.on('nodeChange', (ev) => {
									let res = Maybe.nothing<string>();
									lodash.forEach(ev.parents, (node: any) => {
										lodash.forEach(values, (v: any) => {
											if (editor.formatter.matchNode(node, 'fontname', { value: v.value })) {
												res = Maybe.just(v.value);
												return false;
											}
										});
										if (res.hasValue()) {
											return false;
										}
									});

									if (res.hasValue()) {
										this.value(res.get());
									} else {
										new Maybe(getComputedStyle(ev.element).fontFamily)
											.map(fonts => fonts.split(',')[0])
											.map(font => this.value(font));
									}
								});
							},
							onselect: (ev: Tinymce.Event) => {
								const listbox = (<Tinymce.ui.ListBox><any>ev.control);
								if (listbox.settings.value) {
									editor.execCommand('FontName', false, listbox.settings.value);
								}
							}
						};
					});

				} catch (err) { }
			}
		}).then(editors => {
			this.editor = Maybe.just(editors[0]);
			this.editor.map(editor => {
				editor.on('ExecCommand', ev => {
					if (['Undo', 'Redo', 'mceInsertContent'].indexOf(ev['command']) >= 0) return;
					this.inputCommand.emit({command: ev['command'], content: editor.getContent({ format: 'raw' })});
					if (ev['command'] == 'mceApplyTextcolor') {
						this._appService.currentTextToolColor = ev['value'];
					}
					// setTimeout(() => {
					// 	this.editor.map(ed => this.input.emit(ed.getContent({ format: 'raw' })));
					// 	// this.inputCommand.emit({command: ev['command'], content: editor.getContent({ format: 'raw' })});
					// }, 0);
					this._positionToolbar();
				});

				editor.on('PastePreProcess', ev => {
					const tmpEle = document.createElement('div');
					tmpEle.innerHTML = ev['content'];
					const a_eles = tmpEle.getElementsByTagName('a');

					for (let i = 0; i < a_eles.length; i++) {
						if (a_eles[i].href) {
							a_eles[i].dataset['link'] = JSON.stringify({type: 'website', website: a_eles[i].href});
							a_eles[i].removeAttribute('href');
						}
					}
					ev['content'] = tmpEle.innerHTML;
				});

				editor.on('MouseUp', (ev) => {
				  	this.hasLink.emit(this.hasSelectionLink());
				});

				editor.on('keydown', (ev: any) => {
					if (this.textInputStop && [8, 37, 38, 39, 40, 45, 46].indexOf(ev.keyCode) < 0) {
						ev.stopPropagation();
						ev.preventDefault();
						return;
					}

					if (ev.keyCode == 9) {
						ev.preventDefault();
						ev.stopPropagation();
						editor.execCommand('mceInsertContent', false, '&emsp;&emsp;');
					}

					setTimeout(() => {
						this.editor.map(ed => this.inputText.emit(ed.getContent({ format: 'raw' })));
						//this.editor.map(ed => this.inputText.emit(ed.getContent()));
					}, 0);
				});

				if (this._cursorOffset.hasValue() && editor.targetElm) {
					// Move cursor to its last position.
					const elem: any = $(editor.targetElm).find('.__editor_cursor')[0];
					if (elem instanceof HTMLElement) {
						editor.selection.setCursorLocation(elem.childNodes[0], this._cursorOffset.value!);
					} else if (elem instanceof Node) {
						editor.selection.setCursorLocation(elem, this._cursorOffset.value!);
					}
				} else if (this._elem.innerText.length > 0) {
					// Move cursor to the end of content.
					const sel = getSelection();
					sel.selectAllChildren(this._elem);
					sel.collapseToEnd();
				}

				this._startingFont.map(font => {
					editor.execCommand('FontName', false, font);
					this._startingFont = Maybe.nothing<string>();
				});

				$(editor.getDoc()).contents().find('body').focus(function () {
					$('.mce-tinymce').css('border-color', '#ffa500');
				});

				$(editor.getDoc()).contents().find('body').blur(function () {
					$('.mce-tinymce').css('border-color', '#ccc');
				});

				editor.focus();

				editor.on('click', ev => {
					const aEle = ancestors(ev.target as HTMLElement).find(el => el instanceof HTMLAnchorElement);
					if (
						aEle ||
						ev.target instanceof HTMLAnchorElement
						&& ancestors(ev.target).find(el => el === editor.targetElm)
					) {
						ev.preventDefault();
						ev.stopPropagation();
						this.showLinkDialog();
					}
				});

				const interval = setInterval(() => {
					this._toolbar = $('body > .mce-tinymce-inline');

					$('.mce-open').on('click', (e) => {
						setTimeout(() => {
							const customColors = $('div[title*=\'Custom color\']');	
							if (customColors && customColors.length) {
								for (let j = 0; j < customColors.length; j++) {
									const customColorDiv = customColors.get(j);
									const color = this._appService.textToolCustomColors[j];
									customColorDiv.setAttribute('data-mce-color', color ? `${color}` : `none`);
									customColorDiv.setAttribute('style', `background: ${color ? `${color}` : `none`}`);
								}
							}
						});
					});
					if (!this.hideLinks) {
						if (this._toolbar.length > 0) {
							const addLink = $('<a>LINK</a>')
								.on('mousedown', e => {
									e.preventDefault();
									e.stopPropagation();
									this.showLinkDialog();
								});

							const addFonts = $('<a>ADD FONTS</a>')
								.on('click', () => {
									if (this._toolbar) {
									  this._toolbar.css({ opacity: 0 });
									}
									this._fontPickerWindow.map(w => w.open());
								});

							let links = $('<div class="links"></div>')
								.append(addLink)
								.append(addFonts);

							if (this.toolbarType == 0) {
								links = links.append('<a>FEEDBACK</a>');
							}
							this._toolbar.append(links);
						}
					}
					this._positionToolbar();
					if (this._toolbar) {
					  this._toolbar.css({ opacity: 1 });
					}

					const container0 = this._toolbar.children('.mce-container-body');
					const container1 = container0.children('.mce-mce-toolbar-grp-body');
					const container2 = container1.children('.mce-container-body');
					if (this._toolbar) {
					  this._toolbar
							.add(container0)
							.add(container1)
							.add(container2)
							.css({ width: this.toolBarWidth });
					}

					this._stopListenFns = ancestors(this._elementRef.nativeElement)
						.map(e => this._renderer.listen(e, 'scroll', () => this._positionToolbar()));

					clearInterval(interval);
				}, 50);
			});
		});
	}

	@HostListener('paste')
	onPaste() {
		setTimeout(() => this.editor.map(ed => this.inputText.emit(ed.getContent({ format: 'raw' }))), 0);
	}

	showLinkDialog(linkMode = 0) { // 0 => link, 1 => download
		this.editor.map(editor =>
			this._linkingDialogWindow.map(w => {
				w.componentRef.instance.linkMode = linkMode;
				const selectionRng = editor.selection.getRng();

				if (ancestors(selectionRng.startContainer).find(el => el === editor.targetElm)) {
					let text = '';
					let href = null;
					let dataset = null;

					let seletedAEle = selectionRng.startContainer.parentElement;

					if (!(seletedAEle instanceof HTMLAnchorElement)) {
						seletedAEle = ancestors(seletedAEle).find(el => el instanceof HTMLAnchorElement);
					}

					if (!(seletedAEle instanceof HTMLAnchorElement)) {
						seletedAEle = selectionRng.startContainer.parentElement;

						if (!(seletedAEle instanceof HTMLAnchorElement)) {
							seletedAEle = ancestors(seletedAEle).find(el => el instanceof HTMLAnchorElement);
						}
					}

					if (seletedAEle instanceof HTMLAnchorElement) {
						text = seletedAEle.text;
						href = seletedAEle.getAttribute('href');
						dataset = seletedAEle.dataset;
					} else {
						text = selectionRng.cloneContents().textContent || '';
						href = selectionRng.startContainer.parentElement.getAttribute('href');
					}

					w.componentRef.instance.form.setLinkValue(
						new LinkFormData(
							new LinkSource('LinkSourceText', text),
							dataset && dataset['link'] ? JSON.parse(dataset['link']) : href ? {type: 'website', website: href} : null
						),
						{ emitEvent: true }
					);

					if (dataset && dataset['link']) {
					  const link = JSON.parse(dataset['link']);
					  // console.log(ancestors(selectionRng.startContainer).find(el => el === editor.targetElm), link);
					  if (link.type == 'download') {
						  w.componentRef.instance.linkMode = 1;
					  }
					}
				}
				if (this._toolbar) {
				  this._toolbar.css({ opacity: 0 });
				}
				w.open();
			})
		);
	}

	hasSelectionLink() {
		if (!this.editor) return false;
		const editor = this.editor.value;
		const selectionRng = editor.selection.getRng();
		if (ancestors(selectionRng.startContainer).find(el => el === editor.targetElm)) {
			return selectionRng.startContainer.parentElement.tagName.toLowerCase() == 'a';
		} else { return false; }
	}

	public _fonts(): string {
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

		return this._fontService.myFonts.map(f => f.family)
			.concat(defaultFonts)
			.map(f => f + '=' + f)
			.join(';');
	}

	public _positionToolbar() {
		const hostViewBox = this._hostViewBox();
		//const offset = this.hideLinks ? 5 : 20;
		const offset = this.hideLinks ? 90 : 100;
		let top = hostViewBox.top;
		if (hostViewBox.top > 100) {
			top += this.document.body.scrollTop;
		}
		top -= offset;

		if (this._toolbar)
			this._toolbar.css({
				top: top + 'px',
				left: hostViewBox.left + 'px'
			});
	}

	public _hostViewBox(): Box {
		const rect = this.host
			? this.host.getBoundingClientRect()
			: this._elem.getBoundingClientRect();
		return new Box(
			Math.round(rect.left),
			Math.round(rect.left + rect.width),
			Math.round(rect.top),
			Math.round(rect.top + rect.height)
		);
	}

	destroyEditor(emit: boolean) {
		const text = this.editor.mapDef('', e => e.getContent({ format: 'raw' }));

		this.editor.map(() => {
			tinymce.remove('.tinyMceId' + this._tinyMceId);
			this.editor = Maybe.nothing<Tinymce.Editor>();
		});

		if (this._stopListenFns) {
			this._stopListenFns.map(fn => fn());
			this._stopListenFns = [];
		}

		if (emit && this) {
			this.destroyed.emit(text);
		}
	}

	destroyWindows() {
		this._fontPickerWindow.map(w => {
			w.destroy();
			this._fontPickerWindow = Maybe.nothing<DialogWindow<FontPickerDialogComponent>>();
		});

		this._colorPickerWindow.map(w => {
			w.destroy();
			this._colorPickerWindow = Maybe.nothing<DialogWindow<ColorPickerComponent>>();
		});

		this._linkingDialogWindow.map(w => {
			w.destroy();
			this._linkingDialogWindow = Maybe.nothing<DialogWindow<LinkingDialogComponent>>();
		});
	}

	ngOnDestroy() {
		this.destroyEditor(false);
		this.destroyWindows();
	}
}

tinymce.PluginManager.add('moreactions', function (editor, url) {
	setTimeout(() => {
		editor.formatter.register('subscript', {
			inline: 'sub',
			deep: true,
			split: true
		});
		editor.formatter.register('superscript', {
			inline: 'sup',
			deep: true,
			split: true
		});
	}, 0
	);

	editor.addButton<Tinymce.ui.ListBoxOptions>('moreactions', {
		type: 'listbox',
		text: 'More',
		classes: 'moreactionslist',
		values: [
			{ text: 'Special Character', value: 'Special Character' },
			{ text: 'Subscript', value: 'Subscript' },
			{ text: 'Superscript', value: 'Superscript' },
			{ text: 'Horizontal Line', value: 'Horizontal Line' }],
		onclick: function (this: Tinymce.ui.ListBox, ev: Tinymce.Event) {
			if (ev.control.type !== 'menuitem') { return; }
			switch (this.value()) {
				case 'Special Character':
					editor.execCommand('mceShowCharmap');
					break;
				case 'Subscript':
					editor.formatter.toggle('subscript');
					break;
				case 'Superscript':
					editor.formatter.toggle('superscript');
					break;
				case 'Horizontal Line':
					editor.execCommand('InsertHorizontalRule');
					break;
			}
			this.value('');
		}
	});
});

// tinymce.PluginManager.add('currentcolor', function (editor, url) {
//	 // Change color of the colorpicker buttons to match selected node colors.
//	 editor.on('nodeChange', (ev) => {
//		 const foreColorBtn = new Maybe(editor.theme.panel)
//			 .bind(panel =>
//				 <Maybe<Tinymce.ui.ColorButton>>findWidget(panel, w =>
//					 w.type === 'colorbutton'
//					 && (<Tinymce.ui.ColorButton>w).settings.format === 'forecolor'));
//		 foreColorBtn.map(btn => {
//			 new Maybe(getComputedStyle(ev.element).color)
//				 .mapDef(
//					 btn.resetColor(),
//					 color => {
//						 Maybe.match(color, /rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/)
//							 .bind(([_, _r, _g, _b, a]) => Maybe.parseInt(a, 10))
//							 .map(a => a === 0
//								 ? btn.resetColor()
//								 : btn.color(color));

//						 Maybe.match(color, /rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
//							 .map(() => btn.color(color));
//					 });
//		 });
//		 try {
//			 const hiliteColorBtn = new Maybe(editor.theme.panel)
//				 .bind(panel =>
//					 <Maybe<Tinymce.ui.ColorButton>>findWidget(panel, w =>
//						 w.type === 'colorbutton'
//						 && (<Tinymce.ui.ColorButton>w).settings.format === 'hilitecolor'));
//			 hiliteColorBtn.map(btn => {
//				 findStyledAncestor(ev.element, editor, style => style.backgroundColor)
//					 .bind(el => new Maybe(el.style.backgroundColor))
//					 .mapDef(
//						 btn.resetColor(),
//						 backColor => {
//							 Maybe.match(backColor, /rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/)
//								 .bind(([_, _r, _g, _b, a]) => Maybe.parseInt(a, 10))
//								 .map(a => a === 0
//									 ? btn.resetColor()
//									 : btn.color(backColor));

//							 Maybe.match(backColor, /rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
//								 .map(() => btn.color(backColor));
//						 });
//			 });
//		 } catch (err) { }
//	 });
// });


function comboboxHandler(
	editor: Tinymce.Editor,
	stylePropSelector: (style: CSSStyleDeclaration) => any,
	setHandler: (comboBox: Tinymce.ui.Combobox) => void
) {
	return function (this: Tinymce.ui.Combobox) {
		editor.on('nodeChange', (ev) => {
			setTimeout(() => {
				findStyledAncestor(ev.element, editor, stylePropSelector)
					.mapDef(
						this.value(stylePropSelector(getComputedStyle(ev.element))),
						el => this.value(stylePropSelector(el.style)));
			}, 0);
		});

		setHandler(this);
	};
}

/** Find first editable ancestor with specified style property set. */
function findStyledAncestor(
	elem: HTMLElement,
	editor: Tinymce.Editor,
	stylePropSelector: (style: CSSStyleDeclaration) => any
): Maybe<HTMLElement> {
	return new Maybe(editor.targetElm)
		.bind(targetElm =>
			Maybe.find(
				ancestorsUpTo(elem, targetElm, true),
				el => !!stylePropSelector(el.style)));
}

/** Find first widget inside a container satisfying a predicate. */
function findWidget(
	container: Tinymce.ui.Container,
	predicate: (widget: Tinymce.ui.Widget) => boolean
): Maybe<Tinymce.ui.Widget> {
	if (predicate(container)) {
		return Maybe.just(container);
	} else if (typeof container.items === 'function') {
		const items = container.items();
		for (let i = 0; i < items.length; i++) {
			const w = findWidget(<Tinymce.ui.Container>items[i], predicate);
			if (w.hasValue()) {
				return w;
			}
		}
	}
	return Maybe.nothing<Tinymce.ui.Widget>();
}
