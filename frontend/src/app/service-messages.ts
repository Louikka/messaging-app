import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { POSTChatMessages } from '../types/server_api';


interface WSMessage {
    username: string;
    text: string;
    timestamp: number;
}

interface ChatMessage extends WSMessage {
    type : 'message';
}
interface ChatError {
    type : 'error';
    text: string;
    timestamp: number;
}

type ChatContent = ChatMessage | ChatError;


@Injectable()
export class ServiceMessages
{
    private readonly http = inject(HttpClient);

    private ws$: WebSocketSubject<WSMessage> | null = null;
    private chatId: string | null = null;

    public readonly messages$ = new BehaviorSubject<ChatContent[]>([]);


    public connect(chatId: string)
    {
        const token = localStorage.getItem('jwttoken');
        if (token === null)
        {
            throw new Error('Cannot get JWT token from localStorage.');
        }

        this.chatId = chatId;

        this.ws$ = webSocket(`ws://${window.location.hostname}:8080?token=${token}&chatId=${chatId}`);
        this.ws$.subscribe({
            next: (val) =>
            {
                const existingMessages = this.messages$.getValue();
                this.messages$.next([
                    ...existingMessages,
                    {
                        type: 'message',
                        ...val,
                    },
                ]);
            },
            error: (err) =>
            {
                const existingMessages = this.messages$.getValue();
                let errMessage: string;

                if (err instanceof Error)
                {
                    errMessage = err.message;
                }
                else
                {
                    errMessage = String(err)
                }

                this.messages$.next([
                    ...existingMessages,
                    {
                        type: 'error',
                        text: errMessage,
                        timestamp: Date.now(),
                    },
                ]);
            },
        });
    }


    /** Sends message. */
    public send(message: string)
    {
        if (this.chatId === null)
        {
            console.debug('cannot send message from ServiceMessages: chatId is null.');
            return EMPTY;
        }

        const body: POSTChatMessages = {
            message,
        };

        return this.http.post(`/api/chat/id/${this.chatId}/messages`, body, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        });
    }
}
