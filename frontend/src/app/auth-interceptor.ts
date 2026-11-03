import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ServiceAuth } from './service-auth';


export const authInterceptor: HttpInterceptorFn = (req, next) =>
{
    const auth = inject(ServiceAuth);

    const token = auth.getToken();
    if (token !== null)
    {
        req = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`),
        });
    }

    return next(req);
};
