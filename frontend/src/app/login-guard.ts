import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';

import { ServiceAuth } from './service-auth';


export const isLoggedIn: CanMatchFn = () =>
{
    const auth = inject(ServiceAuth);
    return auth.isLoggedIn();
};

// export const loginGuard: CanActivateFn = (route, state) =>
// {
//     const router = inject(Router);
//     const auth = inject(ServiceAuth);

//     if (auth.isLoggedIn())
//     {
//         return true;
//     }

//     console.debug(`Cannot navigate to the ${state.url}: access denied. Redirecting to the /login...`);
//     return new RedirectCommand(router.parseUrl('/login'));
// };
