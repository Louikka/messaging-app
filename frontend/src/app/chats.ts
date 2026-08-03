import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppChat, POSTChatCreate } from '../../../api';


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

    public chatIDs$ = new BehaviorSubject<string[]>([]);


    public addNewChat(name: string)
    {
        const body: POSTChatCreate = {
            name,
        };

        return this.http.post<AppChat>('/api/chat/create', body, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        });
    }

    public getChat(chatId: string)
    {
        return this.http.post<AppChat>(`/api/chat/id/${chatId}`, null);
    }

    public getAllChats()
    {
        //
    }
}
