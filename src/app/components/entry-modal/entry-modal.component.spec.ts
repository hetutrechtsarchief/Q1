import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntryModalComponent } from './entry-modal.component';

describe('EntryModalComponent', () => {
  let component: EntryModalComponent;
  let fixture: ComponentFixture<EntryModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EntryModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
