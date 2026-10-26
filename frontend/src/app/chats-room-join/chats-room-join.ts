import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ErrorMessages } from '../error-messages';
import { Router } from '@angular/router';
import { ServiceChats } from '../service-chats';
import { HttpErrorResponse } from '@angular/common/http';


@Component({
    selector: 'app-chats-room-join',
    imports: [ AsyncPipe, ReactiveFormsModule ],
    templateUrl: './chats-room-join.html',
    styleUrl: './chats-room-join.css',
})
export class ChatsRoomJoin
{
    private readonly router = inject(Router);
    private readonly chats = inject(ServiceChats);

    public form = new FormGroup({
        chatID: new FormControl('', [ Validators.required ]),
    });

    public readonly errlogs = new ErrorMessages();


    public onSubmit()
    {
        if (this.form.controls.chatID.invalid)
        {
            this.errlogs.new('Please, provide valid chat id.');
            return;
        }

        const chatID = this.form.value.chatID;
        if (!chatID)
        {
            this.errlogs.new('Please, provide valid chat id.');
            return;
        }

        this.chats.getChat(chatID).subscribe({
            next: (v) =>
            {
                console.debug('Redirecting to the chat room...');
                this.router.navigate([ 'chatsRoom', v.id ]);

                this.chats.updateChats();
            },
            error: (err) =>
            {
                console.error(err);
                if (err instanceof HttpErrorResponse)
                {
                    this.errlogs.new(err.error.error);
                }
            },
        });
    }
}
