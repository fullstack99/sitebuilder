import { Component, HostBinding, ElementRef, ChangeDetectorRef,
    OnInit, OnChanges, OnDestroy, Input, Output, EventEmitter
  } from '@angular/core';

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
@Component({
    moduleId   : module.id,
    selector   : 'clip-handle',
    templateUrl: './clip-handle.component.html',
    styleUrls: [
        './clip-handle.component.css',
    ]
})

export class ClipHandleComponent implements OnInit, OnDestroy {

    @Input() left: number = 0;
    @Input() top: number = 0;
    @Input() removal: boolean = false;    
    @Output() removeHandler = new EventEmitter<void>();

    @HostBinding('style.left') get styleLeft() {
        return this.left + 'px';
    }
    @HostBinding('style.top') get styleTop() {
        return this.top + 'px';
    }

    @HostBinding('style.cursor') get styleCursor(): string {        
        return 'grab';
    }

    constructor(
        private _changeDetector: ChangeDetectorRef        
    ) { }

    ngOnInit() {        
    }

    onRemove() {        
        this.removeHandler.emit();
    }

    ngOnDestroy() {        
    }     
}
