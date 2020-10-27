import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, ElementRef, Renderer, ViewChild } from '@angular/core';

import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/Subscription';

import { createFeedbackDialogWindow } from '@app-dialogs/feedback-dialog/feedback-dialog.component';

import { TextItemContent } from '@app-models/index';

import { WindowService, DialogWindow } from '@app-common/window/window.service';
import { AlertService, WSService } from '@app/services';
import { AppService } from '@app/app.service';
import { environment } from "@app-environments/environment";

export function createFAQDialogWindow(
  windowService: WindowService
): DialogWindow<FAQDialogComponent> {
return windowService.create<FAQDialogComponent>(
  FAQDialogComponent,
  {
      width: 425,
      height: 600,
      position: {
				left: 'calc(50% - 212px)',
				top: '50px'
			},
      modal: true,
      draggable: false,
      resizable: true,
      scrollable: false,
      visible: false,
      title: false
  }
).changeInputs((comp, window) => {
    comp.close.subscribe(() => window.close());
});
}

@Component({
  selector: 'glogood-faq-dialog',
  templateUrl: './faq-dialog.component.html',
  styleUrls: ['./faq-dialog.component.css']
})
export class FAQDialogComponent implements OnInit {

  @Output() close = new EventEmitter<void>();
  @ViewChild('faqContent') faqContent: ElementRef;

  faq: any = [];
  loading: boolean = false;
  private _viewInited: boolean;
  private _callingAPI: Subscription;
  private _subs: Subscription[] = [];

  constructor(
    private windowService: WindowService,
    private _changeDetector: ChangeDetectorRef,
    private _renderer: Renderer,
    private _alertService: AlertService,
    private _wsService: WSService,
    private _appService: AppService
  ) {

  }

  ngOnInit() {
    this._subs = [
    ];
    this.getThemes();
    this._viewInited = true;
  }


  getThemes() {
    this.refreshView(true);
    this._wsService.getCategories(null, environment.FAQ)
      .pipe()
      .subscribe(
        (res: any) => {
          res.forEach(sc=> {
            this.getThemePages(sc.uid);
          })
        },
        error => {
          this.refreshView(false);
        },
        () => {}
      );
  }

  getThemePages(uid: string) {
    this._wsService.getThemePage(uid, 0, 100, '0', true, true, environment.FAQ)
      .pipe()
      .subscribe(
        (res: any) => {
          if (res && res.data) {
            res.data.forEach(r=> {
              let navItems = r.items.filter(i=>i.itemType == 'TextItem');
              navItems.forEach(ti => {
                let temp = this._appService.createItem(ti);
                this.faq.push(temp.content);

                if (this.faqContent) {
                  let textEle = this.faqContent.nativeElement as HTMLElement;
                  textEle.innerHTML = (temp.content as TextItemContent).text;
                  this._renderer.setElementStyle(textEle, 'padding',  (temp.content as TextItemContent).padding);
                  let a_eles = textEle.getElementsByTagName('a');
                  for(let i=0; i< a_eles.length; i++) {
                      a_eles[i].addEventListener('click',(e) => {
                          if (a_eles[i].getAttribute('data-link')) {
                              e.stopPropagation();
                              // this.onClick(a_eles[i].getAttribute('data-link'))
                          }
                          else if (a_eles[i].getAttribute('href')) {
                              e.stopPropagation();
                              open(a_eles[i].getAttribute('href'), '_blank');
                          }
                      });
                  }
                }

              })
            });
          }
          this.refreshView();
        },
        error => {
          this.refreshView();
        })
  }



  onCancelled() {
		if (!this._callingAPI) return;
		this._callingAPI.unsubscribe();
  }

  openFeedbackDialog() {
    let feedbackWindow = createFeedbackDialogWindow(this.windowService, 'fund.001');
    feedbackWindow.open();
  }

  onClose(event: MouseEvent) {
      this.close.emit();
  }

  refreshView(loading: boolean = false, text: string = 'Loading...') {
    this.loading = loading;
    if (this._viewInited)
      this._changeDetector.detectChanges();
  }

}
