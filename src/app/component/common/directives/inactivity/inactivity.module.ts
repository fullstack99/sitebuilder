import { NgModule } from '@angular/core';

import { InactivityDirective } from '@app-directives/inactivity/inactivity.directive';

@NgModule({
  declarations: [
    InactivityDirective
  ],
  exports: [
    InactivityDirective
  ]
})
export class Inactivity {
}
