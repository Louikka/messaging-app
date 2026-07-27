import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { API } from '../../../api';


@Injectable({
    providedIn: 'root',
})
export class Chats
{
    constructor()
    {
        //
    }


    private readonly http = inject(HttpClient);


    public addNewChat(name: string): Observable<boolean>
    {
        let ok = new Subject<boolean>();

        this.http.post<API.chat.post.res.body>(
            '/api/chat/',
            {
                chat_name: name,
            },
            {
                headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            }
        ).subscribe({
            next: (val) =>
            {
                ok.next(true);
            },
            error: (err) =>
            {
                console.error(err);
                ok.next(false);
            },
            complete: () =>
            {
                ok.next(true);
            },
        });

        return ok.asObservable();
    }

    public getAllChats()
    {
        //
    }

    public getChat(chatId: string)
    {
        //
    }
}
