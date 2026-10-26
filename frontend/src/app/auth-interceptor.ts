import { HttpInterceptorFn } from '@angular/common/http';


export const authInterceptor: HttpInterceptorFn = (req, next) =>
{
    const token = sessionStorage.getItem('jwttoken');
    if (token !== null)
    {
        req = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`),
        });
    }

    return next(req);
};
