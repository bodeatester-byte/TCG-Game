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
    { id: 13, name: "Lich Necromant", type: "monster", level: 3, atk: 1750, def: 1400, family: "undead" },
    { id: 14, name: "Fantoma Regala", type: "monster", level: 4, atk: 2350, def: 1850, family: "undead" },
    { id: 15, name: "Regele Umbrelor", type: "monster", level: 5, atk: 3150, def: 2400, family: "undead" }
];

// =========================================================================
// BUCATA 2 DIN server.js (BAZA DE DATE SPELL ȘI GENERARE PACHETE DINAMICE)
// =========================================================================

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

let matchmakingQueue = []; 
let activeRooms = {};       

function trimiteLeaderboard(target = io) {
    let users = loadUsers();
    let top10 = users
        .map(u => ({ username: u.username, wins: u.wins || 0 }))
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 10);
        
    target.emit('updateLeaderboard', top10);
}

function adaugaVictorie(username) {
    if (!username) return;
    let users = loadUsers();
    let found = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (found) {
        found.wins = (found.wins || 0) + 1;
        saveUsers(users);
        trimiteLeaderboard();
    }
}

function creeazaPachetDinamic(familieAlesa) {
    let deck = [];
    let familieFiltreaza = monstersDB.filter(m => m.family === familieAlesa);
    
    let lv1 = familieFiltreaza.find(m => m.level === 1);
    let lv2 = familieFiltreaza.find(m => m.level === 2);
    let lv3 = familieFiltreaza.find(m => m.level === 3);
    let lv4 = familieFiltreaza.find(m => m.level === 4);
    let lv5 = familieFiltreaza.find(m => m.level === 5);

    for (let i = 0; i < 5; i++) deck.push(JSON.parse(JSON.stringify(lv2)));
    for (let i = 0; i < 4; i++) deck.push(JSON.parse(JSON.stringify(lv3)));
    for (let i = 0; i < 3; i++) deck.push(JSON.parse(JSON.stringify(lv4)));
    for (let i = 0; i < 2; i++) deck.push(JSON.parse(JSON.stringify(lv5)));
    
    for (let i = 0; i < 26; i++) {
        let randomSpell = spellsDB[Math.floor(Math.random() * spellsDB.length)];
        deck.push(JSON.parse(JSON.stringify(randomSpell)));
    }
    
    shuffle(deck);
    return { deck: deck, startMonster: JSON.parse(JSON.stringify(lv1)) };
}
// Verifică ultimele linii din server.js să arate exact așa:
const PORT = 8080;
http.listen(PORT, '0.0.0.0', () => { 
    // Această linie lipsește sau este ștearsă la tine în fișier:
    console.log(`Serverul ruleaza pe portul ${PORT}!`); 
});
