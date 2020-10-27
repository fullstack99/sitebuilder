import { Injectable } from "@angular/core";
import { YouTubeInfo } from "@app-dialogs/video-dialog/import-dialog/extra/extra-search/shared/extra-info";


@Injectable()
export class YouTubeSearchState {

	videoList: YouTubeInfo[] = [];
 	activeVideo: YouTubeInfo;

	constructor() {
	}
}
