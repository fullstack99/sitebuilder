import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

@Pipe({
	name: 'youtubeSafeUrl'
})
export class YoutubeSafeUrlPipe implements PipeTransform {

	constructor(public sanitizer: DomSanitizer) {
	}

	transform(videoId: string, autoplay: number): SafeResourceUrl {
		return this.sanitizer.bypassSecurityTrustResourceUrl(
			//`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}`);
			`https://www.youtube.com/embed/${videoId}?autoplay=1`);
	}

	// transform(videoId: string, autoplay:number): SafeResourceUrl {
	// 	return this.sanitizer.bypassSecurityTrustResourceUrl(
	// 		`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}`);
	// 		//`https://www.youtube.com/embed/${videoId}?autoplay=1`);
	// }
}
