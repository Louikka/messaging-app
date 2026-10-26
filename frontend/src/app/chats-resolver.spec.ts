import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { chatsResolver } from './chats-resolver';


describe('chatsResolver', () =>
{
    const executeResolver: ResolveFn<boolean> = (...resolverParameters) =>
        TestBed.runInInjectionContext(() => chatsResolver(...resolverParameters));


    beforeEach(() =>
    {
        TestBed.configureTestingModule({});
    });

    it('should be created', () =>
    {
        expect(executeResolver).toBeTruthy();
    });
});
