import { TestBed } from '@angular/core/testing';
import { ServiceAuth } from './service-auth';


describe('ServiceAuth', () =>
{
    let service: ServiceAuth;

    beforeEach(() =>
    {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ServiceAuth);
    });


    it('should be created', () =>
    {
        expect(service).toBeTruthy();
    });

    it('should be initialised correctly', () =>
    {
        expect(service.isLoggedIn()).toBe(false);
    });
});
