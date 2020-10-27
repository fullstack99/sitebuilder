import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, ElementRef, HostListener, Input
} from '@angular/core';
import { Validators, FormControl } from '@angular/forms';
import { AuthService } from '@app-auth/services/auth.service';
import { WindowService, DialogWindow } from '@app-common/window/window.service';


/** */
export function createEmailSentDialogWindow(
  windowService: WindowService,
  email: string = ''
): DialogWindow<EmailSentDialogComponent> {
return windowService.create<EmailSentDialogComponent>(
  EmailSentDialogComponent,
  {
      width: 300,
      height: 300,
      modal: true,
      draggable: false,
      resizable: false,
      scrollable: false,
      visible: false,
      title: false
  }
).changeInputs((comp, window) => {
  comp.email = email;
  comp.close.subscribe(() => window.close());
});
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
@Component({
  moduleId: module.id,
  templateUrl: 'email-sent-dialog.component.html',
  styleUrls: ['email-sent-dialog.component.css']
})
export class EmailSentDialogComponent implements OnInit, OnDestroy {
  @Input() email: string = '';
  @Output() close = new EventEmitter<boolean>();

  constructor(
  ) {}

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  openFeedbackDialog() {

  }

  verifyEmail() {
    if (!this.email) return;
    window.open("https://" + this.email, "emailWindow");
    this.close.emit();
  }

  onClose(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.close.emit(false);
  }
}
