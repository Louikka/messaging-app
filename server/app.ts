import express from 'express';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { expressjwt, type Request as JWTRequest } from 'express-jwt';

import { RedisClient, type DBChatMessage } from './lib/db.ts';
import { verifyPassword } from './lib/lib.ts';
import type { API, AppChat, AppUser, POSTChatCreate, POSTLogin, POSTLoginResponse, UserCredentials } from '../api.d.ts';


try
{
    process.loadEnvFile('./.env');
}
catch (err)
{
    // file does not found
    console.error(err);
}

const SERVER_PORT = +(process.env['SERVER_PORT'] ?? 3000);
const WSS_PORT = +(process.env['WSS_PORT'] ?? 8080);

const JWT_PRIVATE_KEY = process.env['JWT_PRIVATE_KEY'] ?? 'shhhhh';



/* Database ******************************************************************/

const db = new RedisClient();
await db.connect();



/* Initialize WebSocket ******************************************************/

const wss = new WebSocketServer({ port: WSS_PORT });
console.debug(`Created WebSocketServer on port :${WSS_PORT}.`);

wss.on('connection', (ws) =>
{
    console.debug(`WebSocket connection established.`);

    ws.on('error', (err) =>
    {
        console.error('WebSocketServer error : ', err);
    });

    ws.on('message', (data) =>
    {
        console.debug('WebSocketServer received some data...');
    });

    ws.on('close', (code, reason) =>
    {
        console.debug(`WebSocket connection closed (${code}).`);
    });
});



/* Express routing ***********************************************************/

const app = express();

const jwtMiddleware = expressjwt({ secret: JWT_PRIVATE_KEY, algorithms: [ 'HS256' ] });
// const checkReqBody = (req: express.Request, res: express.Response, next: express.NextFunction) =>
// {
//     // ?
//     next();
// };

// middleware to parse req.body as JSON
app.use(express.json());
app.use('/api', jwtMiddleware.unless({ path: [ '/api/register', '/api/login' ] }));



app.get('/', (req, res) =>
{
    res.send(`<p>Hello, world!</p>`);
});


app.post('/api/register', async (req, res) =>
{
    const { username, password } = req.body as POSTLogin;

    if (await db.isUserExists(username))
    {
        res.statusMessage = 'User already exists.';
        res.status(500);
        res.end();
        return;
    }

    await db.addNewUser(username, password);

    res.json({
        token: jwt.sign({ username }, JWT_PRIVATE_KEY),
    } as POSTLoginResponse);
});


app.post('/api/login', async (req, res) =>
{
    const { username, password } = req.body as POSTLogin;

    const user = await db.getUser(username);
    if (user === null || !verifyPassword(password, user.password, user.salt))
    {
        res.statusMessage = 'User does not exists or credentials are wrong.';
        res.status(401);
        res.end();
        return;
    }

    res.json({
        token: jwt.sign({ username }, JWT_PRIVATE_KEY),
    }as POSTLoginResponse);
});


app.get('/api/user', async (req: JWTRequest, res) =>
{
    const jwtPayload = req.auth! ?? console.error('Cannot get JWT payload.');

    const user = await db.getUser(jwtPayload['username']);
    if (user === null)
    {
        res.statusMessage = 'User does not exists or credentials are wrong.';
        res.status(401);
        res.end();
        return;
    }

    res.json({
        username: user.username,
        active_chats: user.active_chats,
        own_chats: user.own_chats,
    } as AppUser);
});


app.post('/api/chat/create', async (req: JWTRequest, res) =>
{
    const jwtPayload = req.auth! ?? console.error('Cannot get JWT payload.');
    const reqBody = req.body as POSTChatCreate;

    const owner = jwtPayload['username'] as string;
    const chatId = await db.addNewChat(reqBody.name, owner);
    if (owner === undefined || chatId === null)
    {
        res.statusMessage = `Unable to create new chat.`;
        res.status(500);
        res.end();
        return;
    }

    res.json({
        id: chatId,
        name: reqBody.name,
        owner,
    } as AppChat);
});


app.get('/api/chat/id/:chatId', async (req: JWTRequest, res) =>
{
    const chatId = req.params['chatId'];
    if (typeof chatId !== 'string')
    {
        res.statusMessage = 'Chat ID required to be a valid value.';
        res.status(400);
        res.end();
        return;
    }

    const chat = await db.getChat(chatId);
    if (chat === null)
    {
        res.statusMessage = `Chat with ID "${chatId}" was not found.`;
        res.status(404);
        res.end();
        return;
    }

    res.json({
        ...chat,
    } as AppChat);
});


app.get('/api/chat/id/:chatId/messages', async (req: JWTRequest, res) =>
{
    const chatId = req.params['chatId'];
    if (typeof chatId !== 'string')
    {
        res.statusMessage = 'Chat ID required to be a valid value.';
        res.status(400);
        res.end();
        return;
    }

    const chatMessages = await db.getChatMessages(chatId);
    if (chatMessages === null)
    {
        res.statusMessage = `Chat with ID "${chatId}" was not found.`;
        res.status(404);
        res.end();
        return;
    }

    res.json(chatMessages);
});

app.post('/api/chat/id/:chatId/messages', async (req: JWTRequest, res) =>
{
    const jwtPayload = req.auth! ?? console.error('Cannot get JWT payload.');
    const reqBody = req.body as API.chat.messages.post.req.body;

    const chatId = req.params['chatId'];
    if (typeof chatId !== 'string')
    {
        res.statusMessage = 'Chat ID required to be a valid value.';
        res.status(400);
        res.end();
        return;
    }

    const userChatMessage = {
        username: jwtPayload['username'],
        text: reqBody.message,
        timestamp: Date.now(),
    } as DBChatMessage;

    db.addChatMessage(chatId, userChatMessage);


    // sending new message via ws
    // for (const ws of wss.clients)
    // {
    //     if (ws.readyState === ws.OPEN)
    //     {
    //         ws.send(JSON.stringify(userChatMessage));
    //     }
    // }

    res.status(204);
    res.end();
});



app.listen(SERVER_PORT, () =>
{
    console.log(`Server up and running on http://localhost:${SERVER_PORT}/`);
});
