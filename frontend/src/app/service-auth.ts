import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, tap } from 'rxjs';


@Injectable({
    providedIn: 'root',
})
export class ServiceAuth
{
    private readonly http = inject(HttpClient);


    private user$?: Observable<APIUser | null>;

    public getUser(forceRefresh = false): Observable<APIUser | null>
    {
        if (forceRefresh || this.user$ === undefined)
        {
            this.user$ = this.http.get<APIUser>('/api/user', {
                headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            }).pipe(
                shareReplay({ bufferSize: 1, refCount: true }),
                catchError((err) =>
                {
                    console.error(err);
                    return of(null);
                }),
            );
        }

        return this.user$;
    }


    /**
     * Creates POST request.
     */
    private _post(on: 'register' | 'login', username: string, password: string): Observable<string | null>
    {
        interface _Res {
            token: string;
            error?: string;
        }

        return this.http.post<_Res>('/api/' + on, { username, password }, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        }).pipe(
            map(o => o.token),
            tap((token) =>
            {
                sessionStorage.setItem('jwttoken', token);
            }),
            catchError((err) =>
            {
                console.error(err);
                return of(null);
            }),
        );
    }

    /**
     * @returns token on success, `null` on error.
     */
    public signIn(username: string, password: string): Observable<string | null>
    {
        return this._post('register', username, password);
    }

    /**
     * @returns token on success, `null` on error.
     */
    public logIn(username: string, password: string): Observable<string | null>
    {
        return this._post('login', username, password);
    }

    public logOut()
    {
        // todo: send user back to the login page
        this.user$ = undefined;
        sessionStorage.removeItem('jwttoken');
    }

    public isLoggedIn(): boolean
    {
        return sessionStorage.getItem('jwttoken') !== null;
    }
}
