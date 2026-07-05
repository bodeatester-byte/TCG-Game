const express = require('express'); const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const path = require('path'); const fs = require('fs');
app.use(express.static(path.join(__dirname, '/')));
const DB_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
    if (!fs.existsSync(DB_FILE)) { fs.writeFileSync(DB_FILE, JSON.stringify([])); return []; }
    return JSON.parse(fs.readFileSync(DB_FILE));
}
function saveUsers(u) { fs.writeFileSync(DB_FILE, JSON.stringify(u, null, 2)); }

const monstersDB = [
    { id: 1, name: "Pui de Dragon", type: "monster", level: 1, atk: 500, def: 300, family: "dragon" },
    { id: 2, name: "Dragon Tanar", type: "monster", level: 2, atk: 1200, def: 1000, family: "dragon" },
    { id: 3, name: "Dragon Adult", type: "monster", level: 3, atk: 1800, def: 1500, family: "dragon" },
    { id: 4, name: "Dragon Blindat", type: "monster", level: 4, atk: 2400, def: 2000, family: "dragon" },
    { id: 5, name: "Dragon Suprem", type: "monster", level: 5, atk: 3200, def: 2500, family: "dragon" },
    { id: 6, name: "Pui de Golem", type: "monster", level: 1, atk: 400, def: 600, family: "golem" },
    { id: 7, name: "Golem de Piatra", type: "monster", level: 2, atk: 1000, def: 1300, family: "golem" },
    { id: 8, name: "Golem de Fier", type: "monster", level: 3, atk: 1600, def: 1900, family: "golem" },
    { id: 9, name: "Golem Runic", type: "monster", level: 4, atk: 2200, def: 2600, family: "golem" },
    { id: 10, name: "Golem Suprem", type: "monster", level: 5, atk: 3000, def: 3500, family: "golem" },
    { id: 11, name: "Zombi Mutant", type: "monster", level: 1, atk: 450, def: 400, family: "undead" },
    { id: 12, name: "Cavaler Schelet", type: "monster", level: 2, atk: 1150, def: 900, family: "undead" },
    { id: 13, name: "Lich Necromant", type: "monster", level: 3, atk: 1750, def: 1400, family: "undead" }
];
const spellsDB = [
    { id: 10, name: "Firebolt", type: "spell", effect: "burn", power: 500, desc: "Scade 500 ATK" },
    { id: 11, name: "Icebolt", type: "spell", effect: "freeze", power: 400, desc: "Scade 400 ATK" },
    { id: 12, name: "Rock Bash", type: "spell", effect: "buff", power: 600, desc: "Ofera +600 ATK" }
];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }
let matchmakingQueue = []; let activeRooms = {}; let disconnectTimeouts = {};

function trimiteLeaderboard(t = io) {
    let u = loadUsers(); let top = u.map(x => ({ username: x.username, wins: x.wins || 0 })).sort((a, b) => b.wins - a.wins).slice(0, 10);
    t.emit('updateLeaderboard', top);
}
function adaugaVictorie(usr) { if (!usr) return; let u = loadUsers(); let f = u.find(x => x.username.toLowerCase() === usr.toLowerCase()); if (f) { f.wins = (f.wins || 0) + 1; saveUsers(u); trimiteLeaderboard(); } }

function creeazaPachetDinamic(fam) {
    let d = []; let f = monstersDB.filter(m => m.family === fam);
    let l1 = f.find(m => m.level === 1) || f || monstersDB, l2 = f.find(m => m.level === 2) || l1, l3 = f.find(m => m.level === 3) || l2, l4 = f.find(m => m.level === 4) || l3, l5 = f.find(m => m.level === 5) || l4;
    for (let i = 0; i < 5; i++) d.push(JSON.parse(JSON.stringify(l2))); for (let i = 0; i < 4; i++) d.push(JSON.parse(JSON.stringify(l3))); for (let i = 0; i < 3; i++) d.push(JSON.parse(JSON.stringify(l4))); for (let i = 0; i < 2; i++) d.push(JSON.parse(JSON.stringify(l5)));
    for (let i = 0; i < 26; i++) d.push(JSON.parse(JSON.stringify(spellsDB[Math.floor(Math.random() * spellsDB.length)])));
    shuffle(d); return { deck: d, startMonster: JSON.parse(JSON.stringify(l1)) };
}
function pornesteMeciul(p1, p2) {
    let p1D = creeazaPachetDinamic(p1.deck), p2D = creeazaPachetDinamic(p2.deck), p1H = [], p2H = [];
    for (let i = 0; i < 3; i++) { p1H.push(p1D.deck.pop()); p2H.push(p2D.deck.pop()); }
    let rId = `room_${Date.now()}`;
    let s = { roomId: rId, gameStarted: true, activePlayer: 1, p1LP: 8000, p2LP: 8000, p1Username: p1.username, p2Username: p2.username, p1Field: { card: p1D.startMonster }, p2Field: { card: p2D.startMonster }, p1Hand: p1H, p2Hand: p2H, p1Deck: p1D.deck, p2Deck: p2D.deck, p1Graveyard: [], p2Graveyard: [], mustDiscard: false, p1CanMulligan: true, p2CanMulligan: true, hasEvolvedThisTurn: false, hasAttackedThisTurn: false, p1Family: String(p1.deck), p2Family: String(p2.deck) };
    activeRooms[rId] = { gameState: s, p1SocketId: p1.socketId, p2SocketId: p2.socketId, p1User: p1.username, p2User: p2.username };
    io.sockets.sockets.get(p1.socketId)?.join(rId); io.sockets.sockets.get(p2.socketId)?.join(rId);
    io.to(p1.socketId).emit('matchReady', { role: 1, roomId: rId }); io.to(p2.socketId).emit('matchReady', { role: 2, roomId: rId }); io.to(rId).emit('updateGameState', s);
}
app.get('/favicon.ico', (req, res) => res.status(204).end());
io.on('connection', (socket) => {
    trimiteLeaderboard(socket);
    socket.on('registerUser', (data) => {
        let u = loadUsers(); if (u.find(x => x.username.toLowerCase() === data.username.toLowerCase())) { socket.emit('authResponse', { success: false, message: "Existent!" }); return; }
        u.push({ username: data.username, password: data.password, wins: 0 }); saveUsers(u); socket.emit('authResponse', { success: true, message: "Cont creat!" }); trimiteLeaderboard();
    });
    socket.on('loginUser', (data) => {
        let u = loadUsers(); let f = u.find(x => x.username.toLowerCase() === data.username.toLowerCase() && x.password === data.password); if (!f) { socket.emit('authResponse', { success: false, message: "Gresit!" }); return; }
        let rId = null, rle = null; for (let id in activeRooms) { if (activeRooms[id].p1User === f.username) { rId = id; rle = 1; break; } if (activeRooms[id].p2User === f.username) { rId = id; rle = 2; break; } }
        if (rId) { if (disconnectTimeouts[f.username]) { clearTimeout(disconnectTimeouts[f.username]); delete disconnectTimeouts[f.username]; } if (rle === 1) activeRooms[rId].p1SocketId = socket.id; else activeRooms[rId].p2SocketId = socket.id; socket.join(rId); }
        socket.emit('authResponse', { success: true, username: f.username, inGame: !!rId, role: rle, roomId: rId });
    });
    socket.on('checkActiveSession', (user) => {
        let rId = null, rle = null; for (let id in activeRooms) { if (activeRooms[id].p1User === user) { rId = id; rle = 1; break; } if (activeRooms[id].p2User === user) { rId = id; rle = 2; break; } }
        if (rId) { if (disconnectTimeouts[user]) { clearTimeout(disconnectTimeouts[user]); delete disconnectTimeouts[user]; } if (rle === 1) activeRooms[rId].p1SocketId = socket.id; else activeRooms[rId].p2SocketId = socket.id; socket.join(rId); socket.emit('sessionRestored', { username: user, inGame: true, role: rle, roomId: rId }); socket.emit('updateGameState', activeRooms[rId].gameState); }
        else { socket.emit('sessionRestored', { username: user, inGame: false, role: null, roomId: null }); }
    });
    socket.on('playerAction', (data) => { let r = activeRooms[data.roomId]; if (r) { r.gameState = data.state; io.to(data.roomId).emit('updateGameState', r.gameState); } });
    socket.on('sendChatMessage', (data) => { if (data.roomId) io.to(data.roomId).emit('receiveChatMessage', { username: data.username, text: data.text }); });
    socket.on('findGame', (data) => { matchmakingQueue = matchmakingQueue.filter(p => p.username !== data.username); matchmakingQueue.push({ socketId: socket.id, username: data.username, deck: data.deck }); if (matchmakingQueue.length >= 2) pornesteMeciul(matchmakingQueue.shift(), matchmakingQueue.shift()); });
    socket.on('cancelFindGame', (data) => { matchmakingQueue = matchmakingQueue.filter(p => p.username !== data.username); });
    socket.on('playerSurrender', (data) => { let r = activeRooms[data.roomId]; if (r) { io.to(data.roomId).emit('matchOverBySurrender', { abandonedRole: data.role }); adaugaVictorie(data.role === 1 ? r.p2User : r.p1User); delete activeRooms[data.roomId]; } });
    socket.on('matchFinishedNormal', (data) => { let r = activeRooms[data.roomId]; if (r) { io.to(data.roomId).emit('matchOverByPoints', { winnerUsername: data.winnerUsername, reason: data.reason }); adaugaVictorie(data.winnerUsername); delete activeRooms[data.roomId]; } });
    socket.on('disconnect', () => {
        matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);
        for (let id in activeRooms) {
            let r = activeRooms[id]; if (r.p1SocketId === socket.id || r.p2SocketId === socket.id) {
                let ab = r.p1SocketId === socket.id ? 1 : 2; let abU = ab === 1 ? r.p1User : r.p2User; let winU = ab === 1 ? r.p2User : r.p1User; io.to(id).emit('playerDisconnectedWaiting', { username: abU, seconds: 15 });
                disconnectTimeouts[abU] = setTimeout(() => { if (activeRooms[id]) { io.to(id).emit('matchOverBySurrender', { abandonedRole: ab, reason: "timeout_15s" }); adaugaVictorie(winU); delete activeRooms[id]; } delete disconnectTimeouts[abU]; }, 15000); break;
            }
        }
    });
});
const PORT = process.env.PORT || 8080; http.listen(PORT, '0.0.0.0', () => { console.log(`Server activ pe portul ${PORT}`); });
