import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { map } from 'rxjs';

import { ServiceAuth } from './service-auth';


export const loginGuard: CanActivateFn = (route, state) =>
{
    const router = inject(Router);
    const auth = inject(ServiceAuth);

    return auth.isLoggedIn().pipe(
        map((ok) =>
        {
            if (ok)
            {
                return true;
            }
            else
            {
                return new RedirectCommand(router.parseUrl('/login'));
            }
        }),
    );
};
