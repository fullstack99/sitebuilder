import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import * as Rx from 'rxjs/Rx';
import * as lodash from 'lodash';
import { Comment } from '@app/models';
import { WindowService, DialogWindow } from '@app-common/window/window.service';

export function createAddCommentWindow(
    windowService: WindowService,
    placeHolder: string = 'Add Comment',
    editName: boolean = false
): DialogWindow<AddCommentComponent> {
    return windowService.create<AddCommentComponent>(
        AddCommentComponent,
        {
            width: 300,
            position: {
                left: 'calc(50% - 150px)',
                top: 'calc(50% - 163px)'
            },
            modal: true,
            draggable: false,
            resizable: false,
            scrollable: false,
            visible: false,
            title: false
        }
    ).changeInputs((comp, window) => {
        comp.placeHolder = placeHolder;
        comp.editName = editName;
        comp.close.subscribe(() => window.close());
        comp.submit.subscribe(() => window.close());
    });
}

@Component({
	selector: 'add-comment',
	templateUrl: './add-comment.component.html',
	styleUrls: ['./add-comment.component.css']
})
export class AddCommentComponent implements OnInit, OnDestroy {
	@Input() placeHolder: string = 'Add Comment';
    @Input() comment: Comment = new Comment;
    @Input() editName: boolean = false;

	@Output('close') close = new EventEmitter<void>();
	@Output('submit') submit = new EventEmitter<Comment>();	
    
    public form: FormGroup;
    private subs: Rx.Subscription[];
	constructor(
        private changeDetector: ChangeDetectorRef,
        private fb: FormBuilder
	) { 
        
    }

	ngOnInit() {
        if (this.editName) {
            this.form = this.fb.group({               
                firstName: ['',  [Validators.required]],
                lastName: ['', [Validators.required]]               
            });
        }
        else {
            this.form = this.fb.group({
                comment: ['',  [Validators.required]],
                firstName: ['',  [Validators.required]],
                lastName: ['', [Validators.required]],
                email: ['', [Validators.required, Validators.email]]
            });
        }
        
		this.subs = [
            this.form.valueChanges.subscribe(() => {
                this.changeDetector.detectChanges();
            })
        ]
	}

	onChangeComment(event: string) {
        this.comment.comment = event;
        this.changeDetector.detectChanges();
	}

	onSubmit() {
        this.comment.date = new Date;
        this.comment = lodash.merge(this.comment, this.form.value);
		this.submit.emit(this.comment);
    }
    
    onClose() {
        this.close.emit();
    }

    ngOnDestroy() {
        this.subs.forEach(s => s.unsubscribe());        
    }
}
