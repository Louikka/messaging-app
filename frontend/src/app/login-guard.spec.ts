import { TestBed } from '@angular/core/testing';
import { CanMatchFn } from '@angular/router';

import { isLoggedIn } from './login-guard';


describe('isLoggedIn', () =>
{
    const executeGuard: CanMatchFn = (...guardParameters) =>
        TestBed.runInInjectionContext(() => isLoggedIn(...guardParameters));

    beforeEach(() =>
    {
        TestBed.configureTestingModule({});
    });


    it('should be created', () =>
    {
        expect(executeGuard).toBeTruthy();
    });
});
