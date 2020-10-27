// import { Directive, Input, Output, ElementRef, SimpleChanges, EventEmitter, OnInit, OnDestroy, OnChanges, HostListener } from '@angular/core';

// @Directive({
// 	selector: '[contenteditableModel]',
// 	host: {
// 		// '(blur)': 'onEdit()'
// 	}
// })

// export class ContenteditableModel implements OnChanges {
// 	@Input('contenteditableModel') model: any;
// 	@Input('multiLine') multiLine: boolean = true;

// 	@Output('contenteditableModelChange') update = new EventEmitter();
// 	@Output('contenteditableModelResize') resize = new EventEmitter();

// 	constructor(private elementRef: ElementRef) {
// 	}

// 	ngOnChanges(changes: SimpleChanges) {
//     console.log(changes);
// 		if (changes['model'].isFirstChange()) {
//       this.refreshView();
//     }
// 	}

// 	onEdit() {
// 		this.update.emit(this.elementRef.nativeElement.innerText);
// 	}

// 	refreshView() {
// 		this.elementRef.nativeElement.innerText = this.model
// 	}

// 	@HostListener('keydown', ['$event'])
//     onKeyDown(event: KeyboardEvent) {
//     // event.stopPropagation();
// 		if (event.keyCode == 13  && !this.multiLine) {
// 			event.preventDefault();
// 		}
// 		else {
// 			this.onEdit();
// 			//this.resize.emit();
// 		}
//   }

//   @HostListener('paste', ['$event'])
//     onPaste(event) {
//       setTimeout(() => {
//         this.onEdit();
//       })
//     }

// 	@HostListener('keyup', ['$event'])
//     onKeyUp(event: KeyboardEvent) {
// 		this.onEdit();
//   }

// }

import { Directive, Input, Output, ElementRef, SimpleChanges, EventEmitter, OnInit, OnDestroy, OnChanges, HostListener } from '@angular/core';

@Directive({
	selector: '[contenteditableModel]',
	host: {
		// '(blur)': 'onEdit()'
	}
})

export class ContenteditableModel implements OnChanges {
	@Input('contenteditableModel') model: any;
  @Input('multiLine') multiLine: boolean = true;

  @Input() forceChange: boolean = false;

	@Output('contenteditableModelChange') update = new EventEmitter();
	@Output('contenteditableModelResize') resize = new EventEmitter();

  private lastViewModel: any;

	constructor(private elementRef: ElementRef) {
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['model'] && changes['model'].isFirstChange() || changes['forceChange']) {
      this.refreshView();
    }
    // if (changes['model'] && changes['model'].isFirstChange()) {
    //   this.refreshView();
    // }
	}

	onEdit() {
    this.lastViewModel = this.elementRef.nativeElement.innerText;
		this.update.emit(this.lastViewModel);
	}

	refreshView() {
		this.elementRef.nativeElement.innerText = this.model
	}

	@HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
    event.stopPropagation();
		if (event.keyCode == 13  && !this.multiLine) {
			event.preventDefault();
		}
		else {
			// this.onEdit();
			//this.resize.emit();
		}
  }

  @HostListener('paste', ['$event'])
    onPaste(event) {
      setTimeout(() => {
        this.onEdit();
      })
    }


	@HostListener('keyup', ['$event'])
    onKeyUp(event: KeyboardEvent) {
		this.onEdit();
  }

  @HostListener('mousedown', ['$event'])
    onMousedown(event: MouseEvent) {
		event.stopPropagation();
  }

  @HostListener('click', ['$event'])
    onClick(event: MouseEvent) {
      event.stopPropagation();
  }

}

