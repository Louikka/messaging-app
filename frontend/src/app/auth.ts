import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { API } from '../../../api';


@Injectable({
    providedIn: 'root',
})
export class Auth
{
    constructor()
    {
        const lsToken = localStorage.getItem('jwttoken');
        if (lsToken !== null)
        {
            console.debug('Found saved JWT token.');
            this.jwtToken = lsToken;

            this.loadUserData();
        }
    }


    private readonly http = inject(HttpClient);

    public jwtToken: string | null = null;
    public userData: {
        username: string;
        active_chats: string[];
        own_chats: string[];
    } | null = null;


    private saveToken(token: string)
    {
        this.jwtToken = token;
        localStorage.setItem('jwttoken', token);
    }

    private loadUserData()
    {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        this.http.get<API.user.get.res.body>(
            '/api/user',
            { headers }
        ).subscribe({
            next: (res) =>
            {
                this.userData = res;
            },
            error: (err) =>
            {
                console.error(err);
            },
            complete: () =>
            {
                //
            },
        });
    }


    public signIn(username: string, password: string): Observable<boolean | null>
    {
        let isOk = new BehaviorSubject<null | boolean>(null);

        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        this.http.post<API.register.post.res.body>(
            '/api/register',
            JSON.stringify({ username, password }),
            { headers }
        ).subscribe({
            next: (res) =>
            {
                this.saveToken(res.token);
                this.loadUserData();
                isOk.next(true);
            },
            error: (err) =>
            {
                console.error(err);
                isOk.next(false);
            },
            complete: () =>
            {
                //
            },
        });

        return isOk.asObservable();
    }


    public logIn(username: string, password: string): Observable<boolean | null>
    {
        let isOk = new BehaviorSubject<null | boolean>(null);

        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        this.http.post<API.login.post.res.body>(
            '/api/login',
            JSON.stringify({ username, password }),
            { headers }
        ).subscribe({
            next: (res) =>
            {
                this.saveToken(res.token);
                this.loadUserData();
                isOk.next(true);
            },
            error: (err) =>
            {
                console.error(err);
                isOk.next(false);
            },
            complete: () =>
            {
                //
            },
        });

        return isOk.asObservable();
    }

    public logOut()
    {
        //
    }

    public isLoggedIn(): boolean
    {
        return this.jwtToken !== null;
    }
}
