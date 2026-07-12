// =========================================================================
// REPARAT: INTRARE AUTOMATĂ ÎN LOBBY LA FINAL DE MECI (SUB 50 LINII)
// =========================================================================
function intoarceInLobby() {
    // Resetăm variabilele de sesiune ca să putem căuta un meci nou
    myRole = null; 
    currentRoomId = null;

    if (document.getElementById('find-game-btn')) { 
        document.getElementById('find-game-btn').disabled = false; 
        document.getElementById('find-game-btn').innerText = "Find Game"; 
    }
    if (document.getElementById('lobby-status')) {
        document.getElementById('lobby-status').innerText = "Meciul s-a terminat. Selectează pachetul și caută un nou adversar!";
    }
    
    // Ascundem elementele de chat
    if (document.getElementById('chat-hamburger')) document.getElementById('chat-hamburger').style.display = 'none';
    if (document.getElementById('chat-sidebar')) { 
        document.getElementById('chat-sidebar').classList.remove('open'); 
        document.getElementById('chat-sidebar').style.display = 'none'; 
    }
    
    // Comutăm ecranele vizuale (OBLIGATORIU)
    if (document.getElementById('game-container')) document.getElementById('game-container').style.display = 'none';
    if (document.getElementById('lobby-container')) document.getElementById('lobby-container').style.display = 'flex';
}



// =========================================================================
// BUCATA 1: INITIALIZARE NETWORK, SESIUNI SI AUTENTIFICARE
// =========================================================================
const socket = io(); 
let myRole = null; let myUsername = ""; let currentRoomId = null; 
// OBLIGATORIU: Previne eroarea "undefined" la încărcarea pozelor de spate
let p1Family = "dragon";
let p2Family = "dragon";


window.onload = () => {
    let savedUser = localStorage.getItem('tcg_username');
    if (savedUser) { socket.emit('checkActiveSession', savedUser); }
};

// =========================================================================
// REPARAT: ACTIVARE AUTOMATĂ BUTOANE CHAT LA REFRESH MULTIPLAYER (SUB 50 LINII)
// =========================================================================
socket.on('sessionRestored', (data) => {
    myUsername = data.username;
    document.getElementById('auth-container').style.display = 'none';
    
    if (data.inGame && data.roomId) {
        myRole = data.role; 
        currentRoomId = data.roomId;
        
        document.getElementById('lobby-container').style.display = 'none';
        document.getElementById('game-container').style.display = 'flex';
        
        // REPARAT: Forțăm butonul și bara de chat să apară instant pe ecran la reconectare!
        if (document.getElementById('chat-hamburger')) document.getElementById('chat-hamburger').style.display = 'flex';
        if (document.getElementById('chat-sidebar')) document.getElementById('chat-sidebar').style.display = 'flex';
    } else {
        document.getElementById('lobby-container').style.display = 'flex';
        document.getElementById('lobby-welcome-user').innerText = myUsername;
    }
});


if (document.getElementById('register-btn')) {
    document.getElementById('register-btn').onclick = () => {
        let u = document.getElementById('username-input').value.trim();
        let p = document.getElementById('password-input').value.trim();
        if(u === "" || p === "") { alert("Introdu datele!"); return; }
        socket.emit('registerUser', { username: u, password: p });
    };
}
if (document.getElementById('login-btn')) {
    document.getElementById('login-btn').onclick = () => {
        let u = document.getElementById('username-input').value.trim();
        let p = document.getElementById('password-input').value.trim();
        if(u === "" || p === "") { alert("Introdu datele!"); return; }
        socket.emit('loginUser', { username: u, password: p });
    };
}

// =========================================================================
// REPARAT: ACTIVARE CHAT LA LOGARE ÎN TIMPUL MECIULUI (SUB 50 LINII)
// =========================================================================
socket.on('authResponse', (data) => {
    if (document.getElementById('auth-message')) document.getElementById('auth-message').innerText = data.message || "";
    
    if (data.success) {
        myUsername = data.username; 
        localStorage.setItem('tcg_username', myUsername);
        document.getElementById('auth-container').style.display = 'none';
        
        if (data.inGame && data.roomId) {
            myRole = data.role; 
            currentRoomId = data.roomId;
            document.getElementById('lobby-container').style.display = 'none';
            document.getElementById('game-container').style.display = 'flex';
            
            // REPARAT: Reactivăm chatul și în cazul logării de urgență după deconectare
            if (document.getElementById('chat-hamburger')) document.getElementById('chat-hamburger').style.display = 'flex';
            if (document.getElementById('chat-sidebar')) document.getElementById('chat-sidebar').style.display = 'flex';
        } else {
            document.getElementById('lobby-container').style.display = 'flex';
            document.getElementById('lobby-welcome-user').innerText = myUsername;
        }
    }
});


if (document.getElementById('logout-btn')) {
    document.getElementById('logout-btn').onclick = () => {
        localStorage.removeItem('tcg_username');
        myUsername = ""; myRole = null; currentRoomId = null;
        if (document.getElementById('username-input')) document.getElementById('username-input').value = "";
        if (document.getElementById('password-input')) document.getElementById('password-input').value = "";
        if (document.getElementById('auth-message')) document.getElementById('auth-message').innerText = "";
        document.getElementById('lobby-container').style.display = 'none';
        document.getElementById('auth-container').style.display = 'flex';
    };
}
// =========================================================================
// BUCATA 3: MATCHMAKING, MONSTERS DB ȘI MOTOR GRAFIC (UPDATE UI INTRO)
// =========================================================================
// =========================================================================
// REPARAT: COPIAZĂ ACEST BLOC INTEGRAL DIRECT ÎN LOCUL CELUI VECHI ÎN APP.JS
// =========================================================================
let esteInCautare = false;

if (document.getElementById('find-game-btn')) {
    document.getElementById('find-game-btn').onclick = () => {
        const btn = document.getElementById('find-game-btn');
        
        if (!esteInCautare) {
            let deck = document.querySelector('input[name="deck-choice"]:checked').value;
            esteInCautare = true;
            btn.innerText = "Se caută... (Anulează)";
            btn.classList.add('in-cautare-active'); 
            socket.emit('findGame', { deck: deck, username: myUsername });
        } else {
            esteInCautare = false;
            btn.innerText = "Find Game";
            btn.classList.remove('in-cautare-active');
            socket.emit('cancelFindGame', { username: myUsername }); 
        }
    };
}

socket.on('matchReady', (data) => {
    esteInCautare = false; // Resetăm starea de căutare
    const btn = document.getElementById('find-game-btn');
    if (btn) { btn.classList.remove('in-cautare-active'); btn.innerText = "Find Game"; }

    myRole = data.role; currentRoomId = data.roomId;
    document.getElementById('lobby-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    if(document.getElementById('chat-hamburger')) document.getElementById('chat-hamburger').style.display = 'flex';
    if(document.getElementById('chat-sidebar')) document.getElementById('chat-sidebar').style.display = 'flex';
});

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

let activePlayer = 1; let p1LP = 8000; let p2LP = 8000;
let p1Username = ""; let p2Username = ""; let p1Field = null; let p2Field = null;
let p1Hand = []; let p2Hand = []; let p1Graveyard = []; let p2Graveyard = [];
let p1Deck = []; let p2Deck = []; let mustDiscard = false;
let p1CanMulligan = true; let p2CanMulligan = true;
let hasEvolvedThisTurn = false; let hasAttackedThisTurn = false;


// =========================================================================
// BUCATA 4: UPDATE UI GRAPHICS MOTOR (STATE SYNCHRONIZATION)
// =========================================================================
function handleCardClick(index) {
    if (myRole !== activePlayer) { alert("Nu e tura ta!"); return; }
    let hand = activePlayer === 1 ? p1Hand : p2Hand;
    if (!hand || !hand[index]) return; 
    if (mustDiscard) { discardCard(index); } else {
        if (hand[index].type === 'monster') { summonMonster(index); } else { activateSpell(index); }
    }
}
function enlightenedMulligan(v) { return v === true || v === "true"; }
function obtineRutaImagine(c) { if (!c || !c.name) return ""; return `imagini/${c.name.toLowerCase().replace(/ /g, "-")}.png`; }

// =========================================================================
// REPARAT: CUSTODIE TEXT ȘI ȘTERGERE ALERTĂ LA RECONECTARE (SUB 50 DE LINII)
// =========================================================================
// =========================================================================
// REPARAT: COPIAZĂ ACEST BLOC PENTRU STAT-UL JOCULUI ȘI DESIGN SPATE CARDURI
// =========================================================================
socket.on('updateGameState', (state) => {
    if (!state.gameStarted) return;
    
    activePlayer = state.activePlayer; p1LP = state.p1LP; p2LP = state.p2LP;
    p1Username = state.p1Username; p2Username = state.p2Username;
    p1Field = state.p1Field; p2Field = state.p2Field; p1Hand = state.p1Hand; p2Hand = state.p2Hand;
    p1Deck = state.p1Deck; p2Deck = state.p2Deck; p1Graveyard = state.p1Graveyard; p2Graveyard = state.p2Graveyard;
    mustDiscard = state.mustDiscard; p1CanMulligan = state.p1CanMulligan; p2CanMulligan = state.p2CanMulligan;
    hasEvolvedThisTurn = state.hasEvolvedThisTurn; hasAttackedThisTurn = state.hasAttackedThisTurn;
    
    // ADĂUGAT: Extragem familiile pachetelor trimise de server pentru spatele cărților
    p1Family = state.p1Family || "dragon";
    p2Family = state.p2Family || "dragon";
    
    updateUI(); 
    afiseazaBannerTura(activePlayer);

    const gameMsg = document.getElementById('game-message');
    if (gameMsg) {
        gameMsg.style.color = "#a4b0be"; 
        let numeCurent = activePlayer === 1 ? p1Username : p2Username;
        if (mustDiscard) {
            gameMsg.innerText = `Tura lui ${numeCurent}! Mână plină, decartează o carte.`;
        } else {
            gameMsg.innerText = `Este tura lui ${numeCurent}! Mută cărțile sau atacă.`;
        }
    }
});



function salveazaMutarea() {
    let s = { gameStarted: true, activePlayer, p1LP, p2LP, p1Username, p2Username, p1Field, p2Field, p1Hand, p2Hand, p1Deck, p2Deck, p1Graveyard, p2Graveyard, mustDiscard, p1CanMulligan, p2CanMulligan, hasEvolvedThisTurn, hasAttackedThisTurn };
    socket.emit('playerAction', { roomId: currentRoomId, state: s });
}

function updateUI() {
    if(document.getElementById('p1-username')) document.getElementById('p1-username').innerText = p1Username || "Jucător 1";
    if(document.getElementById('p2-username')) document.getElementById('p2-username').innerText = p2Username || "Jucător 2";
    if(document.getElementById('p1-lp')) document.getElementById('p1-lp').innerText = p1LP;
    if(document.getElementById('p2-lp')) document.getElementById('p2-lp').innerText = p2LP;
   // =========================================================================
// APP.JS - IMAGINI SPATE PENTRU DECK ȘI GY JUCĂTOR 1 (IN INTERIORUL updateUI)
// =========================================================================
    if(document.getElementById('p1-deck')) {
        const d1 = document.getElementById('p1-deck');
        d1.innerText = `DECK\n(${p1Deck ? p1Deck.length : 0})`;
        d1.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('imagini/spate-${p1Family}.png')`;
        d1.style.backgroundSize = "cover"; d1.style.backgroundPosition = "center"; d1.style.color = "#fff";
    }
    if(document.getElementById('p1-graveyard')) {
        const gy1 = document.getElementById('p1-graveyard');
        gy1.innerText = `GY\n(${p1Graveyard ? p1Graveyard.length : 0})`;
        gy1.style.backgroundImage = `linear-gradient(rgba(45,34,45,0.7), rgba(45,34,45,0.7)), url('imagini/spate-${p1Family}.png')`;
        gy1.style.backgroundSize = "cover"; gy1.style.backgroundPosition = "center"; gy1.style.color = "#ff4757";
    }
// =========================================================================
// APP.JS - IMAGINI SPATE PENTRU DECK ȘI GY JUCĂTOR 2 (IN INTERIORUL updateUI)
// =========================================================================
    if(document.getElementById('p2-deck')) {
        const d2 = document.getElementById('p2-deck');
        d2.innerText = `DECK\n(${p2Deck ? p2Deck.length : 0})`;
        d2.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('imagini/spate-${p2Family}.png')`;
        d2.style.backgroundSize = "cover"; d2.style.backgroundPosition = "center"; d2.style.color = "#fff";
    }
    if(document.getElementById('p2-graveyard')) {
        const gy2 = document.getElementById('p2-graveyard');
        gy2.innerText = `GY\n(${p2Graveyard ? p2Graveyard.length : 0})`;
        gy2.style.backgroundImage = `linear-gradient(rgba(45,34,45,0.7), rgba(45,34,45,0.7)), url('imagini/spate-${p2Family}.png')`;
        gy2.style.backgroundSize = "cover"; gy2.style.backgroundPosition = "center"; gy2.style.color = "#ff4757";
    }

    // =========================================================================
// REPARAT: PASUL 4 REFACTORIZAT DIRECT PE STRUCTURA TA (SUB 50 DE LINII)
// =========================================================================
    const p2h = document.getElementById('p2-hand');
    if (p2h && p2Hand) {
        p2h.innerHTML = ''; p2Hand.forEach((card, idx) => {
            if (!card) return; const el = document.createElement('div'); el.className = 'card';
            if (myRole === 2) {
                el.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85)), url('${obtineRutaImagine(card)}')`; el.style.backgroundSize = 'cover'; el.style.color = 'white'; el.style.display = 'flex'; el.style.flexDirection = 'column'; el.style.justifyContent = 'space-between'; el.style.border = card.type === 'spell' ? '3px solid #2e86de' : '3px solid #f1c40f';
                el.innerHTML = `<div style="font-weight:bold; font-size:12px; padding:2px;">${card.name}</div><div style="font-size:11px; text-align:center; padding:2px;"><strong>${card.atk !== undefined ? 'ATK: ' + card.atk : card.desc}</strong></div>`;
                el.onclick = () => handleCardClick(idx);
            } else { 
                // REPARAT: Folosim dinamic spatele unic în funcție de pachetul inamicului
                el.style.backgroundImage = `url('imagini/spate-${p2Family}.png')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                el.style.border = "2px solid #2c3e50";
                el.innerHTML = ""; 
            }
            p2h.appendChild(el);
        });
    }

// =========================================================================
// BUCATA 5: UPDATE UI TABLES (MATS FIELD RENDERING) AND MULLIGAN DISPLAY
// =========================================================================
    const p2f = document.getElementById('p2-field');
    if (p2f && p2Field) {
        p2f.innerHTML = ''; let m = p2Field.card ? p2Field.card : p2Field;
        if (m && m.id) {
            const el = document.createElement('div'); el.className = 'card';
            let orig = monstersDB.find(x => x.id === m.id); let bc = '#f3a683'; 
            if (orig) { if (m.atk > orig.atk) bc = '#7bed9f'; if (m.atk < orig.atk) bc = '#ff6b81'; }
            el.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85)), url('${obtineRutaImagine(m)}')`; el.style.backgroundSize = 'cover'; el.style.color = 'white'; el.style.display = 'flex'; el.style.flexDirection = 'column'; el.style.justifyContent = 'space-between'; el.style.border = `3px solid ${bc}`;
            el.innerHTML = `<div style="font-weight:bold; font-size:12px; padding:2px;">${m.name}</div><div style="font-size:11px; text-align:center; padding:2px;">LV: ${m.level}<br><strong>ATK: ${m.atk}</strong></div>`;
            if (myRole === 2 && activePlayer === 2) el.onclick = attackEnemy;
            p2f.appendChild(el);
        }
    }

    const p1h = document.getElementById('p1-hand');
    if (p1h && p1Hand) {
        p1h.innerHTML = ''; p1Hand.forEach((card, idx) => {
            if (!card) return; const el = document.createElement('div'); el.className = 'card';
          // =========================================================================
            // REPARAT: PASUL 5 REFACTORIZAT DIRECT PE STRUCTURA TA (SUB 50 DE LINII)
        // =========================================================================
            if (myRole === 1) {
                el.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85)), url('${obtineRutaImagine(card)}')`; el.style.backgroundSize = 'cover'; el.style.color = 'white'; el.style.display = 'flex'; el.style.flexDirection = 'column'; el.style.justifyContent = 'space-between'; el.style.border = card.type === 'spell' ? '3px solid #2e86de' : '3px solid #f1c40f';
                el.innerHTML = `<div style="font-weight:bold; font-size:12px; padding:2px;">${card.name}</div><div style="font-size:11px; text-align:center; padding:2px;"><strong>${card.atk !== undefined ? 'ATK: ' + card.atk : card.desc}</strong></div>`;
                el.onclick = () => handleCardClick(idx);
            } else { 
                // REPARAT: Folosim dinamic spatele unic în funcție de pachetul Jucătorului 1
                el.style.backgroundImage = `url('imagini/spate-${p1Family}.png')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                el.style.border = "2px solid #2c3e50";
                el.innerHTML = ""; // Eliminăm textul vechi "TCG"
            }
            p1h.appendChild(el);

        });
    }

    const p1f = document.getElementById('p1-field');
    if (p1f && p1Field) {
        p1f.innerHTML = ''; let m = p1Field.card ? p1Field.card : p1Field;
        if (m && m.id) {
            const el = document.createElement('div'); el.className = 'card';
            let orig = monstersDB.find(x => x.id === m.id); let bc = '#f3a683';
            if (orig) { if (m.atk > orig.atk) bc = '#7bed9f'; if (m.atk < orig.atk) bc = '#ff6b81'; }
            el.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85)), url('${obtineRutaImagine(m)}')`; el.style.backgroundSize = 'cover'; el.style.color = 'white'; el.style.display = 'flex'; el.style.flexDirection = 'column'; el.style.justifyContent = 'space-between'; el.style.border = `3px solid ${bc}`;
            el.innerHTML = `<div style="font-weight:bold; font-size:12px; padding:2px;">${m.name}</div><div style="font-size:11px; text-align:center; padding:2px;">LV: ${m.level}<br><strong>ATK: ${m.atk}</strong></div>`;
            if (myRole === 1 && activePlayer === 1) el.onclick = attackEnemy;
            p1f.appendChild(el);
        }
    }

    const mBtn = document.getElementById('mulligan-btn');
    if (mBtn) {
        let canM = (myRole === 1 && p1CanMulligan) || (myRole === 2 && p2CanMulligan);
        mBtn.style.display = (myRole === activePlayer && enlightenedMulligan(canM)) ? 'inline-block' : 'none';
    }
}
// =========================================================================
// BUCATA 6: MECANICI DE EVOLUȚIE ȘI ACTIVARE VRĂJI (SPELL-URI)
// =========================================================================
function discardCard(idx) {
    let h = activePlayer === 1 ? p1Hand : p2Hand; 
    let g = activePlayer === 1 ? p1Graveyard : p2Graveyard;
    let r = h.splice(idx, 1); g.push(r); 
    if (h.length <= 5) mustDiscard = false; salveazaMutarea();
}

function activateSpell(idx) {
    if (mustDiscard) return; 
    if (activePlayer === 1) p1CanMulligan = false; else p2CanMulligan = false;
    let h = activePlayer === 1 ? p1Hand : p2Hand; 
    let mf = activePlayer === 1 ? p1Field : p2Field; 
    let ef = activePlayer === 1 ? p2Field : p1Field;
    if (!mf || !ef) { alert("Ambii au nevoie de monștri!"); return; }
    let mMon = mf.card ? mf.card : mf; let eMon = ef.card ? ef.card : ef; 
    let spell = h[idx];
    if (spell.effect === "buff") { mMon.atk += spell.power; mMon.lastTargetedBy = activePlayer; } 
    else if (spell.effect === "burn" || spell.effect === "freeze") { eMon.atk = Math.max(0, eMon.atk - spell.power); eMon.lastTargetedBy = activePlayer; } 
    else if (spell.effect === "heal") { if (activePlayer === 1) p1LP += spell.power; else p2LP += spell.power; } 
    else if (spell.effect === "halve") { eMon.atk = Math.floor(eMon.atk / 2); eMon.lastTargetedBy = activePlayer; } 
    else if (spell.effect === "double") { mMon.atk = mMon.atk * 2; mMon.lastTargetedBy = activePlayer; }
    let s = h.splice(idx, 1); (activePlayer === 1 ? p1Graveyard : p2Graveyard).push(s); 
    salveazaMutarea();
}

function summonMonster(idx) {
    if (mustDiscard) return; 
    let h = activePlayer === 1 ? p1Hand : p2Hand; 
    let f = activePlayer === 1 ? p1Field : p2Field; let card = h[idx];
    if (!f) return; let curM = f.card ? f.card : f;
    if (card.level === curM.level) {
        if (card.family !== curM.family) return;
        let bp = 0; if (card.level === 2) bp = 500; else if (card.level === 3) bp = 400; else if (card.level === 4) bp = 300; else if (card.level === 5) bp = 200;
        if (bp > 0) { curM.atk += bp; curM.lastTargetedBy = activePlayer; (activePlayer === 1 ? p1Graveyard : p2Graveyard).push(h.splice(idx, 1)); salveazaMutarea(); return; }
    }
    if (hasEvolvedThisTurn) return; 
    if (activePlayer === 1) p1CanMulligan = false; else p2CanMulligan = false;
    if (card.level === curM.level + 1 && card.family === curM.family) {
        if (f.card) f.card = card; else { if (activePlayer === 1) p1Field = card; else p2Field = card; }
        h.splice(idx, 1); hasEvolvedThisTurn = true; salveazaMutarea();
    }
}
// =========================================================================
// BUCATA 7: COMBAT, CONTROL TURE ȘI BANNER MULTIPLAYER ANIMAT
// =========================================================================
function attackEnemy() {
    if (mustDiscard || myRole !== activePlayer || hasAttackedThisTurn) return;
    if (!p1Field || !p2Field) return;
    let m = activePlayer === 1 ? (p1Field.card ? p1Field.card : p1Field) : (p2Field.card ? p2Field.card : p2Field);
    let e = activePlayer === 1 ? (p2Field.card ? p2Field.card : p2Field) : (p1Field.card ? p1Field.card : p1Field);
    let damage = Math.abs(parseInt(m.atk) - parseInt(e.atk));
    
    let fId = activePlayer === 1 ? 'p2-field' : 'p1-field'; let container = document.getElementById(fId);
    if (container) { let c = container.querySelector('.card'); if (c) { c.style.transition = "transform 0.1s"; c.style.transform = "translate(5px, 5px)"; setTimeout(() => c.style.transform = "translate(0,0)", 100); } }
    
    let fl = document.createElement('div'); fl.style.position = 'fixed'; fl.style.top = '0'; fl.style.left = '0'; fl.style.width = '100vw'; fl.style.height = '100vh'; fl.style.backgroundColor = 'rgba(255, 71, 87, 0.4)'; fl.style.zIndex = '9999'; fl.style.pointerEvents = 'none'; document.body.appendChild(fl); setTimeout(() => fl.remove(), 80);

    if (parseInt(m.atk) > parseInt(e.atk)) { if (activePlayer === 1) p2LP -= damage; else p1LP -= damage; } else if (parseInt(m.atk) < parseInt(e.atk)) { if (activePlayer === 1) p1LP -= damage; else p2LP -= damage; }
    hasAttackedThisTurn = true;
    if (p1LP <= 0 || p2LP <= 0) { socket.emit('matchFinishedNormal', { roomId: currentRoomId, winnerUsername: p1LP <= 0 ? p2Username : p1Username, reason: "puncte de viata" }); } else { salveazaMutarea(); }
}

socket.on('matchOverByPoints', () => { intoarceInLobby(); });

if (document.getElementById('mulligan-btn')) {
    document.getElementById('mulligan-btn').onclick = () => {
        if (myRole !== activePlayer) return; let isP1 = activePlayer === 1;
        let canM = isP1 ? p1CanMulligan : p2CanMulligan; if (!enlightenedMulligan(canM)) { alert("Ai folosit deja Mulligan-ul!"); return; }
        let hand = isP1 ? p1Hand : p2Hand; let deck = isP1 ? p1Deck : p2Deck;
        while (hand.length > 0) { deck.push(hand.pop()); }
        for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
        for (let i = 0; i < 3; i++) { if (deck.length > 0) hand.push(deck.pop()); }
        if (isP1) p1CanMulligan = false; else p2CanMulligan = false; salveazaMutarea();
    };
}
// =========================================================================
// BUCATA 8: BARE LATERALE, CHAT REPARAT PE STÂNGA ȘI LEADERBOARD
// =========================================================================
if (document.getElementById('end-turn-btn')) {
    document.getElementById('end-turn-btn').onclick = () => {
        if (myRole !== activePlayer || mustDiscard) return;
        if (activePlayer === 1) p1CanMulligan = false; else p2CanMulligan = false;
        let p1m = p1Field?.card ? p1Field.card : p1Field; let p2m = p2Field?.card ? p2Field.card : p2Field;
        if (activePlayer === 1) { if (p2m?.lastTargetedBy) { let o = monstersDB.find(x => x.id === p2m.id); if (o) p2m.atk = o.atk; delete p2m.lastTargetedBy; } } else { if (p1m?.lastTargetedBy) { let o = monstersDB.find(x => x.id === p1m.id); if (o) p1m.atk = o.atk; delete p1m.lastTargetedBy; } }
        hasEvolvedThisTurn = false; hasAttackedThisTurn = false; activePlayer = activePlayer === 1 ? 2 : 1;
        let nd = activePlayer === 1 ? p1Deck : p2Deck; let nh = activePlayer === 1 ? p1Hand : p2Hand;
        if (!nd || nd.length === 0) { socket.emit('matchFinishedNormal', { roomId: currentRoomId, winnerUsername: activePlayer === 1 ? p2Username : p1Username, reason: "carti in pachet" }); return; }
        nh.push(nd.pop()); if (nh.length > 5) mustDiscard = true; salveazaMutarea();
    };
}

let lastP1LP = 8000; let lastP2LP = 8000; let ultimaTuraAfisata = null;
function afiseazaBannerTura(t) {
    if (ultimaTuraAfisata === t) return; ultimaTuraAfisata = t; const b = document.getElementById('turn-banner'); if (!b) return;
    let me = myRole === t; b.innerText = me ? "⚔️ TURA TA ⚔️" : "⏳ TURA INAMICULUI ⏳"; b.className = me ? "banner-your-turn" : "banner-enemy-turn";
    b.style.display = "block"; setTimeout(() => { b.classList.add('show'); }, 50);
    setTimeout(() => { b.classList.remove('show'); setTimeout(() => { b.style.display = "none"; }, 300); }, 2000);
}

if (document.getElementById('chat-hamburger')) { document.getElementById('chat-hamburger').onclick = () => { document.getElementById('chat-sidebar')?.classList.add('open'); if(document.getElementById('chat-badge')) document.getElementById('chat-badge').style.display = 'none'; }; }
if (document.getElementById('chat-close')) { document.getElementById('chat-close').onclick = () => { document.getElementById('chat-sidebar')?.classList.remove('open'); }; }
if (document.getElementById('chat-send-btn')) { document.getElementById('chat-send-btn').onclick = trimiteMesajChat; }
if (document.getElementById('chat-message-input')) { document.getElementById('chat-message-input').onkeydown = (e) => { if (e.key === 'Enter') trimiteMesajChat(); }; }
function trimiteMesajChat() { let i = document.getElementById('chat-message-input'); if (!i || i.value.trim() === "") return; socket.emit('sendChatMessage', { roomId: currentRoomId, username: myUsername, text: i.value.trim() }); i.value = ""; }
socket.on('receiveChatMessage', (d) => {
    const m = document.createElement('div'); m.className = d.username === myUsername ? 'chat-msg me' : 'chat-msg'; m.innerHTML = `<b>${d.username}:</b> ${d.text}`;
    let c = document.getElementById('chat-messages'); if (c) { c.appendChild(m); c.scrollTop = c.scrollHeight; }
    let s = document.getElementById('chat-sidebar'); if (d.username !== myUsername && s && !s.classList.contains('open')) { if(document.getElementById('chat-badge')) document.getElementById('chat-badge').style.display = 'inline-block'; }
});
if (document.getElementById('go-lobby-btn')) { document.getElementById('go-lobby-btn').onclick = () => { if (confirm("Abandonezi?")) { socket.emit('playerSurrender', { roomId: currentRoomId, role: myRole }); } }; }
socket.on('matchOverBySurrender', (data) => {
    alert("Meciul s-a încheiat prin abandonul sau deconectarea unui jucător!");
    intoarceInLobby(); 
});
socket.on('updateLeaderboard', (list) => {
    const b = document.getElementById('leaderboard-body'); if (!b) return; b.innerHTML = ''; if (list.length === 0) { b.innerHTML = '<tr><td colspan="4">Niciun jucator.</td></tr>'; return; }
    list.forEach((p, idx) => {
        const r = document.createElement('tr'); r.style.borderBottom = '1px solid #222'; let rc = '#fff'; if (idx === 0) rc = '#f1c40f'; if (idx === 1) rc = '#d2dae2';
        
        // REPARAT: S-a eliminat "/" de la finalul "imagini/coin.png"
        r.innerHTML = `
            <td style="color:${rc}; font-weight:bold; padding:6px;">#${idx + 1}</td>
            <td style="padding:6px;">${p.username}</td>
            <td style="text-align:right; padding:6px; color:#55efc4;">🏆 ${p.wins}</td>
            <td style="text-align:right; padding:6px; display:flex; align-items:center; justify-content:flex-end; gap:5px;">
                <img src="imagini/coin.png" alt="Coin" style="width:16px; height:16px; object-fit:contain;">
                <span style="color:#ffd700; font-weight:bold;">${p.coins || 0}</span>
            </td>
        `; 
        b.appendChild(r);
    });
});



// =========================================================================
// REPARAT: COLECTARE CORECTĂ USERNAME LA DECONECTARE (SUB 50 DE LINII)
// =========================================================================
socket.on('playerDisconnectedWaiting', (data) => {
    const gameMsg = document.getElementById('game-message');
    if (!gameMsg) return;

    // Failsafe: Dacă rețeaua nu a trimis numele, calculăm dinamic pe baza rolului
    let numePierzator = data.username || (activePlayer === 1 ? p2Username : p1Username);
    if (!numePierzator || numePierzator === "undefined") {
        numePierzator = "Adversarul";
    }

    gameMsg.style.color = "#ff4757"; // Colorăm mesajul în roșu (alertă)
    gameMsg.innerText = `⚠️ ${numePierzator} s-a deconectat! Are 15 secunde să revină.`;
});

socket.on('authResponse', (data) => {
    if (data.success) {
        // Salvăm username-ul în browser pentru a-l ține minte la refresh
        localStorage.setItem('savedUsername', data.username);

        const coinsContainer = document.getElementById('lobby-user-coins');
        if (coinsContainer) {
            coinsContainer.innerText = data.coins || 0;
        }
        // ... restul codului tău de login
    }
});

// Pune și acest ascultător general la finalul fișierului tău de frontend pentru actualizări live (ex: la câștig)
// ================= COD FRONTEND: GESTIUNE MONEDE ȘI SHOP =================

// 1. Variabilă globală în browser pentru a ști în orice moment câte monede are jucătorul logat
let jucatorCoinsCurenti = 0;

// 2. Modificăm funcția ta 'updateYourCoins' pentru a salva monedele și a bloca Shop-ul automat
socket.on('updateYourCoins', (coins) => {
    jucatorCoinsCurenti = coins; // Salvăm valoarea în memoria JavaScript
    
    const coinsContainer = document.getElementById('lobby-user-coins');
    if (coinsContainer) {
        coinsContainer.innerText = coins;
    }
    
    // De fiecare dată când se schimbă monedele, actualizăm vizual butoanele din magazin
    actualizeazaButoaneShop();
});

// 3. Funcția nouă care verifică banii și blochează/colorează butoanele din Shop
function actualizeazaButoaneShop() {
    const preturi = {
        'dragon': 100,
        'golem': 200,
        'undead': 300,
        'spirit': 400, // Mapat la fix pe numele 'spirit' din proiectul tău
        'mecha': 500
    };

    Object.keys(preturi).forEach(pack => {
        // Căutăm butonul din magazin (asigură-te că butoanele au id="btn-shop-dragon", id="btn-shop-golem" etc. în HTML)
        const buton = document.getElementById(`btn-shop-${pack}`);
        if (buton) {
            if (jucatorCoinsCurenti < preturi[pack]) {
                // BLOCAT: Jucătorul nu are bani. Butonul devine gri, opac și dezactivat
                buton.disabled = true;
                buton.style.opacity = "0.5";
                buton.style.cursor = "not-allowed";
                buton.style.background = "#555566";
                buton.style.color = "#aaaaaa";
            } else {
                // DEBLOCAT: Jucătorul are suficienți bani. Butonul revine la galbenul normal interactiv
                buton.disabled = false;
                buton.style.opacity = "1";
                buton.style.cursor = "pointer";
                buton.style.background = "#ffd700";
                buton.style.color = "#000000";
            }
        }
    });
}

// 4. Modificăm funcția ta de buyPack pentru o siguranță suplimentară (să nu poată trimite cererea la server dacă dă cumva click prin eroare)
function buyPack(packName) {
    const preturi = { 'dragon': 100, 'golem': 200, 'undead': 300, 'spirit': 400, 'mecha': 500 };
    const pretulPachetului = preturi[packName.toLowerCase()];

    if (jucatorCoinsCurenti < pretulPachetului) {
        alert(`Nu ai suficiente monede! Acest pachet costă ${pretulPachetului} monede.`);
        return; // Oprește funcția imediat, nu trimite nimic la Node.js
    }

    // Dacă are suficienți bani, trimite comanda securizată pe server
    socket.emit('buyPackRequest', { packName: packName });
}

// 5. Funcția ta nativă de ascundere/afișare a pachetelor din lobby (Păstrată intactă)
socket.on('updateUnlockedPacks', (unlockedPacks) => {
    const toatePachetele = ['dragon', 'golem', 'undead', 'spirit', 'mecha'];

    toatePachetele.forEach(pack => {
        const elementCard = document.getElementById(`lobby-pack-${pack}`);
        if (elementCard) {
            if (pack === 'dragon' || (unlockedPacks && unlockedPacks.includes(pack))) {
                elementCard.style.display = 'block'; 
            } else {
                elementCard.style.display = 'none'; 
            }
        }
    });
});


// Acest cod rulează automat de fiecare dată când pagina se încarcă/ia refresh
window.addEventListener('load', () => {
    const savedUser = localStorage.getItem('savedUsername');
    if (savedUser) {
        // Îi cerem serverului valoarea reală a monedelor pentru acest utilizator
        socket.emit('requestCoinsOnRefresh', savedUser);
    }
});

// Ștergem username-ul salvat doar dacă utilizatorul apasă manual pe Log Out
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('savedUsername');
    });
}
// Funcție pentru deschiderea/închiderea ferestrei de Shop
function toggleShopLayout() {
    const shop = document.getElementById('lobby-shop-modal');
    if (shop.style.display === 'none' || !shop.style.display) {
        shop.style.display = 'block';
    } else {
        shop.style.display = 'none';
    }
}

function buyPack(packName, price) {
    // Trimitem numele familiei (ex: 'dragon', 'golem') și prețul
    socket.emit('buyPackRequest', { packName: packName, price: price });
}


updateUI();