import express from 'express';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { expressjwt, type Request as JWTRequest } from 'express-jwt';

import { RedisClient } from './lib/db.ts';
import { verifyPassword } from './lib/lib.ts';
import type { API, ChatMessage } from './types/api.d.ts';


try
{
    process.loadEnvFile('../.env');
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

wss.on('connection', async (ws) =>
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
    const { username, password } = req.body;

    if (await db.isUserExists(username))
    {
        // user already exists
        res.status(401).end();
        return;
    }

    await db.addNewUser(username, password);

    res.json({
        token: jwt.sign({ username, }, JWT_PRIVATE_KEY),
    } as API.register.post.res.body);
});



app.post('/api/login', async (req, res) =>
{
    const { username, password } = req.body;

    const user = await db.getUser(username);

    if (user === null || !verifyPassword(password, user.password, user.salt))
    {
        // user does not exists or credentials are wrong
        res.status(401).end();
        return;
    }

    res.json({
        token: jwt.sign({ username, }, JWT_PRIVATE_KEY),
    } as API.login.post.res.body);
});



app.get('/api/user', async (req: JWTRequest, res) =>
{
    const reqAuth = req.auth;
    if (reqAuth === undefined)
    {
        console.error('Cannot get JWT token in /api/user GET request.');
        return;
    }

    const user = await db.getUser(reqAuth['username']);
    if (user === null)
    {
        // user does not exists or credentials are wrong
        res.status(401).end();
        return;
    }

    res.json(omitUserSensitiveData(user) as API.user.get.res.body);
});



app.get('/api/chat', async (req: JWTRequest, res) =>
{
    const reqBody = req.body as API.chat.get.req.body;
    if (reqBody === undefined)
    {
        console.error(`Cannot parse request's body (returns "undefined").`);
        // TODO : send response with error?
        return;
    }

    const chat = await db.getChat(reqBody.chat_id);
    if (chat === null)
    {
        res.status(404).end();
        return;
    }

    res.json({
        chat,
    } as API.chat.get.res.body);
});

app.post('/api/chat', async (req: JWTRequest, res) =>
{
    // user request to create new chat

    const reqAuth = req.auth;
    if (reqAuth === undefined)
    {
        console.error('Cannot get JWT token in /api/chat POST request.');
        return;
    }

    const reqBody = req.body as API.chat.post.req.body;
    if (reqBody === undefined)
    {
        console.error(`Cannot parse request's body (returns "undefined").`);
        // TODO : send response with error?
        return;
    }

    await db.addNewChat(reqBody.chat_name, reqAuth['username']);

    res.status(200).end();
});








app.post('/api/messages', async (req: JWTRequest, res) =>
{
    const reqAuth = req.auth;
    if (reqAuth === undefined)
    {
        console.error('Cannot get jwt token in /api/messages POST request.');
        return;
    }

    const reqBody = req.body as API.messages.post.req.body;
    if (reqBody === undefined)
    {
        console.error(`Cannot parse request's body (returns "undefined").`);
        // TODO : send response with error?
        return;
    }

    const userChatMessage = {
        username: reqAuth['username'],
        text: reqBody.message,
        timestamp: Date.now(),
    } as ChatMessage;

    //db.addChatMessage(userChatMessage);


    // sending new message via ws
    // for (const ws of wss.clients)
    // {
    //     if (ws.readyState === ws.OPEN)
    //     {
    //         ws.send(JSON.stringify(userChatMessage));
    //     }
    // }

    res.status(200).end();
});



app.listen(SERVER_PORT, () =>
{
    console.log(`Server up and running on http://localhost:${SERVER_PORT}/`);
});
