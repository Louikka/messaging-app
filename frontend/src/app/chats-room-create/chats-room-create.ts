import { AsyncPipe } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiceChats } from '../service-chats';
import { CustomValidators } from '../../lib/custom-validators';
import { Logger } from '../../lib/logger';


@Component({
    selector: 'app-chats-room-create',
    templateUrl: './chats-room-create.html',
    styleUrl: './chats-room-create.css',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ AsyncPipe, ReactiveFormsModule ],
})
export class ChatsRoomCreate
{
    private readonly router = inject(Router);
    private readonly chats = inject(ServiceChats);


    public form = new FormGroup({
        chatName: new FormControl('', [ Validators.required, CustomValidators.noChar(/\s/i) ]),
    });

    public errlogs = new Logger();

    public onSubmit()
    {
        if (this.form.controls.chatName.invalid)
        {
            this.errlogs.new('Please, provide valid chat name.');
            return;
        }

        this.chats.addNewChat(this.form.value.chatName!).subscribe((chat) =>
        {
            if (chat === null)
            {
                console.warn('err');
                this.errlogs.new('todo error');
            }
            else
            {
                this.errlogs.clear();
                this.router.navigate([ 'c', chat.id ]);
            }
        });
    }
}
