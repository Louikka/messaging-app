export interface POSTLogin extends UserCredentials {
    //
}

export interface POSTLoginResponse {
    token: string;
}


export interface GETChatCreateResponse {
    id: string;
    name: string;
    owner: string;
}


export interface GETUsetResponse {
    username: string;
    active_chats: {
        id: string;
        name: string;
        owner: string;
    }[];
    own_chats: {
        id: string;
        name: string;
    }[];
}


export interface POSTChatCreate {
    /** Name of the chat. */
    name: string;
}

export interface POSTChatCreateResponse extends GETChatCreateResponse {
    //
}


export interface GETChatMessagesResponse extends Array<{
    username: string;
    text: string;
    timestamp: number;
}> {}

export interface POSTChatMessages {
    message: string;
}
