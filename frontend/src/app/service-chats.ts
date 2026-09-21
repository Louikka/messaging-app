import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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


    public addNewChat(name: string): Observable<POSTChatCreateResponse>
    {
        const body: POSTChatCreate = {
            name,
        };

        return this.http.post<POSTChatCreateResponse>('/api/chat/create', body, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        });
    }

    public getChat(chatId: string): Observable<GETChatCreateResponse>
    {
        return this.http.get<GETChatCreateResponse>(`/api/chat/id/${chatId}`);
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
