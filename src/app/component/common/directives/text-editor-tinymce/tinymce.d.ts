declare namespace Tinymce {
    interface TinyMce {
        init(options: InitOptions): Promise<Editor[]>;
		remove(selector?: string): void;
		get(c: any): any;

        PluginManager: PluginManager;
    }

    interface InitOptions {
        plugins                   ?: string,
        resize                    ?: boolean,
        skin_url                  ?: string,
        placeholder_attrs         ?: any,
        selector                  ?: string;
        content_style             ?: string;
        statusbar                 ?: boolean;
        menubar                   ?: boolean,
        toolbar1                  ?: string,
        toolbar2                  ?: string,
        inline                    ?: boolean;
        allow_html_in_named_anchor?: boolean;
        forced_root_block         ?: boolean;
        font_formats              ?: string;
        fontsize_formats          ?: string;
		setup                     ?: (editor: Editor) => void;
        color_picker_callback     ?:
            (setColorFn: (newColor: string) => void, currentColor: string) => void;
        init_instance_callback    ?: (editor: Editor) => void;
        branding                  ?: boolean;
        max_height                ?: number;
        fixed_toolbar_container   ?: string;
        paste_text_sticky         ?: boolean;
		browser_spellcheck        ?: boolean;
		lineheight_formats        ?: string;
    }

    interface Editor {
        getContent(options?: { format: 'raw' }): string;
        dom: DomUtils;

        on(eventName: string, handler: (e: Event) => void): void;
        on(eventName: 'change', handler: (e: Event) => void): void;
        on(eventName: 'init', handler: (e: Event) => void): void;
        on(eventName: 'show', handler: (e: Event) => void): void;
        on(eventName: 'keydown', handler: (e: Event) => void): void;
        on(eventName: 'nodeChange', handler: (e: NodeChangeEvent) => void): void;
        getDoc: any;

        focus(skipDomFocus?: boolean): void;

        execCommand(command: string, showUI?: boolean, value?: any, args?: {skip_focus?: boolean}): void;
		addCommand(command: string, handler: (ui, v) => void): void;
        addButton<T extends ui.WidgetOptions>(
            name: string,
            button: T | (() => T)
        ): void;

        windowManager: WindowManager;
        /** Inserts content at caret position. */
		insertContent(content: string);
		setContent(content: string);

        formatter: Formatter;

        targetElm?: HTMLElement | null;

        selection: Selection;

        theme: Theme;

        settings: InitOptions;

        pasteAsPlainText?: boolean
    }

    interface DomUtils {

    }

    interface Event {
        isDefaultPrevented            : () => boolean;
        isImmediatePropagationStopped : () => boolean;
        isPropagationStopped          : () => boolean;
        lastLevel                     : any;
        level                         : Object;
        preventDefault                : () => void;
        stopImmediatePropagation      : () => void;
        stopPropagation               : () => void;
        target                        : Object;
        type                          : string;
        data                          : any;
        control                       : ui.Control;
    }

    interface NodeChangeEvent extends Event {
        element: HTMLElement;
        parents: HTMLElement[];
    }

    interface PluginManager {
        add(name: string, callback: (editor: Editor, url: string) => void);
        get(name: string): Plugin;
    }

    interface Plugin {}

    interface WindowManager {
        open(options: {}): void;
    }

    interface Formatter {
        /** Applies the specified format to the current selection or specified node. */
        apply(formatName: string, vars?: Object, node?: Node);
        /** Returns true/false if the specified format can be applied to the current selection or not. It will currently only check the state for selector formats, it returns true on all other format types. */
        canApply();
        /** Executes the specified callback when the current selection matches the formats or not. */
        formatChanged();
        /** Returns the format by name or all formats if no name is specified. */
        get(name?: string): Object | any[];
        /** Returns a preview css text for the specified format. */
        getCssText();
        /** Matches the current selection or specified node against the specified format name. */
        match(formatName: string, vars?: Object, node?: Node);
        /** Matches the current selection against the array of formats and returns a new array with matching formats. */
        matchAll();
        /** Return true/false if the specified node has the specified format. */
        matchNode(node: Node, name: string, vars?: Object, similar?: Boolean): Object | null | undefined;
        /** Registers a specific format by name. */
        register(name: string, format: Format);
        /** Removes the specified format from the current selection or specified node. */
        remove(formatName: string, vars?: Object, node?: Node);
        /** Toggles the specified format on/off. */
        toggle(formatName: string, vars?: Object, node?: Node);
        /** Unregister a specific format by name. */
        unregister();
    }

    interface Format {
        selector       ?: string;
        styles         ?: Object;
        deep           ?: boolean;
        remove         ?: string;
        collapsed      ?: boolean;
        classes        ?: string[];
        ceFalseOverride?: boolean;
        inherit        ?: boolean;
        defaultBlock   ?: string;
        inline         ?: string;
        split          ?: boolean;
        exact          ?: boolean;
        links          ?: boolean;
        remove_similar ?: boolean;
        attributes     ?: any;
        block          ?: string;
        wrapper        ?: number;
        mixed          ?: boolean;
        block_expand   ?: boolean;
        expand         ?: boolean;
    }

    interface Selection {
        /** Collapse the selection to start or end of range. */
        collapse();
        /** Returns a bookmark location for the current selection. This bookmark object can then be used to restore the selection after some content modification to the document. */
        getBookmark();
        /** Returns the selected contents using the DOM serializer passed in to this class. */
        getContent(): string;
        /** Returns the end element of a selection range. If the end is in a text node the parent element will be returned. */
        getEnd();
        /** Returns the currently selected element or the common ancestor element for both start and end of the selection. */
        getNode();
        /** Returns the browsers internal range object. */
        getRng(): Range;
        /** Returns the browsers internal selection object. */
        getSel();
        /** Returns the start element of a selection range. If the start is in a text node the parent element will be returned. */
        getStart();
        /** Returns true/false if the selection range is collapsed or not. Collapsed means if it's a caret or a larger selection. */
        isCollapsed(): boolean;
        /** Restores the selection to the specified bookmark. */
        moveToBookmark();
        /** Selects the specified element. This will place the start and end of the selection range around the element. */
        select();
        /** Executes callback when the current selection starts/stops matching the specified selector. The current state will be passed to the callback as it's first argument. */
        selectorChanged: (selector: string, callback: (active: boolean, args: {
            node: Node;
            selector: String;
            parents: Element[];
        }) => void) => any;
        /** Sets the current selection to the specified content. If any contents is selected it will be replaced with the contents passed in to this function. If there is no selection the contents will be inserted where the caret is placed in the editor/page. */
        setContent(content: string, args?: Object);
        /** Move the selection cursor range to the specified node and offset. If there is no node specified it will move it to the first suitable location within the body. */
        setCursorLocation(node: Node, offset: number);
        /** Sets the current selection to the specified DOM element. */
        setNode();
        /** Changes the selection to the specified DOM range. */
        setRng();
    }

    interface Theme {
        panel?: ui.Container;
    }

    interface Query {
        on(eventName: string, handler: (event: Event) => void): void;
        find(cssSelector: string): Query;
    }

    namespace ui {
        interface WidgetOptions {
            type: WidgetType;
            /**  True if the control should be focused when rendered. */
            autofocus?: boolean;
            /**  Text to display inside widget. */
            text?: string;
            /**  Tooltip text to display when hovering. */
            tooltip?: string;
            onclick?: (e: Event) => void;
            onmousedown?: (e: Event) => void;
            onkeydown?: (e: Event) => void;
            onblur?: (e: Event) => void;
        }

        interface Widget {
            type: WidgetType;
            settings: WidgetOptions;
            on(eventName: string, handler: (event: Event) => void): void;
            $el: Query;
        }

        interface ControlOptions extends WidgetOptions {
            type: any;
            /** Border box values example: 1 1 1 1 */
            border?: string;
            /** Space separated list of classes to add. */
            classes?: string;
            /** Is the control disabled by default. */
            disabled?: boolean;
            /** Is the control hidden by default. */
            hidden?: boolean;
            /** Margin box values example: 1 1 1 1 */
            margin?: string;
            /** Minimal height for the control. */
            minHeight?: number;
            /** Minimal width for the control. */
            minWidth?: number;
            /** Name of the control instance. */
            name?: string;
            /** Padding box values example: 1 1 1 1 */
            padding?: string;
            /** WAI-ARIA role to use for control. */
            role?: string;
            /** Style CSS properties to add. */
            style?: string;

            onPostRender?: (e: Event) => void;
        }

        interface Control extends Widget {
            settings: ControlOptions;
            /** Sets/gets the parent container for the control. */
            parent(): Control;
            parent(newParent: Control): void;

            /** Sets/gets the text for the control. */
            text(): string;
            text(newText: string): void;
        }

        class Factory {
            static create(options: WidgetOptions): ControlOptions;
        }

        type WidgetType =
              'selector'           | 'movable'      | 'absolutelayout'
            | 'collection'         | 'resizable'    | 'button'
            | 'reflowqueue'        | 'floatpanel'   | 'buttongroup'
            | 'control'            | 'window'       | 'checkbox'
            | 'factory'            | 'messagebox'   | 'combobox'
            | 'keyboardnavigation' | 'tooltip'      | 'colorbox'
            | 'container'          | 'widget'       | 'panelbutton'
            | 'draghelper'         | 'progress'     | 'colorbutton'
            | 'scrollable'         | 'notification' | 'colorpicker'
            | 'panel'              | 'layout'       | 'path'
            | 'elementpath'        | 'iframe'       | 'radio'
            | 'formitem'           | 'infobox'      | 'resizehandle'
            | 'form'               | 'label'        | 'selectbox'
            | 'fieldset'           | 'toolbar'      | 'slider'
            | 'filepicker'         | 'menubar'      | 'spacer'
            | 'fitlayout'          | 'menubutton'   | 'splitbutton'
            | 'flexlayout'         | 'menuitem'     | 'stacklayout'
            | 'flowlayout'         | 'throbber'     | 'tabpanel'
            | 'formatcontrols'     | 'menu'         | 'textbox'
            | 'gridlayout'         | 'listbox'

        interface ButtonOptions extends ControlOptions {
            type: any;
            /** Icon to use for button. */
            icon?: string;
            /** Image to use for icon. */
            image?: string;
            /** Size of the button small|medium|large. */
            size?: string;
        }

        interface Button extends Control {
            type: any;
            settings: ButtonOptions;
        }

        interface ListBoxOptions extends ButtonOptions {
            type: 'listbox';
            /** Array with values to add to list box. */
            values: { value: string; text: string }[];
            value?: string;
        }

        interface ListBox extends Button {
            type: 'listbox';
            settings: ListBoxOptions;

            /** Get or set ListBox value. */
            value(): string;
            value(newValue: string): void;
        }

        interface ComboboxOptions extends ControlOptions {
            type: 'combobox';
            /**  Placeholder text to display. */
            placeholder?: string;
            /** Array with values to add to combobox. */
            menu: MenuItemOptions[];
        }

        interface Combobox extends Control {
            type: 'combobox';
            settings: ComboboxOptions;
            /** Sets/gets the value of the control. */
            value(): string;
            value(newValue: string): void;
        }

        interface MenuItemOptions extends ControlOptions {
            type: 'menuitem';
            /** Submenu array with items. */
            menu?: MenuItemOptions[];
            /** Selectable menu. */
            selectable?: boolean;
            /** Shortcut to display for menu item. Example: Ctrl+X */
            shortcut?: string;
        }

        interface MenuItem extends Control {
            type: 'menuitem';
            settings: MenuItemOptions;
        }

        interface ColorButtonOptions extends ButtonOptions {
            format: string;
        }

        interface ColorButton extends Button {
            type: 'colorbutton';
            settings: ColorButtonOptions;
            /** Getter/setter for the current color. */
            color(): string;
            color(newColor: string): void;
            /** Resets the current color. */
            resetColor(): void;
        }

        interface ContainerOptions extends ControlOptions {
            /** Default settings to apply to all items. */
            defaults: WidgetOptions;
            /** Is the control disabled by default. */
            disabled: boolean;
            /** Is the control hidden by default. */
            hidden: boolean;
            /** Items to add to container in JSON format or control instances. */
            items: Widget[];
            /** Layout manager by name to use. */
            layout: string;
        }

        interface Container extends Control {
            /** Adds one or many items to the current container. This will create instances of the object representations if needed. */
            add();
            /** Adds items after the current control. */
            after();
            /** Appends new instances to the current container. */
            append();
            /** Sets the specified aria property. */
            aria();
            /** Adds items before the current control. */
            before();
            /** Blurs the current control. */
            blur();
            /** Creates the specified items. If any of the items is plain JSON style objects it will convert these into real tinymce.ui.Control instances. */
            create();
            /** Sets/gets the disabled state on the control. */
            disabled();
            /** Encodes the specified string with HTML entities. It will also translate the string to different languages. */
            encode();
            /** Find child controls by selector. */
            find();
            /** Fires the specified event by name and arguments on the control. This will execute all bound event handlers. */
            fire();
            /** Focuses the current container instance. This will look for the first control in the container and focus that. */
            focus();
            /** Populates the form fields from the specified JSON data object. Control items in the form that matches the data will have it's value set. */
            fromJSON();
            /** Returns the root element to render controls into. */
            getContainerElm();
            /** Returns the control DOM element or sub element. */
            getEl();
            /** Returns a control instance for the current DOM element. */
            getParentCtrl();
            /** Returns true/false if the specified event has any listeners. */
            hasEventListeners();
            /** Sets the visible state to false. */
            hide();
            /** Initializes the current controls layout rect. This will be executed by the layout managers to determine the default minWidth/minHeight etc. */
            initLayoutRect();
            /** Sets the inner HTML of the control element. */
            innerHtml();
            /** Inserts an control at a specific index. */
            insert();
            /** Returns a collection of child items that the container currently have. */
            items(): Collection;
            /** Getter/setter for the current layout rect. */
            layoutRect();
            /** Sets/gets the name for the control. */
            name();
            /** Returns the control next to the current control. */
            next();
            /** Unbinds the specified event and optionally a specific callback. If you omit the name parameter all event handlers will be removed. If you omit the callback all event handles by the specified name will be removed. */
            off();
            /** Binds a callback to the specified event. This event can both be native browser events like "click" or custom ones like PostRender. The callback function will be passed a DOM event like object that enables yout do stop propagation. */
            on();
            /** Sets/gets the parent container for the control. */
            parent();
            /** Returns a control collection with all parent controls. */
            parents();
            /** Returns the current control and it's parents. */
            parentsAndSelf();
            /** Post render method. Called after the control has been rendered to the target. */
            postRender();
            /** Prepends new instances to the current container. */
            prepend();
            /** Returns the control previous to the current control. */
            prev();
            /** Recalculates the positions of the controls in the current container. This is invoked by the reflow method and shouldn't be called directly. */
            recalc();
            /** Reflows the current container and it's children and possible parents. This should be used after you for example append children to the current control so that the layout managers know that they need to reposition everything. */
            reflow();
            /** Removes the current control from DOM and from UI collections. */
            remove();
            /** Renders the control to the specified element. */
            renderBefore();
            /** Renders the control as a HTML string. */
            renderHtml();
            /** Repaints the control after a layout operation. */
            repaint();
            /** Replaces the specified child control with a new control. */
            replace();
            /** Scrolls the current control into view. */
            scrollIntoView();
            /** Sets the visible state to true. */
            show();
            /** Sets/gets the text for the control. */
            text();
            /** Sets/gets the title for the control. */
            title();
            /** Serializes the form into a JSON object by getting all items that has a name and a value. */
            toJSON();
        }

        interface Collection {
            [i: number]: Widget;
            length: number;

            /** Sets/gets the active state on the items in the current collection. */
            active();
            /** Adds new items to the control collection. */
            add();
            /** Adds a class to all items in the collection. */
            addClass();
            /** Sets/gets the disabled state on the items in the current collection. */
            disabled();
            /** Executes the specified callback on each item in collection. */
            each();
            /** Makes the current collection equal to the specified index. */
            eq();
            /** Executes the specific function name with optional arguments an all items in collection if it exists. */
            exec();
            /** Filters the collection item based on the specified selector expression or selector function. */
            filter();
            /** Fires the specified event by name and arguments on the control. This will execute all bound event handlers. */
            fire();
            /** Returns true/false if the class exists or not. */
            hasClass();
            /** Hides the items in the current collection. */
            hide();
            /** Finds the index of the specified control or return -1 if it isn't in the collection. */
            indexOf();
            /** Sets/gets the name contents of the items in the current collection. */
            name();
            /** Unbinds the specified event and optionally a specific callback. If you omit the name parameter all event handlers will be removed. If you omit the callback all event handles by the specified name will be removed. */
            off();
            /** Binds a callback to the specified event. This event can both be native browser events like "click" or custom ones like PostRender. The callback function will have two parameters the first one being the control that received the event the second one will be the event object either the browsers native event object or a custom JS object. */
            on();
            /** Sets/gets the specific property on the items in the collection. The same as executing control.(); */
            prop();
            /** Remove all items from collection and DOM. */
            remove();
            /** Removes the specified class from all items in collection. */
            removeClass();
            /** Returns a new collection of the contents in reverse order. */
            reverse();
            /** Sets/gets the selected state on the items in the current collection. */
            selected();
            /** Sets the contents of the collection. This will remove any existing items and replace them with the ones specified in the input array. */
            set();
            /** Shows the items in the current collection. */
            show();
            /** Slices the items within the collection. */
            slice();
            /** Sets/gets the text contents of the items in the current collection. */
            text();
            /** Returns an JavaScript array object of the contents inside the collection. */
            toArray();
            /** Sets/gets the selected state on the items in the current collection. */
            visible();
        }
    }
}

declare var tinymce: Tinymce.TinyMce;
