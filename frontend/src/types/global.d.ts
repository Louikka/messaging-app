interface UserCredentials {
    username: string;
    password: string;
}


interface APIUserChat {
    /** ID of the chat. */
    id: string;
    /** Chat's name. */
    name: string;
    /** Owner's name. */
    owner: string;
}

interface APIUser {
    username: string;
    chats: Array<APIUserChat>;
}
