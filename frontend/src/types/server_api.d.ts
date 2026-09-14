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


export interface POSTChatCreate {
    /** Name of the chat. */
    name: string;
}

export interface POSTChatCreateResponse extends GETChatCreateResponse {
    //
}


export interface POSTChatMessages {
    message: string;
}
