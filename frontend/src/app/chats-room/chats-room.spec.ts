import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatsRoom } from './chats-room';


describe('ChatsRoom', () =>
{
    let component: ChatsRoom;
    let fixture: ComponentFixture<ChatsRoom>;

    beforeEach(async () =>
    {
        await TestBed.configureTestingModule({
            imports: [ ChatsRoom ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatsRoom);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });


    it('should create', () =>
    {
        expect(component).toBeTruthy();
    });
});
