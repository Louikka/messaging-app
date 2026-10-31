import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { ServiceAuth } from './service-auth';


export const chatsResolver: ResolveFn<Observable<any | RedirectCommand>> = (route, state) =>
{
    const router = inject(Router);
    const auth = inject(ServiceAuth);
    const chatId = route.paramMap.get('chatId')!;

    return auth.getUser().pipe(
        map((user) =>
        {
            if (user === null || user.active_chats.find(chat => chat.id === chatId) === undefined)
            {
                console.debug(`Unknown chat "${chatId}".`);
                return new RedirectCommand(router.parseUrl('/'));
            }

            return true;
        }),
    );
};
