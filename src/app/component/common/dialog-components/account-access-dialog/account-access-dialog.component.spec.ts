import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountAccessDialogComponent } from './account-access-dialog.component';

describe('AccountAccessDialogComponent', () => {
  let component: AccountAccessDialogComponent;
  let fixture: ComponentFixture<AccountAccessDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AccountAccessDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountAccessDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
