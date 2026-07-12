const express = require('express'); const app = express();
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
function saveUsers(u) { fs.writeFileSync(DB_FILE, JSON.stringify(u, null, 2)); }

const monstersDB = [
    { id: 1, name: "Pui de Dragon", type: "monster", level: 1, atk: 500, def: 0, family: "dragon" },
    { id: 2, name: "Dragon Tanar", type: "monster", level: 2, atk: 1200, def: 0, family: "dragon" },
    { id: 3, name: "Dragon Adult", type: "monster", level: 3, atk: 1800, def: 0, family: "dragon" },
    { id: 4, name: "Dragon Blindat", type: "monster", level: 4, atk: 2400, def: 0, family: "dragon" },
    { id: 5, name: "Dragon Suprem", type: "monster", level: 5, atk: 3200, def: 0, family: "dragon" },

    { id: 6, name: "Pui de Golem", type: "monster", level: 1, atk: 400, def: 0, family: "golem" },
    { id: 7, name: "Golem de Piatra", type: "monster", level: 2, atk: 1000, def: 0, family: "golem" },
    { id: 8, name: "Golem de Fier", type: "monster", level: 3, atk: 1600, def: 0, family: "golem" },
    { id: 9, name: "Golem Runic", type: "monster", level: 4, atk: 2200, def: 0, family: "golem" },
    { id: 10, name: "Golem Suprem", type: "monster", level: 5, atk: 3000, def: 0, family: "golem" },

    { id: 101, name: "Zombi Mutant", type: "monster", level: 1, atk: 450, hp: 600, desc: "Un zombie periculos", family: "undead" },
    { id: 102, name: "Cavaler Schelet", type: "monster", level: 2, atk: 1150, hp: 1200, desc: "Cavaler nemort", family: "undead" },
    { id: 103, name: "Fantoma Regala", type: "monster", level: 3, atk: 1750, hp: 1500, desc: "Spiritul unui fost rege", family: "undead" },
    { id: 104, name: "Lich Necromant", type: "monster", level: 4, atk: 1750, hp: 1800, desc: "Maestru al magiei negre", family: "undead" },
    { id: 105, name: "Regele Umbrelor", type: "monster", level: 5, atk: 2500, hp: 2500, desc: "Conducatorul intunericului", family: "undead" },

    // Familia SPIRIT
    { id: 106, name: "Spirit de apa", type: "monster", level: 1, atk: 1200, hp: 1400, desc: "Spirit elementar de apa", family: "spirit" },
    { id: 107, name: "Spirit de foc", type: "monster", level: 2, atk: 1600, hp: 1100, desc: "Spirit elementar de foc", family: "spirit" },
    { id: 108, name: "Spirit de Vant", type: "monster", level: 3, atk: 1400, hp: 1300, desc: "Spirit elementar de vant", family: "spirit" },
    { id: 109, name: "SPirit de Natura", type: "monster", level: 4, atk: 1100, hp: 1700, desc: "Spirit elementar de natura", family: "spirit" },
    { id: 110, name: "Avatar Astral", type: "monster", level: 5, atk: 3000, hp: 2800, desc: "Entitate ancestrala", family: "spirit" },

    // Familia MECHA (Corectat din "spirit" in "mecha" + adaugat HP diferit)
    { id: 111, name: "Mini robot v1", type: "monster", level: 1, atk: 500, hp: 500, desc: "Prototip de robot mic", family: "mecha" },
    { id: 112, name: "Meca Distrugator", type: "monster", level: 2, atk: 1500, hp: 1600, desc: "Masinarie de razboi", family: "mecha" },
    { id: 113, name: "Tanc Autonom", type: "monster", level: 3, atk: 1800, hp: 2200, desc: "Blindat greu automatizat", family: "mecha" },
    { id: 114, name: "Cyborg de lupta", type: "monster", level: 4, atk: 2000, hp: 1900, desc: "Jumatate om, jumatate masina", family: "mecha" },
    { id: 115, name: "Titanul Atomic", type: "monster", level: 5, atk: 3200, hp: 3000, desc: "Forta nucleara imensa", family: "mecha" }
];

const spellsDB = [
    { id: 25, name: "Firebolt", type: "spell", effect: "burn", power: 500, desc: "Scade 500 ATK" },
    { id: 26, name: "Icebolt", type: "spell", effect: "freeze", power: 400, desc: "Scade 400 ATK" },
    { id: 12, name: "Rock Bash", type: "spell", effect: "buff", power: 600, desc: "Ofera +600 ATK" },
    { id: 13, name: "Tidal Wave", type: "spell", effect: "burn", power: 700, desc: "Scade 700 ATK" },
    { id: 14, name: "Light Heal", type: "spell", effect: "heal", power: 500, desc: "Ofera +500 HP" },
    { id: 15, name: "Dark Curse", type: "spell", effect: "halve", power: 0, desc: "Injumatateste ATK inamic" },
    { id: 16, name: "Double Strike", type: "spell", effect: "double", power: 0, desc: "Dubleaza atacul curent" }

];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }
let matchmakingQueue = []; let activeRooms = {}; let disconnectTimeouts = {};

function trimiteLeaderboard(t = io) {
    let u = loadUsers(); 
    
    // REPARAT: Am adăugat "coins: x.coins || 0" în map-ul trimis către frontend
    let top = u.map(x => ({ 
        username: x.username, 
        wins: x.wins || 0,
        coins: x.coins || 0 
    })).sort((a, b) => b.wins - a.wins).slice(0, 10);
    
    t.emit('updateLeaderboard', top);

    // Dacă apelul este pentru un socket specific, îi trimitem și monedele lui actuale
    if (t.id && t.username) {
        let f = u.find(x => x.username.toLowerCase() === t.username.toLowerCase());
        if (f) t.emit('updateYourCoins', f.coins || 0);
    }
}

// REPARAT: Forțăm reîncărcarea corectă a bazei de date înainte de a trimite leaderboard-ul
function adaugaVictorie(usr) { 
    if (!usr) return; 
    let u = loadUsers(); 
    let f = u.find(x => x.username.toLowerCase() === usr.toLowerCase()); 
    if (f) { 
        f.wins = (f.wins || 0) + 1; 
        f.coins = (f.coins || 0) + 1; // Oferă 1 monedă
        
        // 1. Salvăm noile valori în fișierul users.json
        saveUsers(u); 
        
        // 2. IMPORTANT: Trimitem noul leaderboard citind fișierul proaspăt salvat
        trimiteLeaderboard(); 
        
        // 3. Trimite actualizarea instantanee și pentru meniul lateral (Hamburger)
        io.sockets.sockets.forEach((s) => {
            if (s.username && s.username.toLowerCase() === usr.toLowerCase()) {
                s.emit('updateYourCoins', f.coins);
            }
        });
    } 
}

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
        // 1. Validare date primite
        if (!data || !data.username || !data.password) {
            socket.emit('authResponse', { success: false, message: "Date incomplete!" });
            return;
        }

        let u = loadUsers(); 
        
        // 2. Verificare dacă utilizatorul există deja (case-insensitive)
        let userExists = u.find(x => x.username.toLowerCase() === data.username.toLowerCase());
        if (userExists) { 
            socket.emit('authResponse', { success: false, message: "Existent!" }); 
            return; 
        }
        
        // 3. Creare structură completă și curată pentru noul cont
        const newUser = { 
            username: data.username.trim(), 
            password: data.password, 
            wins: 0,
            losses: 0, // Inițializări folositoare pentru joc
            
        };
        
        // 4. Salvare în fișierul users.json
        u.push(newUser); 
        saveUsers(u); 
        
        // 5. Răspuns către client și actualizare leaderboard globală (folosind io)
        socket.emit('authResponse', { success: true, message: "Cont creat!" }); 
        
        // REPARAT: Trimitem leaderboard-ul actualizat către toată lumea din joc
        if (typeof trimiteLeaderboard === 'function') {
            trimiteLeaderboard(io); // Schimbat din trimiteLeaderboard() simplu pentru a nu bloca serverul
        }
    });
    socket.on('requestCoinsOnRefresh', (username) => {
        if (!username) return;
        
        let u = loadUsers();
        let f = u.find(x => x.username.toLowerCase() === username.toLowerCase());
        if (f) {
            socket.username = f.username; // Ne asigurăm că serverul îi reține numele pe socket
            socket.emit('updateYourCoins', f.coins || 0);
        }
    });

    socket.on('loginUser', (data) => {
        if (!data || !data.username || !data.password) {
            socket.emit('authResponse', { success: false, message: "Date incomplete!" });
            return;
        }
        let u = loadUsers(); 
        let f = u.find(x => x.username.toLowerCase() === data.username.toLowerCase() && x.password === data.password); 
        if (!f) { socket.emit('authResponse', { success: false, message: "Gresit!" }); return; }
        
        // REPARAT 1: Salvăm numele pe instanța socket pentru ca serverul să te recunoască în timpul jocului
        socket.username = f.username;

        let rId = null, rle = null; 
        for (let id in activeRooms) { 
            if (activeRooms[id].p1User === f.username) { rId = id; rle = 1; break; } 
            if (activeRooms[id].p2User === f.username) { rId = id; rle = 2; break; } 
        }
        if (rId) { 
            if (disconnectTimeouts[f.username]) { clearTimeout(disconnectTimeouts[f.username]); delete disconnectTimeouts[f.username]; } 
            if (rle === 1) activeRooms[rId].p1SocketId = socket.id; else activeRooms[rId].p2SocketId = socket.id; 
            socket.join(rId); 
        }
        
        // REPARAT 2: Trimitem proprietatea 'coins' salvându-i starea (implicit 0 dacă nu are în users.json)
        socket.emit('authResponse', { 
            success: true, 
            username: f.username, 
            inGame: !!rId, 
            role: rle, 
            roomId: rId,
            coins: f.coins || 0 
        });

        // Trimitem și evenimentul dedicat pentru actualizare instantanee
        socket.emit('updateYourCoins', f.coins || 0);
    });


    socket.on('checkActiveSession', (user) => {
        if (!user) return;
        let rId = null, rle = null; 
        for (let id in activeRooms) { 
            if (activeRooms[id].p1User === user) { rId = id; rle = 1; break; } 
            if (activeRooms[id].p2User === user) { rId = id; rle = 2; break; } 
        }
        if (rId) { 
            if (disconnectTimeouts[user]) { clearTimeout(disconnectTimeouts[user]); delete disconnectTimeouts[user]; } 
            if (rle === 1) activeRooms[rId].p1SocketId = socket.id; else activeRooms[rId].p2SocketId = socket.id; 
            socket.join(rId); 
            socket.emit('sessionRestored', { username: user, inGame: true, role: rle, roomId: rId }); 
            socket.emit('updateGameState', activeRooms[rId].gameState); 
        } else { 
            socket.emit('sessionRestored', { username: user, inGame: false, role: null, roomId: null }); 
        }
    });

    socket.on('playerAction', (data) => { 
        if (!data || !data.roomId) return;
        let r = activeRooms[data.roomId]; 
        if (r) { r.gameState = data.state; io.to(data.roomId).emit('updateGameState', r.gameState); } 
    });

    socket.on('sendChatMessage', (data) => { 
        if (data && data.roomId) io.to(data.roomId).emit('receiveChatMessage', { username: data.username, text: data.text }); 
    });

    socket.on('findGame', (data) => { 
        if (!data || !data.username) return;
        matchmakingQueue = matchmakingQueue.filter(p => p.username !== data.username); 
        matchmakingQueue.push({ socketId: socket.id, username: data.username, deck: data.deck }); 
        if (matchmakingQueue.length >= 2) pornesteMeciul(matchmakingQueue.shift(), matchmakingQueue.shift()); 
    });

    socket.on('cancelFindGame', (data) => { 
        if (data && data.username) matchmakingQueue = matchmakingQueue.filter(p => p.username !== data.username); 
    });

    socket.on('playerSurrender', (data) => { 
        if (!data || !data.roomId) return;
        let r = activeRooms[data.roomId]; 
        if (r) { 
            io.to(data.roomId).emit('matchOverBySurrender', { abandonedRole: data.role }); 
            if (typeof adaugaVictorie === 'function') adaugaVictorie(data.role === 1 ? r.p2User : r.p1User); 
            delete activeRooms[data.roomId]; 
        } 
    });

    socket.on('matchFinishedNormal', (data) => { 
        if (!data || !data.roomId) return;
        let r = activeRooms[data.roomId]; 
        if (r) { 
            io.to(data.roomId).emit('matchOverByPoints', { winnerUsername: data.winnerUsername, reason: data.reason }); 
            if (typeof adaugaVictorie === 'function') adaugaVictorie(data.winnerUsername); 
            delete activeRooms[data.roomId]; 
        } 
    });

    socket.on('disconnect', () => {
        matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);
        for (let id in activeRooms) {
            let r = activeRooms[id]; 
            if (r.p1SocketId === socket.id || r.p2SocketId === socket.id) {
                let ab = r.p1SocketId === socket.id ? 1 : 2; 
                let abU = ab === 1 ? r.p1User : r.p2User; 
                let winU = ab === 1 ? r.p2User : r.p1User; 
                io.to(id).emit('playerDisconnectedWaiting', { username: abU, seconds: 15 });
                
                disconnectTimeouts[abU] = setTimeout(() => { 
                    if (activeRooms[id]) { 
                        io.to(id).emit('matchOverBySurrender', { abandonedRole: ab, reason: "timeout_15s" }); 
                        if (typeof adaugaVictorie === 'function') adaugaVictorie(winU); 
                        delete activeRooms[id]; 
                    } 
                    delete disconnectTimeouts[abU]; 
                }, 15000); 
                break;
            }
        }
    });
});


io.on('connection', (socket) => {
    trimiteLeaderboard(socket);
            socket.on('buyPackRequest', (data) => {
        if (!socket.username) {
            socket.emit('shopResponse', { success: false, message: "Trebuie sa fii logat pentru a cumpara!" });
            return;
        }

        const { packName } = data;
        
        // REPARAT: Am schimbat din 'spirite' în 'spirit' ca să corespundă cu restul codului tău
        const packPrices = {
            'dragon': 100,
            'golem': 200,
            'undead': 300,
            'spirit': 400, // Corectat la singular
            'mecha': 500
        };

        const price = parseInt(packPrices[packName.toLowerCase()], 10);
        if (!price || isNaN(price)) {
            socket.emit('shopResponse', { success: false, message: "Pachet invalid!" });
            return;
        }

        let u = loadUsers();
        let f = u.find(x => x.username.toLowerCase() === socket.username.toLowerCase());

        if (!f) {
            socket.emit('shopResponse', { success: false, message: "Utilizator negasit!" });
            return;
        }

        let currentCoins = parseInt(f.coins || 0, 10);
        if (currentCoins < price) {
            socket.emit('shopResponse', { success: false, message: `Nu ai suficiente monede! Costă ${price} monede.` });
            return;
        }

        if (!f.unlockedPacks) f.unlockedPacks = []; 
        if (f.unlockedPacks.includes(packName.toLowerCase())) {
            socket.emit('shopResponse', { success: false, message: "Detii deja acest pachet!" });
            return;
        }

        f.coins = currentCoins - price;
        f.unlockedPacks.push(packName.toLowerCase());
        
        saveUsers(u);

        // REPARAT: În mesaj va apărea SPIRIT în loc de SPIRITE, eliminând orice eroare de sincronizare
        socket.emit('shopResponse', { success: true, message: `Ai cumparat cu succes pachetul ${packName.toUpperCase()}!` });
        socket.emit('updateYourCoins', f.coins);
        socket.emit('updateUnlockedPacks', f.unlockedPacks);
        trimiteLeaderboard();
    });



    // Trimitem pachetele deblocate și când utilizatorul se loghează sau dă refresh
    socket.on('requestCoinsOnRefresh', (username) => {
        if (!username) return;
        let u = loadUsers();
        let f = u.find(x => x.username.toLowerCase() === username.toLowerCase());
        if (f) {
            socket.username = f.username;
            socket.emit('updateYourCoins', f.coins || 0);
            socket.emit('updateUnlockedPacks', f.unlockedPacks || []);
        }
    });

 

}); // <--- Aceasta închide io.on('connection')

const PORT = process.env.PORT || 8080; http.listen(PORT, '0.0.0.0', () => { console.log(`Server activ pe portul ${PORT}`); });
