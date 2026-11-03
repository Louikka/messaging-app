import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, tap } from 'rxjs';


@Injectable({
    providedIn: 'root',
})
export class ServiceAuth
{
    private readonly http = inject(HttpClient);


    public getToken(): string | null
    {
        return sessionStorage.getItem('jwttoken');
    }

    public setToken(token: string | null)
    {
        if (token === null)
        {
            sessionStorage.removeItem('jwttoken');
        }
        else
        {
            sessionStorage.setItem('jwttoken', token);
        }
    }


    private user$?: Observable<APIUser | null>;

    public getUser(forceRefresh = false): Observable<APIUser | null>
    {
        const url = '/api/user';

        if (forceRefresh || this.user$ === undefined)
        {
            this.user$ = this.http.get<APIUser>(url, {
                headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            }).pipe(
                shareReplay({ bufferSize: 1, refCount: true }),
                catchError(() =>
                {
                    return of(null);
                }),
            );
        }

        return this.user$;
    }


    /**
     * Creates POST request.
     */
    private _post(on: 'register' | 'login', username: string, password: string): Observable<boolean>
    {
        interface _Res {
            token: string;
            error?: string;
        }

        const url = '/api/' + on;
        const body = { username, password };

        return this.http.post<_Res>(url, body, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        }).pipe(
            map((o) =>
            {
                this.setToken(o.token);
                return true;
            }),
            catchError((err) =>
            {
                console.debug(`POST request on "${url}" have failed:`, err);
                return of(false);
            }),
        );
    }

    /**
     * @returns boolean indicating if signing in was successfull.
     */
    public signIn(username: string, password: string): Observable<boolean>
    {
        return this._post('register', username, password);
    }

    /**
     * @returns boolean indicating if logging in was successfull.
     */
    public logIn(username: string, password: string): Observable<boolean>
    {
        return this._post('login', username, password);
    }

    public logOut()
    {
        // todo: send user back to the login page
        this.user$ = undefined;
        this.setToken(null);
    }

    public isLoggedIn(): Observable<boolean>
    {
        return this.getUser().pipe(
            map((v) =>
            {
                return v !== null;
            }),
        );
    }
}
