import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, shareReplay, tap } from 'rxjs';


@Injectable({
    providedIn: 'root',
})
export class ServiceAuth
{
    private readonly http = inject(HttpClient);

    private user$?: Observable<DataUser>;

    public getUser(forceRefresh = false): Observable<DataUser>
    {
        if (forceRefresh || this.user$ === undefined)
        {
            this.user$ = this.http.get<DataUser>('/api/user', {
                headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            }).pipe(
                shareReplay({ bufferSize: 1, refCount: true }),
                catchError((err) =>
                {
                    this.user$ = undefined;
                    throw err;
                }),
            );
        }

        return this.user$;
    }

    /** Returns token if successfull. */
    private authUser(on: 'register' | 'login', username: string, password: string): Observable<string>
    {
        const body = {
            username,
            password,
        };

        return this.http.post<{ token: string }>('/api/' + on,
            {
                username,
                password,
            },
            {
                headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            }
        ).pipe(
            map(o => o.token),
            tap((token) =>
            {
                sessionStorage.setItem('jwttoken', token);
            }),
        );
    }

    public signIn(username: string, password: string): Observable<string>
    {
        return this.authUser('register', username, password);
    }

    public logIn(username: string, password: string): Observable<string>
    {
        return this.authUser('login', username, password);
    }

    public logOut()
    {
        this.user$ = undefined;
        sessionStorage.removeItem('jwttoken');
    }

    public isLoggedIn(): boolean
    {
        return sessionStorage.getItem('jwttoken') !== null;
    }
}
