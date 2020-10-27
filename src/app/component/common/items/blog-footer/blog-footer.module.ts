import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialBarModule } from '@app-dialogs/social-bar/social-bar.module';
import { ArrowButtonModule } from '@app-ui/arrow-button/arrow-button.module';
import { AddCommentModule } from '@app-items/blog-footer/add-comment/add-comment.module';
import { CommentSetupModule } from '@app-items/blog-footer/comment-setup/comment-setup.module';
import { BlogFooterComponent } from '@app-items/blog-footer/blog-footer.component';
import { BlogCommentComponent } from '@app-items/blog-footer/blog-comment/blog-comment.component';

@NgModule({
  imports: [
    CommonModule, 
    ArrowButtonModule,
    SocialBarModule,
    CommentSetupModule,
    AddCommentModule
  ],
  exports: [BlogFooterComponent, BlogCommentComponent],
  declarations: [BlogFooterComponent, BlogCommentComponent]
})
export class BlogFooterItemModule { }
