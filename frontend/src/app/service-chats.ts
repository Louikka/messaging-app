import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import { POSTChatCreate, POSTChatCreateResponse, GETChatCreateResponse, GETUsetResponse } from '../types/server_api';


interface Chat {
    id: string;
    name: string;
    owner: string | null;
}


@Injectable({
    providedIn: 'root',
})
export class ServiceChats
{
    private readonly http = inject(HttpClient);

    public chats$ = new BehaviorSubject<Chat[]>([]);


    // public isUserInChat(chatID: string): Observable<boolean>
    // {
    //     return this.http.get<GETChatCreateResponse>(`/api/chat/id/${chatID}`).pipe(
    //         map((v) => true),
    //         catchError((err) => of(false)),
    //     );
    // }

    public addNewChat(name: string): Observable<POSTChatCreateResponse>
    {
        const body: POSTChatCreate = {
            chat_name: name,
        };

        return this.http.post<POSTChatCreateResponse>('/api/chat/create', body, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        });
    }

    public getChat(chatID: string): Observable<GETChatCreateResponse>
    {
        return this.http.get<GETChatCreateResponse>(`/api/chat/id/${chatID}`);
    }

    /** Updates {@link chats$}. */
    public updateChats()
    {
        this.http.get<GETUsetResponse>(`/api/user`).subscribe((user) =>
        {
            // todo: merge active and own chats
            this.chats$.next(user.active_chats);
        });
    }
}
