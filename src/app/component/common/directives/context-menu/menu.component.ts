import { Component, Input, Output, EventEmitter, ElementRef, AfterViewInit,
         OnChanges, SimpleChanges, OnInit, ChangeDetectorRef, HostListener
       } from '@angular/core';

import { Maybe } from '@app-lib/maybe/maybe';
import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';
import { ContextMenu, SimpleMenuItem, MenuItem, InputMenuItem, DoubleMenuItem, SubMenuItem
       } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

@Component({
    moduleId   : module.id,
    selector   : 'menu',
    templateUrl: 'menu.component.html',
    styleUrls  : ['menu.component.css']
})

export class MenuComponent<T> implements OnChanges, OnInit {
    @Input() menu: ContextMenu<T> = [];
    @Input() active_menu: string = '';
    @Input() main: boolean = false;
    @Input() parent_width: number = 0;
    @Input() feedbackCode: string = '';

    @Output() command = new EventEmitter<T>();    
    /** Preview Command will not close the menu. */
    @Output() previewCommand = new EventEmitter<T>();    
    public _activeSubMenuItem: any = Maybe.nothing<SubMenuItem<T>>();    

    constructor(
        private windowService: WindowService,
        private changeDetector: ChangeDetectorRef,
        private elementRef: ElementRef
    ) {}

    ngOnInit() {        
        this.menu.forEach(item => {
            if (item instanceof InputMenuItem) {
                item.control.valueChanges.subscribe(x =>
                    this.previewCommand.emit(item.updateCommand(x)));
            }
        });
    }    

    ngOnChanges(changes: SimpleChanges) {}

    onItemClick(item: MenuItem<T>, index: number, event: MouseEvent) {        
        event.stopPropagation();
        if (item instanceof SimpleMenuItem) {
            this.command.emit(item.command);

        } else if (item instanceof InputMenuItem) {
            this.command.emit(item.submitCommand(item.control.value));

        } else if (item instanceof DoubleMenuItem) {
            this.command.emit(item.commandLeft);
        }
    }

    onRightCommandClick(item: DoubleMenuItem<T>, event: MouseEvent) {
        event.stopPropagation();
        this.command.emit(item.commandRight);
    }

    onInputKeyDown(item: InputMenuItem<T>, index: number, event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.command.emit(item.submitCommand(item.control.value));
        }
    }

    onItemMouseEnter(item: MenuItem<T>, index: number, event: MouseEvent) {        
        this._activeSubMenuItem = Maybe.cast(SubMenuItem, item);
        this.changeDetector.detectChanges();
        if (item.type != 'SubMenuItem') return;
               
        let ele = (this.elementRef.nativeElement as HTMLElement);
        let subEle = (this.elementRef.nativeElement as HTMLElement).getElementsByTagName('menu');
        
        if (subEle.length==0) return;

        if (ele.offsetLeft + ele.offsetWidth + subEle[0].offsetWidth > this.parent_width) {            
            subEle[0].style.left = '-' + subEle[0].offsetWidth + 'px';
        }        
    }

    onItemMouseLeave(item: MenuItem<T>, index: number, event: MouseEvent) {
        this._activeSubMenuItem = Maybe.nothing<SubMenuItem<T>>();
        this.changeDetector.detectChanges();
    }

    onSubMenuCommand(command: T) {
        this.command.emit(command);
    }

    openFeedbackDialog(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
        const feedbackWindow = createFeedbackDialogWindow(this.windowService, this.feedbackCode);
        feedbackWindow.open();
    }
    onClose(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
        this.command.emit();        
    }

    @HostListener('mousedown', ['$event'])
    @HostListener('mouseup'  , ['$event'])
    @HostListener('click'    , ['$event'])
    containEvents(event: MouseEvent) {
        event.stopPropagation();
    }
}
