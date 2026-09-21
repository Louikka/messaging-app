import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { ServiceMessages } from '../service-messages';
import { ActivatedRoute } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { Subscription } from 'rxjs';


@Component({
    selector: 'app-chats-room-chat',
    imports: [ ReactiveFormsModule, AsyncPipe ],
    templateUrl: './chats-room-chat.html',
    styleUrl: './chats-room-chat.css',
    providers: [ ServiceMessages ],
})
export class ChatsRoomChat
{
    constructor()
    {
        this.activatedRoute.params.subscribe({
            next: (params) =>
            {
                this.messages.disconnect();

                const chatId = params['chatId'];
                if (typeof chatId === 'string' && chatId)
                {
                    this.messages.connect(chatId);
                }
            },
            error: (err) =>
            {
                console.error(err);
            }
        });
    }


    private readonly activatedRoute = inject(ActivatedRoute);
    public readonly messages = inject(ServiceMessages);

    public form = new FormGroup({
        text: new FormControl('', []),
    });


    public onMessageSubmit()
    {
        const m = this.form.value.text?.trim();
        if (!m)
        {
            // undefined or empty message
            return;
        }

        this.messages.send(m).subscribe();

        this.form.controls.text.reset();
    }
}
