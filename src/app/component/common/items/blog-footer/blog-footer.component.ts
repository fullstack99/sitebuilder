import { Component, OnInit, Input, Output, EventEmitter, HostBinding, ElementRef, Renderer, ViewChild } from '@angular/core';
import { DomSanitizer, SafeStyle, SafeHtml } from '@angular/platform-browser';
import * as lodash from 'lodash';
import { Box } from '@app-lib/rect/rect';
import { createSocialBarWindow } from '@app-dialogs/social-bar/social-bar.component';
import { createAddCommentWindow } from '@app-items/blog-footer/add-comment/add-comment.component';
import { createCommentSetupWindow } from '@app-items/blog-footer/comment-setup/comment-setup.component';
import { BlogFooterInfo, CommentSetup, Item, CommonItemContent, Link, DefaultRibbons} from '@app/models';
import { AppService } from '@app/app.service';
import { WindowService } from '@app-common/window/window.service';

@Component({
	selector: 'blog-footer-item',
	templateUrl: './blog-footer.component.html',
	styleUrls: ['./blog-footer.component.css']
})
export class BlogFooterComponent implements OnInit {
	@Input() item: Item;
	@Input() editable = false;
	@Input() containerWidth: number = 1100;
			
	@Output('outLink') outLink = new EventEmitter<Link>();
    @Output('itemChange') itemChange = new EventEmitter<Item>();
	@Output('itemResize') itemResize = new EventEmitter<Box>();
	
	@ViewChild('blogFooterContainer') blogFooterContainer: ElementRef;

	info: BlogFooterInfo = new BlogFooterInfo;	
	showComments: boolean = false;
	comments: Comment[] = [];
	time = new Date().getTime();

	constructor(
		private elementRef: ElementRef,
        private renderer: Renderer,
        private sanitizer: DomSanitizer,
		private windowService: WindowService,
		private appService: AppService
	) { }

	ngOnInit() {		
		this.info = (this.item.content as CommonItemContent<BlogFooterInfo>).info.value;		
	}

	onViewChanged() {
		let box = this.item.content.box;
		this.itemResize.emit(box.setBottom(box.top + (this.blogFooterContainer.nativeElement as HTMLElement).offsetHeight));		
	}

	showSocialBar(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		this.info.showSocialbar = !this.info.showSocialbar;		
	}

	onToggleShowComments(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();		
		if (this.editable) {
			this.openCommentSetup();
		}
		else {
			this.showComments = !this.showComments;
			setTimeout(() => {
				this.onViewChanged();
			});
		}		
	}

	openCommentSetup() {		
		let commentSetup = createCommentSetupWindow(this.windowService, this.info.blogComment);
		commentSetup.componentRef.instance.submit.subscribe((result: CommentSetup) => {
			this.info.blogComment = result;
			commentSetup.destroy();			
		});
		commentSetup.componentRef.instance.close.subscribe(() => {
			commentSetup.destroy();
		})
		commentSetup.open();
	}

	openSocialBar(event: MouseEvent) {
		event.stopPropagation();
		event.stopPropagation();
		const socialBarWin = createSocialBarWindow(this.windowService, null, this.info.socialbar);
		socialBarWin.componentRef.instance.submit.subscribe(result => {
			this.info.socialbar = result;
			socialBarWin.destroy();
		});
		socialBarWin.componentRef.instance.close.subscribe(() => {
			socialBarWin.destroy();
		});
		socialBarWin.open();
	}

	openAddComment(event: MouseEvent, editName: boolean = false) {
		event.preventDefault();
		event.stopPropagation();
		const commentWin = createAddCommentWindow(this.windowService, 'Add Comment', editName);
		commentWin.componentRef.instance.submit.subscribe(result => {
			if (editName) {
				this.info.userName = result.firstName + ' ' + result.lastName;
			}
			else {
				this.comments.push(result);
			}			
			commentWin.destroy();
			setTimeout(() => {
				this.onViewChanged();
			});
		});
		commentWin.componentRef.instance.close.subscribe(result => {
			commentWin.destroy();
		});
		commentWin.open();
	}

	backgroundRibbon(index: number): SafeStyle {
		let url: string;		
        if (this.info.socialbar.type == 'color')
            url = DefaultRibbons[index].color;
        else
            url = DefaultRibbons[index].gray;
        return this.sanitizer.bypassSecurityTrustStyle(`url('${url}')`);
    }

}
