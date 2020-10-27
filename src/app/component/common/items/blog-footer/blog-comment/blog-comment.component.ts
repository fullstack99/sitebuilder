import { Component, OnInit, Input, Output, EventEmitter, HostBinding, ElementRef, Renderer, } from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import { createAddCommentWindow } from '@app-items/blog-footer/add-comment/add-comment.component';
import { Box } from '@app-lib/rect/rect';
import { Comment } from '@app/models';
import { WindowService } from '@app-common/window/window.service';

@Component({
	selector: 'app-blog-comment',
	templateUrl: './blog-comment.component.html',
	styleUrls: ['./blog-comment.component.css']
})
export class BlogCommentComponent implements OnInit {
	@Input() comment: Comment = new Comment;	
	@Output() viewChanged = new EventEmitter<void>();	

	showReply: boolean = false;
	replies: Comment[] = [];

	constructor(
		private windowService: WindowService
	) { }

	ngOnInit() {
		this.comment.firstName
		this.comment.lastName
		this.comment.comment
		this.comment.comment
		this.comment.email
		this.comment.date
		this.comment.targetId
		this.comment.type	
	}

	onToggleShowReply() {
		this.showReply = !this.showReply;
		setTimeout(() => {
			this.viewChanged.emit();
		})
	}

	openReply() {
		const commentWin = createAddCommentWindow(this.windowService, 'Add Reply');
		commentWin.componentRef.instance.submit.subscribe(result => {
			this.replies.push(result);
			commentWin.destroy();
		});
		commentWin.componentRef.instance.close.subscribe(result => {
			commentWin.destroy();
		});
		commentWin.open();
	}

}
