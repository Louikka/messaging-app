import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatJoinForm } from './chat-join-form';

describe('ChatJoinForm', () => {
  let component: ChatJoinForm;
  let fixture: ComponentFixture<ChatJoinForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatJoinForm]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ChatJoinForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
