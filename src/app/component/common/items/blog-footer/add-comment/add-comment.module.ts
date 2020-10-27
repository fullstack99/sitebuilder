import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule , ReactiveFormsModule } from '@angular/forms';
import { AddCommentComponent } from '@app-items/blog-footer/add-comment/add-comment.component';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule
	],
	exports: [AddCommentComponent],
	declarations: [AddCommentComponent],
	entryComponents: [AddCommentComponent]
})
export class AddCommentModule { }
