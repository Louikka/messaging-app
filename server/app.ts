import http from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { expressjwt, type Request as JWTRequest } from 'express-jwt';

import { RedisClient, type DBChatMessage } from './lib/db.ts';
import { verifyPassword, verifyUserRegisterCredentials } from './lib/lib.ts';
import type { POSTChatMessages, POSTLogin, POSTChatCreate, POSTLoginResponse } from './types/api.js';


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

    if (!verifyUserRegisterCredentials(username, password))
    {
        res.statusMessage = 'User credentials are not valid.';
        res.status(500);
        res.end();
        return;
    }

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
    });
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
    });
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
    });
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
    const reqBody = req.body as POSTChatMessages;

    const chatId = req.params['chatId'];
    if (typeof chatId !== 'string' || chatId.length === 0)
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

    // send messages through websocket
    for (const ws of wss.clients)
    {
        if (ws.readyState == ws.OPEN)
        {
            ws.send(JSON.stringify(userChatMessage));
        }
    }

    db.addChatMessage(chatId, userChatMessage);

    res.status(204);
    res.end();
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
