import {
	Directive,
	ElementRef,
	OnInit,
	Input,
	OnChanges,
	AfterViewInit,
	SimpleChanges,
	Renderer,
	Output,
	EventEmitter,
	OnDestroy,
	HostListener,
	Inject
} from "@angular/core";
import { DOCUMENT } from "@angular/platform-browser";

import {
	cloneDeep as _cloneDeep,
	forEach as _forEach,
	indexOf as _indexOf,
	isEqual as _isEqual,
	keys as _keys,
} from "lodash";
import { Box } from "@app-lib/rect/rect";
import { ancestors, ancestorsUpTo } from "@app-lib/dom/dom";
import { Maybe } from "@app-lib/maybe/maybe";
import {
	createColorPickerWindow,
	ColorPickerForm,
	ColorRgb,
	ColorPickerComponent
} from "@app-dialogs/color-picker/color-picker.component";
import {
	createFontPickerDialogWindow,
	FontPickerDialogComponent,
	FontsService
} from "@app-dialogs/font-picker/font-picker.component";
import { createAddFontSizeDialogWindow } from "@app-dialogs/add-fontsize-dialog/add-fontsize-dialog.component";
import {
	createLinkingDialogWindow,
	LinkingForm
} from "@app-dialogs/linking-dialog/linking-dialog.component";
import { LinkFormData, Link, LinkSource } from "@app/models";
import { AppService } from "@app/app.service";
import { WindowService, DialogWindow } from "@app-common/window/window.service";

@Directive({
	selector: "[text-tool]",
	providers: [WindowService]
})
export class TextAreaToolDirective implements OnInit, OnChanges, OnDestroy, AfterViewInit {
	@Input('text-tool-host') host: HTMLElement | undefined;
	@Input('text-tool-target') targetId: string = '';
	@Input('text-tool-width') toolbarWidth: number = 503;
	@Input('text-tool-showLink') showLink: boolean = false;
	@Input('text-tool-type') toolbarType: number = 0; //0: Default, 1: Button-Dialog, 2: Nav-Dialog
	@Input('text-tool-fontsize-type') fontSizeType: number = 0; //0: Default, 1: 30px, 2: 18px

	@Input('text-tool-input') inputValue: any = {
		fontSize: '14px',
		fontFamily: '',
		bold: false,
		italic: false,
		underline: false,
		color: 'black',
		backgroundColor: 'white'
	};
	@Input('text-tool-input-elem') inputElem: HTMLElement = null;
	@Input('text-tool-input-link') inputLink: Link = null;

	@Output('text-tool-output')	outputValue = new EventEmitter<any>();
	@Output('text-tool-output-Link') outputLink = new EventEmitter<Link>();

	public _elem: HTMLElement;
	public viewInit: boolean = false;
	public toolInit: boolean = false;
	public enableOutput: boolean = false;
	public interval: any;
	public toolValue: any = {
		fontSize: '14px',
		fontFamily: '',
		bold: false,
		italic: false,
		underline: false,
		color: 'black',
		backgroundColor: 'white'
	};

	public _editor = Maybe.nothing<Tinymce.Editor>();
	public _toolbar: JQuery;

	public _fontPickerWindow = Maybe.nothing<DialogWindow<FontPickerDialogComponent>>();
	public _colorPickerWindow = Maybe.nothing<DialogWindow<ColorPickerComponent>>();

	public _onColorPicked = Maybe.nothing<(color: ColorRgb) => void>();

	public _startingFont = Maybe.nothing<string>();

	public _fontlistClasses: any = ['', '', 'nav-fontlist'];

	constructor(
		public _elementRef: ElementRef,
		public _renderer: Renderer,
		public _windowService: WindowService,
		public _fontService: FontsService,
		public _appService: AppService,
		@Inject(DOCUMENT) public document: Document
	) {}

	ngOnInit() {
		this._elem = this._elementRef.nativeElement;
	}

	ngAfterViewInit() {
		this.createWindows();
		this.createEditor({});
		this.setTinyMceStyle();
	}

	setTinyMceStyle() {
		setTimeout(() => {
			this.viewInit = true;
			$('.mce-container').css({
				width: `${this.toolbarWidth}px`,
				border: 'none',
				background: 'transparent',
				height: '1px'
			});

			$('.mce-toolbar-grp').css({
				width: `${this.toolbarWidth}px`,
				border: '1px solid #8c8c8c',
				height: '60px',
				position: 'relative'
			});

			$('.mce-toolbar').css({
				width: `${this.toolbarWidth}px`,
				border: 'none',
				background: 'transparent',
				height: '30px'
			});

			$('.edit-container').css({
				display: 'none'
			});

			$('#text-tool_ifr').css({
				display: 'none'
			});
		});
	}

	setTinymceTools() {
		if (!this._editor.hasValue()) return;

		if (this.toolValue.color != this.inputValue.color || !this.toolInit)
			this._editor.value.execCommand(
				'Forecolor',
				false,
				this.inputValue.color,
				{ skip_focus: true }
			);

		if (
			this.toolValue.backgroundColor != this.inputValue.backgroundColor ||
			!this.toolInit
		)
			this._editor.value.execCommand(
				'HiliteColor',
				false,
				this.inputValue.backgroundColor
			);

		if (
			this.toolValue.fontFamily != this.inputValue.fontFamily ||
			!this.toolInit
		)
			this._editor.value.execCommand(
				'FontName',
				false,
				this.inputValue.fontFamily,
				{ skip_focus: true }
			);

		if (this.toolValue.fontSize != this.inputValue.fontSize || !this.toolInit)
			this._editor.value.execCommand(
				'FontSize',
				false,
				this.inputValue.fontSize
			);

		if (this.toolValue.bold != this.inputValue.bold)
			this._editor.value.execCommand('Bold', false, null);

		if (this.toolValue.italic != this.inputValue.italic)
			this._editor.value.execCommand('Italic', false, null);

		if (this.toolValue.underline != this.inputValue.underline)
			this._editor.value.execCommand('Underline', false, null);
		this.toolInit = true;
		this.enableOutput = true;
		clearInterval(this.interval);
	}

	ngOnChanges(changes: SimpleChanges) {
		if (this.viewInit && this._editor.hasValue()) {
			if (changes['inputValue'] && changes['inputValue'].currentValue) {
				this.enableOutput = false;
				this.interval = setInterval(() => {
					this.setTinymceTools();
				}, 50);
			}
		}
	}

	createWindows() {
		const fontPicker = createFontPickerDialogWindow(this._windowService);
		fontPicker.componentRef.instance.close.asObservable().subscribe(fonts => {
			this._toolbar.css({ opacity: 1 });
			this._startingFont = Maybe.at(fonts.reverse(), 0).map(f => f.family);
			this.destroyEditor(false);
			this.createEditor({});
			this.setTinyMceStyle();
			this.toolInit = false;
		});
		this._fontPickerWindow = Maybe.just(fontPicker);

		const colorPicker = createColorPickerWindow(
			this._windowService,
			new ColorPickerForm(new ColorRgb())
		);
		colorPicker.componentRef.instance.close.subscribe(color => {
			this._toolbar.css({ opacity: 1 });
			color.apply(this._onColorPicked);
		});
		this._colorPickerWindow = Maybe.just(colorPicker);
	}

	createEditor(textTools: Object) {
		let toolbar1: string = 'fontlist fontsizecombo bold italic underline strikethrough removeformat';
		let toolbar2: string = 'forecolor backcolor alignleft aligncenter alignright alignjustify bullist numlist lineheightselect letterspacingselect moreactions';
		switch (this.toolbarType) {
			case 1:
				toolbar1 = 'fontlist fontsizecombo bold';
				toolbar2 = 'italic underline forecolor lineheightselect letterspacingselect';
				break;
			case 2:
				toolbar1 = 'fontlist fontsizecombo';
				toolbar2 = 'bold italic underline forecolor hilitecolor backcolor';
				break;
			default:
				// code...
				break;
		}

		tinymce
			.init({
				// plugins: 'advlist textcolor colorpicker lineheight letterspacing '
				//		 + 'moreactions currentcolor charmap',
				plugins:
					'advlist textcolor colorpicker lineheight letterspacing ' +
					'moreactions',
				skin_url: '/assets/styles/tinymce/skins/lightgray',
				selector: `#${this.targetId}`,
				statusbar: false,
				menubar: false,
				toolbar1: toolbar1,
				toolbar2: toolbar2,
				allow_html_in_named_anchor: true,
				font_formats: this._fonts(),

				color_picker_callback: (setColor, currColor) => {
					this._onColorPicked = Maybe.just((c: ColorRgb) =>
						setColor(c.toString())
					);
					this._toolbar.css({ opacity: 0 });
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
								})
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
								})
							});
						} catch (err) {
						}
					});
				},
				setup: editor => {
					editor.addButton<Tinymce.ui.ButtonOptions>('addfont', {
						type: 'button',
						text: 'ADD FONT',
						classes: 'add-font',
						onclick: () => {
							this._toolbar.css({ opacity: 0 });
							this._fontPickerWindow.map(w => {
								w.open();
							});
						}
					});

					try {
						const fontSize: any = [
							...this._appService._fontSize[0].map(f => {
								return { type: 'menuitem', text: f + 'px' };
							}),
							{ type: 'menuitem', text: 'Custom Size' }
						];
						editor.addButton<Tinymce.ui.ComboboxOptions>('fontsizecombo', {
							type: 'combobox',
							tooltip: 'Font Size',
							classes: 'fontsizecombo',
							menu: fontSize,
							placeholder: 'Font Size',
							onPostRender: comboboxHandler(
								editor,
								style => (style ? style.fontSize : undefined),
								comboBox =>
									comboBox.$el
										.find('input')
										.on('blur', function(
											this: HTMLInputElement,
											ev: Tinymce.Event
										) {
											const val = this.value;
											setTimeout(() => {
												//editor.execCommand('FontSize', false, val);
											}, 0);
										})
							),
							onmousedown: ev => {
								ev.preventDefault();
								ev.stopPropagation();
								if (ev.control.text() == 'Custom Size') {
									const addFontSizeWin = createAddFontSizeDialogWindow(
										this._windowService
									);
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
										
										this.destroyEditor(false);
										this.createEditor(
											{'FontSize': `${res}px`}
										);
										this.setTinyMceStyle();
									});
									addFontSizeWin.componentRef.instance.close.subscribe(res => {
										addFontSizeWin.destroy();
									});
									addFontSizeWin.open();
								}
							},
							onclick: ev => {
								const fontSize = ev.control.text();
								const parent2 = ev.control.parent().parent();
								if (parent2.type === 'combobox') {
									//(<Tinymce.ui.Combobox><any>parent2).value(fontSize);
									editor.execCommand('FontSize', false, fontSize);
								}
							}
						});
					} catch (err) {}

					try {
						editor.addButton('fontlist', () => {
							const fontFormats = this._fonts()
								.split(';')
								.map(format => {
									const xs = format.split('=');
									return { name: xs[0], style: xs[1] };
								})
								.filter(format => !!format.style);

							const values = fontFormats.map(format => ({
								text: { raw: format.name },
								value: format.style,
								textStyle:
									format.style.indexOf('dings') === -1
										? 'font-family:' + format.style
										: ''
							}));

							return {
								type: 'listbox',
								text: 'Font Family',
								// classes: 'navfontlist',
								tooltip: 'Font Family',
								values: values,
								fixedWidth: true,
								onPostRender: function(this: Tinymce.ui.ListBox) {
									editor.on('nodeChange', ev => {
										let res = Maybe.nothing<string>();
										_forEach(ev.parents, (node: any) => {
											_forEach(values, (v: any) => {
												if (
													editor.formatter.matchNode(node, 'fontname', {
														value: v.value
													})
												) {
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
									const listbox = <Tinymce.ui.ListBox>(<any>ev.control);
									if (listbox.settings.value) {
										editor.execCommand(
											'FontName',
											false,
											listbox.settings.value
										);
									}
								}
							};
						});
					} catch (err) {}
				}
			})
			.then(editors => {
				this._editor = Maybe.just(editors[0]);
				this._editor.map(editor => {
					editor.on('change', ev => {
						const content = editor.getContent();
						const fontFamily = content.indexOf('font-family');
						const size = content.indexOf('font-size');
						const backColor = content.indexOf('background-color');
						const color = content.indexOf('color');

						this.toolValue.bold = content.indexOf('strong') > -1;
						this.toolValue.italic = content.indexOf('em') > -1;
						this.toolValue.underline = content.indexOf('underline') > -1;

						if (backColor > 0) {
							const first = content.indexOf(':', backColor) + 1;
							this.toolValue.backgroundColor = content.substr(
								first + 1,
								content.indexOf(';', backColor) - 1 - first
							);
						} else {
							this.toolValue.backgroundColor = 'white';
						}

						if (size > 0) {
							const first = content.indexOf(':', size) + 1;
							this.toolValue.fontSize = content.substr(
								first + 1,
								content.indexOf(';', size) - 1 - first
							);
						} else {
							this.toolValue.fontSize = '14px';
						}

						if (color > 0) {
							const first = content.indexOf(':', color) + 1;
							this.toolValue.color = content.substr(
								first + 1,
								content.indexOf(';', color) - 1 - first
							);
						} else {
							this.toolValue.color = 'black';
						}

						if (fontFamily > 0) {
							const first = content.indexOf(':', fontFamily) + 1;
							this.toolValue.fontFamily = content.substr(
								first + 1,
								content.indexOf(';', fontFamily) - 1 - first
							);
						} else {
							this.toolValue.fontFamily = '';
						}

						if (this.enableOutput && !_isEqual(this.toolValue, this.inputValue)) {
							this.outputValue.emit(_cloneDeep(this.toolValue));
							//this.outputValue.emit(this.toolValue);
						}
					});

					const interval = setInterval(() => {
						this._toolbar = $('.mce-toolbar-grp');
						if (this.showLink) {
							if (this._toolbar.length > 0) {
								const addLink = $('<a>LINK</a>').on('mousedown', e => {
									e.preventDefault();
									e.stopPropagation();
									this.showLinkDialog();
								});

								const addFonts = $('<a>ADD FONTS</a>').on('click', () => {
									this._toolbar.css({ opacity: 0 });
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

						this._toolbar.css({ opacity: 1 });

						const container0 = this._toolbar.children('.mce-container-body');
						const container1 = container0.children('.mce-mce-toolbar-grp-body');
						const container2 = container1.children('.mce-container-body');
						this._toolbar
							.add(container0)
							.add(container1)
							.add(container2)
							.css({ width: this.toolbarWidth });

						clearInterval(interval);
					}, 150);

					editor.execCommand('selectAll', false);
					_keys(textTools).forEach(k => {
						editor.execCommand(k, true, textTools[k]);
					});
				});
			});
	}

	showLinkDialog() {
		const linkingDialog = createLinkingDialogWindow(
			this._windowService,
			new LinkingForm(new LinkFormData())
		);
		linkingDialog.changeInputs(c => {
			c.form.setLinkValue(
				new LinkFormData(
					new LinkSource(
						'LinkSourceText',
						this.inputElem ? this.inputElem.innerText : ''
					),
					this.inputLink
				)
			);
		});

		linkingDialog.componentRef.instance.close.subscribe(() => {
			this._toolbar.css({ opacity: 1 });
		});

		linkingDialog.componentRef.instance.submit.subscribe(link => {
			this._toolbar.css({ opacity: 1 });
			this.outputLink.emit(link);
		});
		this._toolbar.css({ opacity: 0 });
		linkingDialog.open();
	}

	public _fonts(): string {
		const defaultFonts = [
			"Andale Mono",
			"Arial",
			"Arial Black",
			"Book Antiqua",
			"Comic Sans MS",
			"Courier New",
			"Georgia",
			"Helvetica",
			"Impact",
			"Lato",
			"Symbol",
			"Tahoma",
			"Terminal",
			"Times New Roman",
			"Trebuchet MS",
			"Verdana",
			"Webdings",
			"Wingdings"
		];

		return this._fontService.myFonts
			.map(f => f.family)
			.concat(defaultFonts)
			.map(f => f + '=' + f)
			.join(';');
	}

	destroyEditor(emit: boolean) {
		if (!this._editor && !this._editor.value)
			return;
		tinymce.remove();
		this._editor = Maybe.nothing<Tinymce.Editor>();
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
	}

	ngOnDestroy() {
		tinymce.remove();
		this.destroyEditor(false);
		this.destroyWindows();
	}
}

function comboboxHandler(
	editor: Tinymce.Editor,
	stylePropSelector: (style: CSSStyleDeclaration) => any,
	setHandler: (comboBox: Tinymce.ui.Combobox) => void
) {
	return function(this: Tinymce.ui.Combobox) {
		editor.on("nodeChange", ev => {
			setTimeout(() => {
				findStyledAncestor(ev.element, editor, stylePropSelector).mapDef(
					this.value(stylePropSelector(getComputedStyle(ev.element))),
					el => this.value(stylePropSelector(el.style))
				);
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
	return new Maybe(editor.targetElm).bind(targetElm =>
		Maybe.find(
			ancestorsUpTo(elem, targetElm, true),
			el => !!stylePropSelector(el.style)
		)
	);
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
