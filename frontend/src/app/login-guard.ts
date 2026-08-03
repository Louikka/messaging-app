import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { Auth } from './auth';


export const loginGuard: CanActivateFn = (route, state) =>
{
    const router = inject(Router);
    const auth = inject(Auth);

    if (auth.isLoggedIn())
    {
        return true;
    }

    return new RedirectCommand(router.parseUrl('/login'), {
        skipLocationChange: true,
    });
};
