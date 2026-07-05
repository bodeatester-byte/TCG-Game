const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const path = require('path');
const fs = require('fs');

app.use(express.static(path.join(__dirname, '/')));
const DB_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
    if (!fs.existsSync(DB_FILE)) { fs.writeFileSync(DB_FILE, JSON.stringify([])); return []; }
    return JSON.parse(fs.readFileSync(DB_FILE));
}
function saveUsers(users) { fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2)); }

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
    { id: 12, name: "Rock Bash", type: "spell", effect: "buff", power: 600, desc: "Ofera +600 ATK" },
    { id: 13, name: "Tidal Wave", type: "spell", effect: "buff", power: 400, desc: "Ofera +400 ATK" },
    { id: 14, name: "Light Heal", type: "spell", effect: "heal", power: 1000, desc: "Recupereaza +1000 LP" }
];

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

let matchmakingQueue = []; let activeRooms = {}; let disconnectTimeouts = {};

function trimiteLeaderboard(target = io) {
    let users = loadUsers();
    let top10 = users.map(u => ({ username: u.username, wins: u.wins || 0 })).sort((a, b) => b.wins - a.wins).slice(0, 10);
    target.emit('updateLeaderboard', top10);
}

function adaugaVictorie(username) {
    if (!username) return;
    let users = loadUsers();
    let found = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (found) { found.wins = (found.wins || 0) + 1; saveUsers(users); trimiteLeaderboard(); }
}

function creeazaPachetDinamic(familieAlesa) {
    let deck = []; let f = monstersDB.filter(m => m.family === familieAlesa);
    let lv1 = f.find(m => m.level === 1), lv2 = f.find(m => m.level === 2), lv3 = f.find(m => m.level === 3), lv4 = f.find(m => m.level === 4), lv5 = f.find(m => m.level === 5);
    // Rezervă în caz că nu există spirit/mecha complet în db local
    if (!lv2) lv2 = monstersDB[1]; if (!lv3) lv3 = monstersDB[2]; if (!lv4) lv4 = monstersDB[3]; if (!lv5) lv5 = monstersDB[4]; if (!lv1) lv1 = monstersDB[0];
    for (let i = 0; i < 5; i++) deck.push(JSON.parse(JSON.stringify(lv2)));
    for (let i = 0; i < 4; i++) deck.push(JSON.parse(JSON.stringify(lv3)));
    for (let i = 0; i < 3; i++) deck.push(JSON.parse(JSON.stringify(lv4)));
    for (let i = 0; i < 2; i++) deck.push(JSON.parse(JSON.stringify(lv5)));
    for (let i = 0; i < 26; i++) deck.push(JSON.parse(JSON.stringify(spellsDB[Math.floor(Math.random() * spellsDB.length)])));
    shuffle(deck); return { deck: deck, startMonster: JSON.parse(JSON.stringify(lv1)) };
}
function pornesteMeciul(p1, p2) {
    let p1Data = creeazaPachetDinamic(p1.deck); let p2Data = creeazaPachetDinamic(p2.deck);
    let p1Hand = [], p2Hand = [];
    for (let i = 0; i < 3; i++) { p1Hand.push(p1Data.deck.pop()); p2Hand.push(p2Data.deck.pop()); }
    // =========================================================================
// SERVER.JS - SALVARE FAMILII DECK ÎN REȚEA (MAXIM 50 DE LINII)
// =========================================================================
    let roomId = `room_${Date.now()}`;
    let initState = {
        roomId: roomId, gameStarted: true, activePlayer: 1, p1LP: 8000, p2LP: 8000, p1Username: p1.username, p2Username: p2.username,
        p1Field: { card: p1Data.startMonster }, p2Field: { card: p2Data.startMonster }, p1Hand: p1Hand, p2Hand: p2Hand, p1Deck: p1Data.deck, p2Deck: p2Data.deck,
        p1Graveyard: [], p2Graveyard: [], mustDiscard: false, p1CanMulligan: true, p2CanMulligan: true, hasEvolvedThisTurn: false, hasAttackedThisTurn: false,
        
        // REPARAT: Salvăm familiile pachetelor alese în obiectul global transmis prin rețea
        p1Family: p1.deck,
        p2Family: p2.deck
    };

    activeRooms[roomId] = { gameState: initState, p1SocketId: p1.socketId, p2SocketId: p2.socketId, p1User: p1.username, p2User: p2.username };
    io.sockets.sockets.get(p1.socketId)?.join(roomId); io.sockets.sockets.get(p2.socketId)?.join(roomId);
    io.to(p1.socketId).emit('matchReady', { role: 1, roomId: roomId }); io.to(p2.socketId).emit('matchReady', { role: 2, roomId: roomId });
    io.to(roomId).emit('updateGameState', initState);
}

io.on('connection', (socket) => {
    // ==========================================
    // REPARAT: COPIAZĂ ACEST BLOC ÎN LOCUL CELUI VECHI
    // ==========================================
    trimiteLeaderboard(socket);
    socket.on('registerUser', (data) => { 
        let u = loadUsers(); 
        
        if (u.find(x => x.username.toLowerCase() === data.username.toLowerCase())) { 
            socket.emit('authResponse', { success: false, message: "Existent!" }); 
            return; 
        }
        
        u.push({ username: data.username, password: data.password, wins: 0 }); 
        saveUsers(u); 
        socket.emit('authResponse', { success: true, message: "Cont creat!" });
        
        // REPARAT: Trimite noul cont în tabelul Top 10 pentru toată lumea de pe internet pe loc!
        trimiteLeaderboard(); 
    });

    socket.on('loginUser', (data) => {
        let u = loadUsers(); let f = u.find(x => x.username.toLowerCase() === data.username.toLowerCase() && x.password === data.password);
        if (!f) { socket.emit('authResponse', { success: false, message: "Gresit!" }); return; }
        let gRoomId = null; let rle = null;
        for (let rId in activeRooms) {
            if (activeRooms[rId].p1User === f.username) { gRoomId = rId; rle = 1; break; }
            if (activeRooms[rId].p2User === f.username) { gRoomId = rId; rle = 2; break; }
        }
        if (gRoomId) {
            if (disconnectTimeouts[f.username]) { clearTimeout(disconnectTimeouts[f.username]); delete disconnectTimeouts[f.username]; }
            if (rle === 1) activeRooms[gRoomId].p1SocketId = socket.id; else activeRooms[gRoomId].p2SocketId = socket.id;
            socket.join(gRoomId);
        }
        socket.emit('authResponse', { success: true, username: f.username, inGame: !!gRoomId, role: rle, roomId: gRoomId });
    });

    socket.on('checkActiveSession', (username) => {
        let gRoomId = null; let rle = null;
        for (let rId in activeRooms) {
            if (activeRooms[rId].p1User === username) { gRoomId = rId; rle = 1; break; }
            if (activeRooms[rId].p2User === username) { gRoomId = rId; rle = 2; break; }
        }
        if (gRoomId) {
            if (disconnectTimeouts[username]) { clearTimeout(disconnectTimeouts[username]); delete disconnectTimeouts[username]; }
            if (rle === 1) activeRooms[gRoomId].p1SocketId = socket.id; else activeRooms[gRoomId].p2SocketId = socket.id;
            socket.join(gRoomId); socket.emit('sessionRestored', { username: username, inGame: true, role: rle, roomId: gRoomId });
            socket.emit('updateGameState', activeRooms[gRoomId].gameState);
        } else { socket.emit('sessionRestored', { username: username, inGame: false, role: null, roomId: null }); }
    });

    socket.on('playerAction', (data) => { let r = activeRooms[data.roomId]; if (r) { r.gameState = data.state; io.to(data.roomId).emit('updateGameState', r.gameState); } });
    socket.on('sendChatMessage', (data) => { if (data.roomId) io.to(data.roomId).emit('receiveChatMessage', { username: data.username, text: data.text }); });
    socket.on('findGame', (data) => {
        matchmakingQueue = matchmakingQueue.filter(p => p.username !== data.username);
        matchmakingQueue.push({ socketId: socket.id, username: data.username, deck: data.deck });
        if (matchmakingQueue.length >= 2) { pornesteMeciul(matchmakingQueue.shift(), matchmakingQueue.shift()); }
    });
    socket.on('playerSurrender', (data) => {
        let r = activeRooms[data.roomId]; if (r) { io.to(data.roomId).emit('matchOverBySurrender', { abandonedRole: data.role }); adaugaVictorie(data.role === 1 ? r.p2User : r.p1User); delete activeRooms[data.roomId]; }
    });
    socket.on('matchFinishedNormal', (data) => { let r = activeRooms[data.roomId]; if (r) { io.to(data.roomId).emit('matchOverByPoints', { winnerUsername: data.winnerUsername, reason: data.reason }); adaugaVictorie(data.winnerUsername); delete activeRooms[data.roomId]; } });
    socket.on('disconnect', () => {
        matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);
        for (let id in activeRooms) {
            let r = activeRooms[id]; if (r.p1SocketId === socket.id || r.p2SocketId === socket.id) {
                let ab = r.p1SocketId === socket.id ? 1 : 2; let abU = ab === 1 ? r.p1User : r.p2User; let winU = ab === 1 ? r.p2User : r.p1User;
                io.to(id).emit('playerDisconnectedWaiting', { username: abU, seconds: 15 });
                disconnectTimeouts[abU] = setTimeout(() => {
                    if (activeRooms[id]) { io.to(id).emit('matchOverBySurrender', { abandonedRole: ab, reason: "timeout_15s" }); adaugaVictorie(winU); delete activeRooms[id]; }
                    delete disconnectTimeouts[abU];
                }, 15000); break;
            }
        }
    });
});
const PORT = process.env.PORT || 8080;
http.listen(PORT, '0.0.0.0', () => { console.log(`Server activ pe portul ${PORT}`); });