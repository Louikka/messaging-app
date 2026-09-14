import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ErrorMessages } from '../error-messages';
import { Router } from '@angular/router';
import { ServiceChats } from '../service-chats';


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
        chatId: new FormControl('', [ Validators.required ]),
    });

    public errlogs = new ErrorMessages();


    public onSubmit()
    {
        if (this.form.controls.chatId.invalid)
        {
            this.errlogs.new('Please, provide valid chat id.');
            return;
        }

        const chatId = this.form.value.chatId;
        if (!chatId)
        {
            this.errlogs.new('Please, provide valid chat id.');
            return;
        }

        this.chats.getChat(chatId).subscribe({ // fix
            next: (v) =>
            {
                console.debug('Redirecting to the chat room...');
                this.router.navigate([ 'chatsRoom', v.id ]);
            },
            error: (err) =>
            {
                console.error(err);
            },
        });
    }
}
