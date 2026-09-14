import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { POSTChatCreate, POSTChatCreateResponse, GETChatCreateResponse } from '../types/server_api';


@Injectable({
    providedIn: 'root',
})
export class ServiceChats
{
    private readonly http = inject(HttpClient);

    //public chatIDs$ = new BehaviorSubject<string[]>([]);


    public addNewChat(name: string)
    {
        const body: POSTChatCreate = {
            name,
        };

        return this.http.post<POSTChatCreateResponse>('/api/chat/create', body, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        });
    }

    public getChat(chatId: string)
    {
        return this.http.get<GETChatCreateResponse>(`/api/chat/id/${chatId}`);
    }

    public getAllChats()
    {
        //
    }
}
