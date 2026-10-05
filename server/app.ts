import http from 'http';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { expressjwt, type Request as JWTRequest } from 'express-jwt';

import { RedisClient, type DBChatMessage } from './lib/db.ts';
import { verifyPassword, verifyUserRegisterCredentials } from './lib/lib.ts';
import type { POSTChatMessages, POSTLogin, POSTChatCreate } from './types/api.d.ts';


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



/* Express.js routing ********************************************************/

const app = express();

const jwtMiddleware = expressjwt({ secret: JWT_PRIVATE_KEY, algorithms: [ 'HS256' ] });

// middleware to parse req.body as JSON
app.use(express.json());
app.use('/api', jwtMiddleware.unless({ path: [ '/api/register', '/api/login' ] }));
app.use('/api/chat/id/:chatId', async (req, res, next) => // todo
{
    const username = parseUsernameFromJWTPayload(req, res);
    if (username === null)
    {
        return; // todo
    }

    const chatID = parseChatIDFromParams(req, res);
    if (chatID === null)
    {
        return; // todo
    }

    if (!(await db.isUserHasChat(username, chatID)))
    {
        res.sendStatus(403);
    }
});

function parseUsernameFromJWTPayload(req: JWTRequest, res: Response): string | null
{
    const payload = req.auth;
    if (payload === undefined)
    {
        res.status(400).send({ error: 'Cannot get JWT payload.' });
        return null;
    }

    const username = payload['username'];
    if (typeof username !== 'string')
    {
        res.status(400).send({ error: 'JWT payload key "username" not a string.' });
        return null;
    }

    return username;
}

function parseChatIDFromParams(req: Request, res: Response): string | null
{
    const id = req.params['chatId'];
    if (typeof id !== 'string' || id.length === 0)
    {
        res.status(400).send({ error: 'Chat ID required to be a valid value.' });
        return null
    }

    return id;
}



app.get('/', (req, res) =>
{
    res.send('Hello, world!');
});


app.post('/api/register', async (req, res) =>
{
    const { username, password } = req.body as POSTLogin;

    if (!verifyUserRegisterCredentials(username, password))
    {
        res.status(401).send({ error: 'Provided credentials are not valid.' });
        return;
    }

    if (await db.isUserExists(username))
    {
        res.status(409).send({ error: 'Such user already exists.' });
        return;
    }

    await db.addNewUser(username, password);

    res.json({
        token: jwt.sign({ username }, JWT_PRIVATE_KEY),
    });
});


app.post('/api/login', async (req, res) =>
{
    const { username, password } = req.body as POSTLogin;

    const user = await db.getUser(username);
    if (user === null || !verifyPassword(password, user.password, user.salt))
    {
        res.status(401).send({ error: 'User does not exists or credentials are wrong.' });
        return;
    }

    res.json({
        token: jwt.sign({ username }, JWT_PRIVATE_KEY),
    });
});


app.get('/api/user', async (req: JWTRequest, res) =>
{
    const username = parseUsernameFromJWTPayload(req, res);
    if (username === null) return;

    const user = await db.getUserAPI(username);
    if (user === null)
    {
        res.status(401).send({ error: 'User does not exists or credentials are wrong.' });
        return;
    }

    res.json({
        username: user.username,
        active_chats: user.active_chats,
        own_chats: user.own_chats,
    });
});


app.post('/api/chat/create', async (req: JWTRequest, res) =>
{
    const owner = parseUsernameFromJWTPayload(req, res);
    if (owner === null) return;

    const { chatName } = req.body as POSTChatCreate;

    const chatId = await db.addNewChat(chatName, owner);
    if (chatId === null)
    {
        res.status(400).send({ error: 'Unable to create new chat.' });
        return;
    }

    res.json({
        id: chatId,
        name: chatName,
        owner,
    });
});


app.get('/api/chat/id/:chatId', async (req: JWTRequest, res) =>
{
    const chatID = parseChatIDFromParams(req, res);
    if (chatID === null) return;

    const chat = await db.getChat(chatID);
    if (chat === null)
    {
        res.status(404).send({ error: `Chat with ID "${chatID}" was not found.` });
        return;
    }

    res.json({
        ...chat,
    });
});


app.get('/api/chat/id/:chatId/messages', async (req: JWTRequest, res) =>
{
    const chatID = parseChatIDFromParams(req, res);
    if (chatID === null) return;

    const chatMessages = await db.getChatMessages(chatID);
    if (chatMessages === null)
    {
        res.status(404).send({ error: `Chat with ID "${chatID}" was not found.` });
        return;
    }

    res.json(chatMessages);
});

app.post('/api/chat/id/:chatId/messages', async (req: JWTRequest, res) =>
{
    const username = parseUsernameFromJWTPayload(req, res);
    if (username === null) return;

    const chatID = parseChatIDFromParams(req, res);
    if (chatID === null) return;

    const userChatMessage = {
        username,
        text: (req.body as POSTChatMessages).message,
        timestamp: Date.now(),
    } as DBChatMessage;

    // send messages through websocket
    for (const ws of wss.clients)
    {
        if (ws.readyState == ws.OPEN)
        {
            ws.send(JSON.stringify(userChatMessage));
        }
    }

    db.addChatMessage(chatID, userChatMessage);

    res.sendStatus(204);
});



/* HTTP server ***************************************************************/

const server = http.createServer(app);

server.on('upgrade', (request: http.IncomingMessage & { user: string | jwt.JwtPayload }, socket, head) =>
{
    try
    {
        // Extract URL query parameters
        const url = new URL(request.url!, `http://${request.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token)
        {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        // Verify the JWT token
        const decoded = jwt.verify(token, JWT_PRIVATE_KEY);
        request.user = decoded;

        // Complete the WebSocket handshake
        wss.handleUpgrade(request, socket, head, (ws) =>
        {
            wss.emit('connection', ws, request);
        });
    }
    catch (err)
    {
        console.error('Error while upgrading server:', err);
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
    }
});


server.listen(SERVER_PORT, () =>
{
    console.log(`Server up and running on http://localhost:${SERVER_PORT}/`);
});
