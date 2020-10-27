import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppChatComponent } from '@app-common/chat/chat.component';

@NgModule({
	imports: [
		CommonModule
	],
	declarations: [AppChatComponent],
	exports: [
		AppChatComponent
	],
	entryComponents: [
		AppChatComponent
	]
})
export class AppChatModule { }
