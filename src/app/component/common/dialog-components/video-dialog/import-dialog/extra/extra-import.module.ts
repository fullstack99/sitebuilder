import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { LoadingModule } from '@app-ui/loading/loading.module';

import { VideoDetailComponent } from '@app-dialogs/video-dialog/import-dialog/extra/extra-search/video-detail/video-detail.component';
import { VideoListComponent } from '@app-dialogs/video-dialog/import-dialog/extra/extra-search/video-list/video-list.component';
import { VideoListItemComponent } from '@app-dialogs/video-dialog/import-dialog/extra/extra-search/video-list-item/video-list-item.component';
import { ExtraSearchDialogComponent } from '@app-dialogs/video-dialog/import-dialog/extra/extra-search/extra-search-dialog.component';
import { ExtraImportDialogComponent } from '@app-dialogs/video-dialog/import-dialog/extra/extra-import-dialog.component';
import { ExtraLoginComponent } from '@app-dialogs/video-dialog/import-dialog/extra/extra-account/extra-account-login.component'

import { ExtraAPI } from '@app-dialogs/video-dialog/import-dialog/extra/extra-search/shared/extra-search.service';
import { YouTubeSearchState } from '@app-dialogs/video-dialog/import-dialog/extra/extra-search/shared/extra-search-state.service';
import { YoutubeSafeUrlPipe } from '@app-dialogs/video-dialog/import-dialog/extra/extra-search/shared/youtube-safe-url.pipe';
import { VimeoSafeUrlPipe } from '@app-dialogs/video-dialog/import-dialog/extra/extra-search/shared/vimeo-safe-url.pipe';
import { UserProfileActions } from '@app/stores/reducers/videos/youtube.reducer';
export { ExtraImportDialogComponent } from '@app-dialogs/video-dialog/import-dialog/extra/extra-import-dialog.component';

@NgModule({
	declarations: [
		ExtraImportDialogComponent,
		ExtraSearchDialogComponent,
		VideoDetailComponent,
		VideoListComponent,
		VideoListItemComponent,
		YoutubeSafeUrlPipe,
		VimeoSafeUrlPipe,
		ExtraLoginComponent],

	exports: [ExtraImportDialogComponent, ExtraSearchDialogComponent],

	imports: [
		CommonModule,
		ReactiveFormsModule,
		FormsModule,
		LoadingModule],

	entryComponents: [
		ExtraImportDialogComponent,
		ExtraSearchDialogComponent,
		VideoDetailComponent,
		VideoListComponent,
		VideoListItemComponent,
		ExtraLoginComponent],

	providers: [
		ExtraAPI,
		YouTubeSearchState,
		UserProfileActions
	]
})

export class ExtraImportModule { }
