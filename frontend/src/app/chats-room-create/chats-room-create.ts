import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ErrorMessages } from '../error-messages';
import { ServiceChats } from '../service-chats';
import { CustomValidators } from '../custom-validators';
import { Router } from '@angular/router';


@Component({
    selector: 'app-chats-room-create',
    imports: [ AsyncPipe, ReactiveFormsModule ],
    templateUrl: './chats-room-create.html',
    styleUrl: './chats-room-create.css',
})
export class ChatsRoomCreate
{
    private readonly router = inject(Router);
    private readonly chats = inject(ServiceChats);

    public form = new FormGroup({
        chatName: new FormControl('', [ Validators.required, CustomValidators.noChar(/\s/i) ]),
    });

    public errlogs = new ErrorMessages()


    public onSubmit()
    {
        if (this.form.controls.chatName.invalid)
        {
            this.errlogs.new('Please, provide valid chat name.');
            return;
        }

        this.chats.addNewChat(this.form.value.chatName!).subscribe({
            next: (v) =>
            {
                this.errlogs.clear();
                this.form.controls.chatName.reset();
                this.router.navigate([ 'chatsRoom', v.id ]);

                this.chats.updateChats();
            },
            error: (err) =>
            {
                if (err instanceof HttpErrorResponse && err.statusText)
                {
                    this.errlogs.new(err.statusText);
                }
                else
                {
                    console.debug(err);
                    this.errlogs.new('Unknown error occured.');
                }
            },
        });
    }
}
