import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { ServiceAuth } from './service-auth';




interface ChatMessage extends WebSocketMessage {
    type: 'message';
}
interface ChatError {
    type: 'error';
    message: string;
    timestamp: number;
}

type ChatEntry = ChatMessage | ChatError;


@Injectable()
export class ServiceMessages
{
    constructor()
    {
        debugger;

        // https://angular.dev/guide/components/lifecycle
        // https://angular.dev/guide/di
        // https://angular.dev/guide/di/defining-dependency-providers
    }


    private readonly http = inject(HttpClient);

    private readonly auth = inject(ServiceAuth);

    private ws$: WebSocketSubject<WebSocketMessage> | null = null;
    private chatId: string | null = null;

    public readonly messages$ = new BehaviorSubject<ChatEntry[]>([]);


    public connect(chatId: string)
    {
        const token = this.auth.getToken();
        if (token === null)
        {
            throw new Error('Cannot get JWT token from localStorage.');
        }

        this.chatId = chatId;

        this.ws$ = webSocket(`ws://${window.location.hostname}:8080?token=${token}&chatId=${chatId}`);
        console.debug(`[CHAT:${chatId}] Created new WebSocket.`);

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
                this.messages$.next([
                    ...existingMessages,
                    {
                        type: 'error',
                        message: String(err),
                        timestamp: Date.now(),
                    },
                ]);
            },
            complete: () =>
            {
                console.debug(`[CHAT:${chatId}] WebSocket closed.`);
                this.messages$.next([]);
            }
        });

        this.update();
    }

    public disconnect()
    {
        this.ws$?.complete()
    }

    public update()
    {
        if (this.chatId !== null)
        {
            this.http.get<{
                username: string;
                message: string;
                timestamp: number;
            }[]>(`/api/chat/id/${this.chatId}/messages`).subscribe((messages) =>
            {
                this.messages$.next(messages.map(o => ({
                    type: 'message',
                    ...o,
                })));
            });
        }
    }


    /** Sends message. */
    public send(message: string)
    {
        if (this.chatId === null)
        {
            console.debug('cannot send message from ServiceMessages: chatId is null.');
            return EMPTY;
        }

        return this.http.post(`/api/chat/id/${this.chatId}/messages`, {
            message,
        }, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        });
    }
}
