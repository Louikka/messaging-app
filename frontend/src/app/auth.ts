import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, shareReplay, tap, throwError } from 'rxjs';
import { AppUser, POSTLogin, POSTLoginResponse } from '../../../api';


@Injectable({
    providedIn: 'root',
})
export class Auth
{
    constructor()
    {
        //
    }


    private readonly http = inject(HttpClient);



    private user$?: Observable<AppUser>;

    public getUser(): Observable<AppUser>
    {
        if (this.user$ === undefined)
        {
            this.user$ = this.http.get<AppUser>('/api/user', {
                headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            }).pipe(
                shareReplay({ bufferSize: 1, refCount: true }),
                catchError((err) =>
                {
                    this.user$ = undefined;
                    return throwError(() => err);
                }),
            );
        }

        return this.user$;
    }

    /** Forces refresh of the user data. */
    public forceRefresh(): Observable<AppUser>
    {
        this.user$ = undefined;
        return this.getUser();
    }



    /** Returns token if successfull. */
    private authUser(on: 'register' | 'login', username: string, password: string): Observable<string>
    {
        const body: POSTLogin = {
            username,
            password,
        };

        return this.http.post<POSTLoginResponse>('/api/' + on, body, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        }).pipe(
            map(v => v.token),
            tap((token) =>
            {
                localStorage.setItem('jwttoken', token);
            }),
            catchError((err) =>
            {
                return throwError(() => err);
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
        localStorage.removeItem('jwttoken');
    }

    public isLoggedIn(): boolean
    {
        return localStorage.getItem('jwttoken') !== null;
    }
}
