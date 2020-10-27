import { Component, Input, ElementRef, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';

function tooltipTemplate(content: string, code: string): string {
    return `
        <div class="tooltip-content">
            <div class="flex-container">
                <div class="row tooltip-body">
                    <div class="col-xs-12">
                        ${content}
                    </div>
                </div>
                <div class="row tooltip-footer">
                    <div class="col-xs-12">                        
                      <div class="tooltip-code">
                        ${code}
                      </div>
                    </div>
                </div>
            </div>
        </div>`;
}

@Component({
    selector  : 'warning',
    template  : 
       `<a #anchor href="#">{{text}}</a>
        <div #content style="display: none"><ng-content></ng-content></div>`
})
export class WarningComponent implements AfterViewInit, OnDestroy {
    // Text of the tooltip anchor
    @Input('text') text = '';
    @Input('code') code = '';

    @ViewChild('anchor')  anchor  : ElementRef;
    @ViewChild('content') content : ElementRef;

    public kendoTooltip: kendo.ui.Tooltip;

    constructor() {
    }

    ngAfterViewInit() {
        const template = tooltipTemplate((this.content.nativeElement as HTMLElement).innerHTML, this.code);
        $(this.anchor.nativeElement).on('click', (e) => e.preventDefault());
        $(this.anchor.nativeElement).kendoTooltip({
            content  : kendo.template(template),
            autoHide : false,
            position : 'right',
            width    : 300,            
            show     :
                (e) => {
                    const tooltip: kendo.ui.Tooltip = e.sender;
                    const content: JQuery = (tooltip as any).content;
                    content.parent().css('background-color', 'pink');
                    $('.k-tooltip-button').html('&times;').addClass('close');
                },            
        });
        
        this.kendoTooltip = $(this.anchor.nativeElement).data("kendoTooltip");
    }

    ngOnDestroy() {
        this.kendoTooltip.destroy();
    }
}
