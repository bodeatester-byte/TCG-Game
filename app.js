// ==========================================
// 0. CONECTARE ȘI MANAGEMENT MULTIPLAYER CLOUD
// ==========================================
// REPARAT PENTRU RENDER: Citim automat originea securizată https a site-ului
const socket = io(window.location.origin); 
let myRole = null;   
let myUsername = "";
let currentRoomId = null; // Stochează ID-ul camerei unice alocate de Render

// Când se încarcă pagina, verificăm dacă browserul are un cont salvat în istoric
window.onload = () => {
    let savedUser = localStorage.getItem('tcg_username');
    if (savedUser) {
        socket.emit('checkActiveSession', savedUser);
    }
};

// Răspunsul primit la pornirea paginii (Ne ține logați direct în Lobby)
socket.on('sessionRestored', (data) => {
    myUsername = data.username;
    
    const authContainer = document.getElementById('auth-container');
    const lobbyContainer = document.getElementById('lobby-container');
    const welcomeUser = document.getElementById('lobby-welcome-user');
    
    if (authContainer) authContainer.style.display = 'none';
    if (lobbyContainer) lobbyContainer.style.display = 'flex';
    if (welcomeUser) welcomeUser.innerText = myUsername;
});

if (document.getElementById('register-btn')) {
    document.getElementById('register-btn').onclick = () => {
        let user = document.getElementById('username-input').value.trim();
        let pass = document.getElementById('password-input').value.trim();
        if(user === "" || pass === "") { alert("Introdu username și parolă!"); return; }
        socket.emit('registerUser', { username: user, password: pass });
    };
}

if (document.getElementById('login-btn')) {
    document.getElementById('login-btn').onclick = () => {
        let user = document.getElementById('username-input').value.trim();
        let pass = document.getElementById('password-input').value.trim();
        if(user === "" || pass === "") { alert("Introdu username și parolă!"); return; }
        socket.emit('loginUser', { username: user, password: pass });
    };
}

socket.on('authResponse', (data) => {
    let msgEl = document.getElementById('auth-message');
    if (msgEl) msgEl.innerText = data.message || "";
    
    if (data.success) {
        myUsername = data.username;
        localStorage.setItem('tcg_username', myUsername);
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('lobby-container').style.display = 'flex';
        document.getElementById('lobby-welcome-user').innerText = myUsername;
    }
});

if (document.getElementById('find-game-btn')) {
    document.getElementById('find-game-btn').onclick = () => {
        let selectedDeck = document.querySelector('input[name="deck-choice"]:checked').value;
        document.getElementById('find-game-btn').disabled = true;
        document.getElementById('find-game-btn').innerText = "Se caută meci...";
        document.getElementById('lobby-status').innerText = "Ai intrat în coada de așteptare. Se caută un adversar liber...";
        socket.emit('findGame', { deck: selectedDeck, username: myUsername });
    };
}

// Repartizarea automată în camera privată 2 câte 2
socket.on('matchReady', (data) => {
    myRole = data.role;
    currentRoomId = data.roomId;
    document.getElementById('lobby-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
});

socket.on('updateGameState', (serverState) => {
    if (!serverState.gameStarted) return;
    activePlayer = serverState.activePlayer;
    p1LP = serverState.p1LP; p2LP = serverState.p2LP;
    p1Username = serverState.p1Username; p2Username = serverState.p2Username;
    p1Field = serverState.p1Field; p2Field = serverState.p2Field;
    p1Hand = serverState.p1Hand; p2Hand = serverState.p2Hand;
    p1Deck = serverState.p1Deck; p2Deck = serverState.p2Deck;
    p1Graveyard = serverState.p1Graveyard; p2Graveyard = serverState.p2Graveyard;
    mustDiscard = serverState.mustDiscard;
    p1CanMulligan = serverState.p1CanMulligan; p2CanMulligan = serverState.p2CanMulligan;
    hasEvolvedThisTurn = serverState.hasEvolvedThisTurn; hasAttackedThisTurn = serverState.hasAttackedThisTurn;
    updateUI(); 
});

function salveazaMutarea() {
    let stateToSend = {
        gameStarted: true, activePlayer, p1LP, p2LP, p1Username, p2Username, p1Field, p2Field, p1Hand, p2Hand,
        p1Deck, p2Deck, p1Graveyard, p2Graveyard, mustDiscard,
        p1CanMulligan, p2CanMulligan, hasEvolvedThisTurn, hasAttackedThisTurn
    };
    socket.emit('playerAction', { roomId: currentRoomId, state: stateToSend });
}

// ==========================================
// 1. BAZA DE DATE LOCALĂ CU MONȘTRI
// ==========================================
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

let activePlayer = 1;
let p1LP = 8000; let p2LP = 8000;
let p1Username = ""; let p2Username = "";
let p1Field = []; let p2Field = [];
let p1Hand = []; let p2Hand = [];
let p1Graveyard = []; let p2Graveyard = [];
let p1Deck = []; let p2Deck = [];
let mustDiscard = false;
let p1CanMulligan = true; let p2CanMulligan = true;
let hasEvolvedThisTurn = false; let hasAttackedThisTurn = false;
// ==========================================
// 2. GESTIUNEA CLICK-URILOR (Sistem Anti-Trișat)
// ==========================================
function handleCardClick(index) {
    if (myRole !== activePlayer) {
        alert("Nu este tura ta! Așteaptă mutarea celuilalt jucător.");
        return;
    }
    let currentHand = activePlayer === 1 ? p1Hand : p2Hand;
    if (!currentHand || !currentHand[index]) return; 
    
    let card = currentHand[index];
    if (mustDiscard) {
        discardCard(index);
    } else {
        if (card.type === 'monster') {
            summonMonster(index);
        } else {
            activateSpell(index);
        }
    }
}

function enlightenedMulligan(val) {
    return val === true || val === "true";
}

function obtineRutaImagine(card) {
    if (!card || !card.name) return "";
    let numeFisier = card.name.toLowerCase().replace(/ /g, "-");
    return `imagini/${numeFisier}.png`; 
}

// ==========================================
// 3. INTERFAȚA VIZUALĂ SECURIZATĂ (Update UI)
// ==========================================
function updateUI() {
    if(document.getElementById('p1-username')) document.getElementById('p1-username').innerText = p1Username || "Jucător 1";
    if(document.getElementById('p2-username')) document.getElementById('p2-username').innerText = p2Username || "Jucător 2";

    if(document.getElementById('p1-lp')) document.getElementById('p1-lp').innerText = p1LP;
    if(document.getElementById('p2-lp')) document.getElementById('p2-lp').innerText = p2LP;
    if(document.getElementById('p1-deck')) document.getElementById('p1-deck').innerText = `DECK\n(${p1Deck ? p1Deck.length : 0})`;
    if(document.getElementById('p2-deck')) document.getElementById('p2-deck').innerText = `DECK\n(${p2Deck ? p2Deck.length : 0})`;
    if(document.getElementById('p1-graveyard')) document.getElementById('p1-graveyard').innerText = `GY\n(${p1Graveyard ? p1Graveyard.length : 0})`;
    if(document.getElementById('p2-graveyard')) document.getElementById('p2-graveyard').innerText = `GY\n(${p2Graveyard ? p2Graveyard.length : 0})`;

    // --- RANDARE JUCĂTOR 2 (SUS) ---
    const p2HandDiv = document.getElementById('p2-hand');
    if (p2HandDiv && p2Hand) {
        p2HandDiv.innerHTML = '';
        p2Hand.forEach((card, index) => {
            if (!card) return; 
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            if (myRole === 2) {
                let nameTxt = card.name || "Card";
                let lvTxt = card.level !== undefined ? `LV: ${card.level}` : "";
                let atkTxt = card.atk !== undefined ? `ATK: ${card.atk}` : `${card.desc || ""}`;
                let imgPath = obtineRutaImagine(card);

                cardEl.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85)), url('${imgPath}')`;
                cardEl.style.backgroundSize = 'cover';
                cardEl.style.backgroundPosition = 'center';
                cardEl.style.color = 'white';
                cardEl.style.display = 'flex';
                cardEl.style.flexDirection = 'column';
                cardEl.style.justifyContent = 'space-between';
                cardEl.style.border = card.type === 'spell' ? '3px solid #2e86de' : '3px solid #f1c40f';

                cardEl.innerHTML = `
                    <div style="font-weight:bold; font-size:12px; text-shadow: 2px 2px 4px #000; padding: 2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${nameTxt}</div>
                    <div style="text-shadow: 2px 2px 4px #000; font-size:11px; font-weight:bold; text-align:center; padding: 2px;">
                        ${lvTxt ? lvTxt + '<br>' : ''}<strong>${atkTxt}</strong>
                    </div>
                `;
                cardEl.onclick = () => handleCardClick(index);
            } else {
                cardEl.style.backgroundColor = '#444';
                cardEl.style.backgroundImage = 'none';
                cardEl.style.color = '#888';
                cardEl.innerHTML = `<br><br><br><b>TCG</b>`;
            }
            p2HandDiv.appendChild(cardEl);
        });
    }

    const p2FieldDiv = document.getElementById('p2-field');
    if (p2FieldDiv && p2Field) {
        p2FieldDiv.innerHTML = '';
        p2Field.forEach((inst) => {
            if (!inst) return;
            let monsterData = inst.card ? inst.card : inst;
            if (!monsterData) return;

            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            
            let origCard = monstersDB.find(m => m.id === monsterData.id);
            let borderColor = '#f3a683'; 
            if (origCard) {
                if (monsterData.atk > origCard.atk) borderColor = '#7bed9f'; 
                if (monsterData.atk < origCard.atk) borderColor = '#ff6b81'; 
            }
            
            let imgPath = obtineRutaImagine(monsterData);

            cardEl.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85)), url('${imgPath}')`;
            cardEl.style.backgroundSize = 'cover';
            cardEl.style.backgroundPosition = 'center';
            cardEl.style.color = 'white';
            cardEl.style.display = 'flex';
            cardEl.style.flexDirection = 'column';
            cardEl.style.justifyContent = 'space-between';
            cardEl.style.border = `3px solid ${borderColor}`;

            cardEl.innerHTML = `
                <div style="font-weight:bold; font-size:12px; text-shadow: 2px 2px 4px #000; padding: 2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${monsterData.name || "Monstru"}</div>
                <div style="text-shadow: 2px 2px 4px #000; font-size:11px; font-weight:bold; text-align:center; padding: 2px;">
                    LV: ${monsterData.level || 1}<br><strong>ATK: ${monsterData.atk || 0}</strong>
                </div>
            `;
            if (myRole === 2 && activePlayer === 2) cardEl.onclick = attackEnemy;
            p2FieldDiv.appendChild(cardEl);
        });
    }

    // --- RANDARE JUCĂTOR 1 (JOS) ---
    const p1HandDiv = document.getElementById('p1-hand');
    if (p1HandDiv && p1Hand) {
        p1HandDiv.innerHTML = '';
        p1Hand.forEach((card, index) => {
            if (!card) return; 
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            if (myRole === 1) {
                let nameTxt = card.name || "Card";
                let lvTxt = card.level !== undefined ? `LV: ${card.level}` : "";
                let atkTxt = card.atk !== undefined ? `ATK: ${card.atk}` : `${card.desc || ""}`;
                let imgPath = obtineRutaImagine(card);

                cardEl.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85)), url('${imgPath}')`;
                cardEl.style.backgroundSize = 'cover';
                cardEl.style.backgroundPosition = 'center';
                cardEl.style.color = 'white';
                cardEl.style.display = 'flex';
                cardEl.style.flexDirection = 'column';
                cardEl.style.justifyContent = 'space-between';
                cardEl.style.border = card.type === 'spell' ? '3px solid #2e86de' : '3px solid #f1c40f';

                cardEl.innerHTML = `
                    <div style="font-weight:bold; font-size:12px; text-shadow: 2px 2px 4px #000; padding: 2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${nameTxt}</div>
                    <div style="text-shadow: 2px 2px 4px #000; font-size:11px; font-weight:bold; text-align:center; padding: 2px;">
                        ${lvTxt ? lvTxt + '<br>' : ''}<strong>${atkTxt}</strong>
                    </div>
                `;
                cardEl.onclick = () => handleCardClick(index);
            } else {
                cardEl.style.backgroundColor = '#444';
                cardEl.style.backgroundImage = 'none';
                cardEl.style.color = '#888';
                cardEl.innerHTML = `<br><br><br><b>TCG</b>`;
            }
            p1HandDiv.appendChild(cardEl);
        });
    }

    const p1FieldDiv = document.getElementById('p1-field');
    if (p1FieldDiv && p1Field) {
        p1FieldDiv.innerHTML = '';
        p1Field.forEach((inst) => {
            if (!inst) return;
            let monsterData = inst.card ? inst.card : inst;
            if (!monsterData) return;

            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            
            let origCard = monstersDB.find(m => m.id === monsterData.id);
            let borderColor = '#f3a683';
            if (origCard) {
                if (monsterData.atk > origCard.atk) borderColor = '#7bed9f';
                if (monsterData.atk < origCard.atk) borderColor = '#ff6b81';
            }
            let imgPath = obtineRutaImagine(monsterData);

            cardEl.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85)), url('${imgPath}')`;
            cardEl.style.backgroundSize = 'cover';
            cardEl.style.backgroundPosition = 'center';
            cardEl.style.color = 'white';
            cardEl.style.display = 'flex';
            cardEl.style.flexDirection = 'column';
            cardEl.style.justifyContent = 'space-between';
            cardEl.style.border = `3px solid ${borderColor}`;

                        // REPARAT: Ghilimelele (backticks) se închid corect acum la finalul textului HTML!
            cardEl.innerHTML = `
                <div style="font-weight:bold; font-size:12px; text-shadow: 2px 2px 4px #000; padding: 2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${monsterData.name || "Monstru"}</div>
                <div style="text-shadow: 2px 2px 4px #000; font-size:11px; font-weight:bold; text-align:center; padding: 2px;">
                    LV: ${monsterData.level || 1}<br><strong>ATK: ${monsterData.atk || 0}</strong>
                </div>
            `;
            
                        // REPARAT: Atacul se apelează direct ca eveniment curat fără paranteze goale
                        if (myRole === 1 && activePlayer === 1) cardEl.onclick = attackEnemy;
                        p1FieldDiv.appendChild(cardEl);
                    });
                }

                const mulliganBtn = document.getElementById('mulligan-btn');
                if (mulliganBtn) {
                    let areCariereMulligan = (myRole === 1 && p1CanMulligan) || (myRole === 2 && p2CanMulligan);
                    if (myRole === activePlayer && enlightenedMulligan(areCariereMulligan)) {
                        mulliganBtn.style.display = 'inline-block';
                    } else {
                        mulliganBtn.style.display = 'none';
                    }
                }
            } // Acolada de final a întregii funcții updateUI
// ==========================================
// 4. LOGICA PENTRU DECARTARE & SPELL-URI
// ==========================================
function discardCard(handIndex) {
    let currentHand = activePlayer === 1 ? p1Hand : p2Hand;
    let currentGraveyard = activePlayer === 1 ? p1Graveyard : p2Graveyard;
    
    let removedCard = currentHand.splice(handIndex, 1)[0];
    currentGraveyard.push(removedCard);
    
    if (currentHand.length <= 5) {
        mustDiscard = false;
        document.getElementById('game-message').innerText = `Ai decartat ${removedCard.name || "o carte"}. Acum poți continua tura!`;
    }
    salveazaMutarea();
}

function activateSpell(handIndex) {
    if (mustDiscard) return;
    if (activePlayer === 1) p1CanMulligan = false; else p2CanMulligan = false;

    let currentHand = activePlayer === 1 ? p1Hand : p2Hand;
    let myFieldList = activePlayer === 1 ? p1Field : p2Field;
    let enemyFieldList = activePlayer === 1 ? p2Field : p1Field;
    let myGraveyard = activePlayer === 1 ? p1Graveyard : p2Graveyard;
    let spell = currentHand[handIndex];

    if (!myFieldList || !enemyFieldList || myFieldList.length === 0 || enemyFieldList.length === 0) {
        alert("Ambii jucători trebuie să aibă un monstru pe teren pentru a folosi magii!");
        return;
    }

    let myField = myFieldList[0];
    let enemyField = enemyFieldList[0];

    let myMonster = myField.card ? myField.card : myField;
    let enemyMonster = enemyField.card ? enemyField.card : enemyField;

    if (!myMonster || !enemyMonster) {
        alert("Ambii jucători trebuie să aibă un monstru pe teren pentru a folosi magii!");
        return;
    }

    if (spell.effect === "buff") {
        myMonster.atk += spell.power;
        myMonster.lastTargetedBy = activePlayer; 
        document.getElementById('game-message').innerText = `${myUsername} a oferit +${spell.power} ATK monstrului său!`;
    } 
    else if (spell.effect === "burn" || spell.effect === "freeze") {
        enemyMonster.atk = Math.max(0, enemyMonster.atk - spell.power);
        enemyMonster.lastTargetedBy = activePlayer;
        document.getElementById('game-message').innerText = `${myUsername} a scăzut cu ${spell.power} ATK monstrul inamic!`;
    } 
    else if (spell.effect === "heal") {
        if (activePlayer === 1) p1LP += spell.power; else p2LP += spell.power;
        document.getElementById('game-message').innerText = `${myUsername} a activat ${spell.name} și a recuperat +${spell.power} LP!`;
    } 
    else if (spell.effect === "halve") {
        enemyMonster.atk = Math.floor(enemyMonster.atk / 2);
        enemyMonster.lastTargetedBy = activePlayer;
        document.getElementById('game-message').innerText = `${myUsername} a blestemat inamicul! Atacul lui a fost înjumătățit la ${enemyMonster.atk}!`;
    } 
    else if (spell.effect === "double") {
        myMonster.atk = myMonster.atk * 2;
        myMonster.lastTargetedBy = activePlayer;
        document.getElementById('game-message').innerText = `${myUsername} a activat ${spell.name}! Atacul monstrului său s-a dublat la ${myMonster.atk}!`;
    }
    
    let usedSpell = currentHand.splice(handIndex, 1)[0];
    myGraveyard.push(usedSpell);
    salveazaMutarea();
}

// ==========================================
// 5. LOGICA DE EVOLUȚIE & REGULA DE BUFF
// ==========================================
function summonMonster(handIndex) {
    if (mustDiscard) return;
    
    let currentHand = activePlayer === 1 ? p1Hand : p2Hand;
    let currentFieldList = activePlayer === 1 ? p1Field : p2Field;
    let cardInHand = currentHand[handIndex];
    
    if (!currentFieldList || currentFieldList.length === 0) return;
    let currentField = currentFieldList[0];
    let currentMonster = currentField.card ? currentField.card : currentField;

    if (cardInHand.level === currentMonster.level) {
        if (cardInHand.family !== currentMonster.family) {
            alert(`Nu poți oferi buff! Deși au același nivel, monstrul de pe teren este ${currentMonster.family.toUpperCase()}, iar cel din mână este ${cardInHand.family.toUpperCase()}.`);
            return;
        }

        let buffPower = 0;
        if (cardInHand.level === 2) buffPower = 500;
        else if (cardInHand.level === 3) buffPower = 400;
        else if (cardInHand.level === 4) buffPower = 300;
        else if (cardInHand.level === 5) buffPower = 200;
        
        if (buffPower > 0) {
            currentMonster.atk += buffPower;
            currentMonster.lastTargetedBy = activePlayer; 

            document.getElementById('game-message').innerText = `${myUsername} a folosit un duplicat de LV${cardInHand.level} pentru a oferi +${buffPower} ATK!`;
            
            let usedDuplicate = currentHand.splice(handIndex, 1)[0];
            let myGraveyard = activePlayer === 1 ? p1Graveyard : p2Graveyard;
            myGraveyard.push(usedDuplicate);

            salveazaMutarea();
            return;
        }
    }

    if (hasEvolvedThisTurn) { alert("Ai evoluat deja un monstru în această tură!"); return; }
    if (activePlayer === 1) p1CanMulligan = false; else p2CanMulligan = false;

    if (cardInHand.level === currentMonster.level + 1) {
        if (cardInHand.family !== currentMonster.family) {
            alert(`Evoluție respinsă! Nu poți evolua un monstru ${currentMonster.family.toUpperCase()} într-un monstru ${cardInHand.family.toUpperCase()}. Trebuie să fie din aceeași familie!`);
            return;
        }

        document.getElementById('game-message').innerText = `${myUsername} a evoluat monstrul în ${cardInHand.name}!`;
        if (currentField.card) {
            currentField.card = cardInHand;
        } else {
            currentFieldList[0] = cardInHand;
        }
        currentHand.splice(handIndex, 1);
        hasEvolvedThisTurn = true;
        salveazaMutarea();
    } else {
        alert(`Nu poți evolua! Îți trebuie nivelul ${currentMonster.level + 1} din familia ${currentMonster.family.toUpperCase()}.`);
    }
}
// ==========================================
// 6. SISTEMUL DE LUPTĂ REPARAT DEFINITIV & ANIMAȚIE
// ==========================================
function attackEnemy() {
    if (mustDiscard) return;
    if (myRole !== activePlayer) return; 
    if (hasAttackedThisTurn) { alert("Ai atacat deja în această tură!"); return; }
    
    let myFieldList = activePlayer === 1 ? p1Field : p2Field;
    let enemyFieldList = activePlayer === 1 ? p2Field : p1Field;
    
    if (!myFieldList || !enemyFieldList || myFieldList.length === 0 || enemyFieldList.length === 0) return;

    let myInstance = myFieldList[0];
    let enemyInstance = enemyFieldList[0];

    if (!myInstance || !enemyInstance) return;

    let myMonster = myInstance.card ? myInstance.card : myInstance;
    let enemyMonster = enemyInstance.card ? enemyInstance.card : enemyInstance;

    if (!myMonster || myMonster.atk === undefined || !enemyMonster || enemyMonster.atk === undefined) {
        console.error("Eroare la citirea datelor monștrilor!", myMonster, enemyMonster);
        return;
    }

    let myAtk = parseInt(myMonster.atk);
    let enemyAtk = parseInt(enemyMonster.atk);
    let damage = Math.abs(myAtk - enemyAtk);
    
    // --- ANIMAȚIE DE IMPACT (SCUTURARE CARTE) ---
    let enemyFieldId = activePlayer === 1 ? 'p2-field' : 'p1-field';
    let enemyFieldContainer = document.getElementById(enemyFieldId);
    if (enemyFieldContainer) {
        let enemyCardEl = enemyFieldContainer.querySelector('.card');
        if (enemyCardEl) {
            enemyCardEl.style.transition = "transform 0.1s ease";
            enemyCardEl.style.transform = "translate(8px, 8px) scale(1.05)";
            setTimeout(() => { enemyCardEl.style.transform = "translate(-8px, -8px)"; }, 50);
            setTimeout(() => { enemyCardEl.style.transform = "translate(8px, -8px)"; }, 100);
            setTimeout(() => { enemyCardEl.style.transform = "translate(0, 0) scale(1)"; }, 150);
        }
    }

    // --- ANIMAȚIA DE FLASH ROȘU ---
    if (myAtk !== enemyAtk) {
        let flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0'; flash.style.left = '0';
        flash.style.width = '100vw'; flash.style.height = '100vh';
        flash.style.backgroundColor = 'rgba(255, 71, 87, 0.5)'; 
        flash.style.zIndex = '9999';
        flash.style.pointerEvents = 'none';
        flash.style.transition = 'opacity 0.2s ease';
        document.body.appendChild(flash);
        setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 200); }, 80);
    }

    if (myAtk > enemyAtk) {
        if (activePlayer === 1) { p2LP -= damage; } else { p1LP -= damage; }
        document.getElementById('game-message').innerText = `Atac reușit! Jucătorul ${activePlayer === 1 ? 2 : 1} a pierdut ${damage} LP.`;
    } else if (myAtk < enemyAtk) {
        if (activePlayer === 1) { p1LP -= damage; } else { p2LP -= damage; }
        document.getElementById('game-message').innerText = `Atac eșuat! Tu ai pierdut ${damage} LP.`;
    } else {
        document.getElementById('game-message').innerText = "Puncte de atac egale. Monștrii supraviețuiesc fără daune.";
    }
    
    hasAttackedThisTurn = true;
    
    if(document.getElementById('p1-lp')) document.getElementById('p1-lp').innerText = p1LP;
    if(document.getElementById('p2-lp')) document.getElementById('p2-lp').innerText = p2LP;
    
    if (p1LP <= 0 || p2LP <= 0) {
        let winnerName = p1LP <= 0 ? p2Username : p1Username;
        socket.emit('matchFinishedNormal', { roomId: currentRoomId, winnerUsername: winnerName, reason: "puncte de viata" });
    } else {
        salveazaMutarea();
    }
}

socket.on('matchOverByPoints', (data) => {
    alert(`Meciul s-a terminat! Câștigătorul este ${data.winnerUsername} prin reducerea inamicului la 0 ${data.reason}!`);
    intoarceInLobby();
});

function intoarceInLobby() {
    const findGameBtn = document.getElementById('find-game-btn');
    if (findGameBtn) { findGameBtn.disabled = false; findGameBtn.innerText = "Find Game"; }
    const lobbyStatus = document.getElementById('lobby-status');
    if (lobbyStatus) { lobbyStatus.innerText = "Selectează pachetul și apasă pe buton pentru a începe."; }
    
    const gameMsg = document.getElementById('game-message');
    if (gameMsg) gameMsg.innerText = "Pregătire teren de joc...";

    let sidebarEl = document.getElementById('chat-sidebar');
    if (sidebarEl) sidebarEl.classList.remove('open');

    document.getElementById('game-container').style.display = 'none';
    document.getElementById('lobby-container').style.display = 'flex';
}

if (document.getElementById('mulligan-btn')) {
    document.getElementById('mulligan-btn').onclick = () => {
        if (myRole !== activePlayer) return;
        let canIChange = (activePlayer === 1 && p1CanMulligan) || (activePlayer === 2 && p2CanMulligan);
        if (!canIChange) { alert("Ai consumat deja Mulligan-ul!"); return; }
        
        let currentHand = activePlayer === 1 ? p1Hand : p2Hand;
        let currentDeck = activePlayer === 1 ? p1Deck : p2Deck;

        while (currentHand.length > 0) { currentDeck.push(currentHand.pop()); }
        for (let i = currentDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentDeck[i], currentDeck[j]] = [currentDeck[j], currentDeck[i]];
        }
        for (let i = 0; i < 3; i++) { if (currentDeck.length > 0) currentHand.push(currentDeck.pop()); }

        if (activePlayer === 1) p1CanMulligan = false; else p2CanMulligan = false;
        document.getElementById('game-message').innerText = `${myUsername} a folosit Mulligan și a tras o mână nouă!`;
        salveazaMutarea();
    };
}

if (document.getElementById('end-turn-btn')) {
    document.getElementById('end-turn-btn').onclick = () => {
        if (myRole !== activePlayer) { alert("Nu poți termina tura în locul celuilalt jucător!"); return; }
        if (mustDiscard) { alert("Trebuie să decartezi o carte înainte de a termina tura!"); return; }

        if (activePlayer === 1) p1CanMulligan = false; else p2CanMulligan = false;

        let p1Instance = p1Field && p1Field[0] ? p1Field[0] : p1Field;
        let p2Instance = p2Field && p2Field[0] ? p2Field[0] : p2Field;
        let p1Monster = p1Instance && p1Instance.card ? p1Instance.card : p1Instance;
        let p2Monster = p2Instance && p2Instance.card ? p2Instance.card : p2Instance;

        if (activePlayer === 1) {
            if (p2Monster && (p2Monster.lastTargetedBy === 1 || p2Monster.lastTargetedBy === 2)) {
                let orig = monstersDB.find(m => m.id === p2Monster.id);
                if (orig) p2Monster.atk = orig.atk;
                delete p2Monster.lastTargetedBy;
            }
        } else {
            if (p1Monster && (p1Monster.lastTargetedBy === 2 || p1Monster.lastTargetedBy === 1)) {
                let orig = monstersDB.find(m => m.id === p1Monster.id);
                if (orig) p1Monster.atk = orig.atk;
                delete p1Monster.lastTargetedBy;
            }
        }

        hasEvolvedThisTurn = false;
        hasAttackedThisTurn = false;
        activePlayer = activePlayer === 1 ? 2 : 1;
        
        let nextDeck = activePlayer === 1 ? p1Deck : p2Deck;
        let nextHand = activePlayer === 1 ? p1Hand : p2Hand;
        
        if (!nextDeck || nextDeck.length === 0) {
            let winnerName = activePlayer === 1 ? p2Username : p1Username;
            socket.emit('matchFinishedNormal', { roomId: currentRoomId, winnerUsername: winnerName, reason: "carti in pachet" });
            return;
        }
        
        nextHand.push(nextDeck.pop());
        
        if (nextHand.length > 5) {
            mustDiscard = true;
            let currentTurnName = activePlayer === 1 ? p1Username : p2Username;
            document.getElementById('game-message').innerText = `Tura lui ${currentTurnName}! Ai 6 cărți în mână! Trebuie să decartezi una.`;
        } else {
            let currentTurnName = activePlayer === 1 ? p1Username : p2Username;
            document.getElementById('game-message').innerText = `Este tura lui ${currentTurnName}!`;
        }
        
        salveazaMutarea();
    };
}

// --- ANIMAȚIE FLASH VERDE LA HEAL ---
let lastP1LP = 8000;
let lastP2LP = 8000;

socket.on('updateGameState', (serverState) => {
    let aCrescutP1 = myRole === 1 && serverState.p1LP > lastP1LP;
    let aCrescutP2 = myRole === 2 && serverState.p2LP > lastP2LP;

    if (aCrescutP1 || aCrescutP2) {
        let flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0'; flash.style.left = '0';
        flash.style.width = '100vw'; flash.style.height = '100vh';
        flash.style.backgroundColor = 'rgba(46, 213, 115, 0.45)'; 
        flash.style.zIndex = '9999';
        flash.style.pointerEvents = 'none';
        flash.style.transition = 'opacity 0.2s ease';
        document.body.appendChild(flash);
        setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 200); }, 120);
    }

    lastP1LP = serverState.p1LP;
    lastP2LP = serverState.p2LP;
});

// ==========================================
// 7. LOGICA PENTRU HAMBURGER MENU ȘI CHAT REPARATĂ
// ==========================================
if (document.getElementById('chat-hamburger')) {
    document.getElementById('chat-hamburger').onclick = () => {
        let sidebarEl = document.getElementById('chat-sidebar');
        if (sidebarEl) sidebarEl.classList.add('open'); 
        
        // Când se deschide chat-ul, eliminăm notificarea roșie
        let badgeEl = document.getElementById('chat-badge');
        if (badgeEl) badgeEl.style.display = 'none';
    };
}

if (document.getElementById('chat-close')) {
    document.getElementById('chat-close').onclick = () => {
        let sidebarEl = document.getElementById('chat-sidebar');
        if (sidebarEl) sidebarEl.classList.remove('open'); 
    };
}

if (document.getElementById('chat-send-btn')) {
    document.getElementById('chat-send-btn').onclick = trimiteMesajChat;
}

if (document.getElementById('chat-message-input')) {
    document.getElementById('chat-message-input').onkeydown = (e) => { 
        if (e.key === 'Enter') trimiteMesajChat(); 
    };
}

function trimiteMesajChat() {
    let inputEl = document.getElementById('chat-message-input');
    if (!inputEl) return;
    let text = inputEl.value.trim();
    if (text === "") return;
    socket.emit('sendChatMessage', { roomId: currentRoomId, username: myUsername, text: text });
    inputEl.value = "";
}

// =========================================================================
// SECȚIUNEA 4.1: SISTEMUL DE LUPTĂ REPARAT DEFINITIV & ANIMAȚIE IMPACT
// =========================================================================
function attackEnemy() {
    if (mustDiscard) return;
    if (myRole !== activePlayer) return; 
    if (hasAttackedThisTurn) { alert("Ai atacat deja în această tură!"); return; }
    
    let myFieldList = activePlayer === 1 ? p1Field : p2Field;
    let enemyFieldList = activePlayer === 1 ? p2Field : p1Field;
    
    if (!myFieldList || !enemyFieldList || myFieldList.length === 0 || enemyFieldList.length === 0) return;

    let myInstance = myFieldList;
    let enemyInstance = enemyFieldList;

    if (!myInstance || !enemyInstance) return;

    let myMonster = myInstance.card ? myInstance.card : myInstance;
    let enemyMonster = enemyInstance.card ? enemyInstance.card : enemyInstance;

    if (!myMonster || myMonster.atk === undefined || !enemyMonster || enemyMonster.atk === undefined) {
        console.error("Eroare la citirea datelor monștrilor!", myMonster, enemyMonster);
        return;
    }

    let myAtk = parseInt(myMonster.atk);
    let enemyAtk = parseInt(enemyMonster.atk);
    let damage = Math.abs(myAtk - enemyAtk);
    
    // --- ANIMAȚIE DE IMPACT (SCUTURARE CARTE) ---
    let enemyFieldId = activePlayer === 1 ? 'p2-field' : 'p1-field';
    let enemyFieldContainer = document.getElementById(enemyFieldId);
    if (enemyFieldContainer) {
        let enemyCardEl = enemyFieldContainer.querySelector('.card');
        if (enemyCardEl) {
            enemyCardEl.style.transition = "transform 0.1s ease";
            enemyCardEl.style.transform = "translate(8px, 8px) scale(1.05)";
            setTimeout(() => { enemyCardEl.style.transform = "translate(-8px, -8px)"; }, 50);
            setTimeout(() => { enemyCardEl.style.transform = "translate(8px, -8px)"; }, 100);
            setTimeout(() => { enemyCardEl.style.transform = "translate(0, 0) scale(1)"; }, 150);
        }
    }

    // --- ANIMAȚIA DE FLASH ROȘU ---
    if (myAtk !== enemyAtk) {
        let flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0'; flash.style.left = '0';
        flash.style.width = '100vw'; flash.style.height = '100vh';
        flash.style.backgroundColor = 'rgba(255, 71, 87, 0.5)'; 
        flash.style.zIndex = '9999';
        flash.style.pointerEvents = 'none';
        flash.style.transition = 'opacity 0.2s ease';
        document.body.appendChild(flash);
        setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 200); }, 80);
    }

    if (myAtk > enemyAtk) {
        if (activePlayer === 1) { p2LP -= damage; } else { p1LP -= damage; }
        document.getElementById('game-message').innerText = `Atac reușit! Jucătorul ${activePlayer === 1 ? 2 : 1} a pierdut ${damage} LP.`;
    } else if (myAtk < enemyAtk) {
        if (activePlayer === 1) { p1LP -= damage; } else { p2LP -= damage; }
        document.getElementById('game-message').innerText = `Atac eșuat! Tu ai pierdut ${damage} LP.`;
    } else {
        document.getElementById('game-message').innerText = "Puncte de atac egale. Monștrii supraviețuiesc fără daune.";
    }
    
    hasAttackedThisTurn = true;
    
    if(document.getElementById('p1-lp')) document.getElementById('p1-lp').innerText = p1LP;
    if(document.getElementById('p2-lp')) document.getElementById('p2-lp').innerText = p2LP;
    
    if (p1LP <= 0 || p2LP <= 0) {
        let winnerName = p1LP <= 0 ? p2Username : p1Username;
        socket.emit('matchFinishedNormal', { roomId: currentRoomId, winnerUsername: winnerName, reason: "puncte de viata" });
    } else {
        salveazaMutarea();
    }
}

socket.on('matchOverByPoints', (data) => {
    alert(`Meciul s-a terminat! Câștigătorul este ${data.winnerUsername} prin reducerea inamicului la 0 ${data.reason}!`);
    intoarceInLobby();
});
// =========================================================================
// SECȚIUNEA 4.2: REVENIRE LOBBY, MULLIGAN, END TURN ȘI ANIMAȚIE DE HEAL
// =========================================================================
function intoarceInLobby() {
    const findGameBtn = document.getElementById('find-game-btn');
    if (findGameBtn) { findGameBtn.disabled = false; findGameBtn.innerText = "Find Game"; }
    const lobbyStatus = document.getElementById('lobby-status');
    if (lobbyStatus) { lobbyStatus.innerText = "Selectează pachetul și apasă pe buton pentru a începe."; }
    
    const gameMsg = document.getElementById('game-message');
    if (gameMsg) gameMsg.innerText = "Pregătire teren de joc...";

    let sidebarEl = document.getElementById('chat-sidebar');
    if (sidebarEl) sidebarEl.classList.remove('open');

    document.getElementById('game-container').style.display = 'none';
    document.getElementById('lobby-container').style.display = 'flex';
}

if (document.getElementById('mulligan-btn')) {
    document.getElementById('mulligan-btn').onclick = () => {
        if (myRole !== activePlayer) return;
        let canIChange = (activePlayer === 1 && p1CanMulligan) || (activePlayer === 2 && p2CanMulligan);
        if (!canIChange) { alert("Ai consumat deja Mulligan-ul!"); return; }
        
        let currentHand = activePlayer === 1 ? p1Hand : p2Hand;
        let currentDeck = activePlayer === 1 ? p1Deck : p2Deck;

        while (currentHand.length > 0) { currentDeck.push(currentHand.pop()); }
        for (let i = currentDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentDeck[i], currentDeck[j]] = [currentDeck[j], currentDeck[i]];
        }
        for (let i = 0; i < 3; i++) { if (currentDeck.length > 0) currentHand.push(currentDeck.pop()); }

        if (activePlayer === 1) p1CanMulligan = false; else p2CanMulligan = false;
        document.getElementById('game-message').innerText = `${myUsername} a folosit Mulligan și a tras o mână nouă!`;
        salveazaMutarea();
    };
}

if (document.getElementById('end-turn-btn')) {
    document.getElementById('end-turn-btn').onclick = () => {
        if (myRole !== activePlayer) { alert("Nu poți termina tura în locul celuilalt jucător!"); return; }
        if (mustDiscard) { alert("Trebuie să decartezi o carte înainte de a termina tura!"); return; }

        if (activePlayer === 1) p1CanMulligan = false; else p2CanMulligan = false;

        let p1Instance = p1Field && p1Field ? p1Field : p1Field;
        let p2Instance = p2Field && p2Field ? p2Field : p2Field;
        let p1Monster = p1Instance && p1Instance.card ? p1Instance.card : p1Instance;
        let p2Monster = p2Instance && p2Instance.card ? p2Instance.card : p2Instance;

        if (activePlayer === 1) {
            if (p2Monster && (p2Monster.lastTargetedBy === 1 || p2Monster.lastTargetedBy === 2)) {
                let orig = monstersDB.find(m => m.id === p2Monster.id);
                if (orig) p2Monster.atk = orig.atk;
                delete p2Monster.lastTargetedBy;
            }
        } else {
            if (p1Monster && (p1Monster.lastTargetedBy === 2 || p1Monster.lastTargetedBy === 1)) {
                let orig = monstersDB.find(m => m.id === p1Monster.id);
                if (orig) p1Monster.atk = orig.atk;
                delete p1Monster.lastTargetedBy;
            }
        }

        hasEvolvedThisTurn = false;
        hasAttackedThisTurn = false;
        activePlayer = activePlayer === 1 ? 2 : 1;
        
        let nextDeck = activePlayer === 1 ? p1Deck : p2Deck;
        let nextHand = activePlayer === 1 ? p1Hand : p2Hand;
        
        if (!nextDeck || nextDeck.length === 0) {
            let winnerName = activePlayer === 1 ? p2Username : p1Username;
            socket.emit('matchFinishedNormal', { roomId: currentRoomId, winnerUsername: winnerName, reason: "carti in pachet" });
            return;
        }
        
        nextHand.push(nextDeck.pop());
        
        if (nextHand.length > 5) {
            mustDiscard = true;
            let currentTurnName = activePlayer === 1 ? p1Username : p2Username;
            document.getElementById('game-message').innerText = `Tura lui ${currentTurnName}! Ai 6 cărți în mână! Trebuie să decartezi una.`;
        } else {
            let currentTurnName = activePlayer === 1 ? p1Username : p2Username;
            document.getElementById('game-message').innerText = `Este tura lui ${currentTurnName}!`;
        }
        
        salveazaMutarea();
    };
}

// --- DETECTARE HEAL & ANIMAȚIE FLASH VERDE ---
let lastP1LP = 8000;
let lastP2LP = 8000;

socket.on('updateGameState', (serverState) => {
    let aCrescutP1 = myRole === 1 && serverState.p1LP > lastP1LP;
    let aCrescutP2 = myRole === 2 && serverState.p2LP > lastP2LP;

    if (aCrescutP1 || aCrescutP2) {
        let flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0'; flash.style.left = '0';
        flash.style.width = '100vw'; flash.style.height = '100vh';
        flash.style.backgroundColor = 'rgba(46, 213, 115, 0.45)'; 
        flash.style.zIndex = '9999';
        flash.style.pointerEvents = 'none';
        flash.style.transition = 'opacity 0.2s ease';
        document.body.appendChild(flash);
        setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 200); }, 120);
    }

    lastP1LP = serverState.p1LP;
    lastP2LP = serverState.p2LP;
});
// =========================================================================
// SECȚIUNEA 4.3: HAMBURGER MENU, CHAT CU NOTIFICARE, ABANDON ȘI TOP 10
// =========================================================================

if (document.getElementById('chat-hamburger')) {
    document.getElementById('chat-hamburger').onclick = () => {
        let sidebarEl = document.getElementById('chat-sidebar');
        if (sidebarEl) sidebarEl.classList.add('open'); 
        
        // Când se deschide chat-ul, eliminăm notificarea roșie
        let badgeEl = document.getElementById('chat-badge');
        if (badgeEl) badgeEl.style.display = 'none';
    };
}

if (document.getElementById('chat-close')) {
    document.getElementById('chat-close').onclick = () => {
        let sidebarEl = document.getElementById('chat-sidebar');
        if (sidebarEl) sidebarEl.classList.remove('open'); 
    };
}

if (document.getElementById('chat-send-btn')) {
    document.getElementById('chat-send-btn').onclick = trimiteMesajChat;
}

if (document.getElementById('chat-message-input')) {
    document.getElementById('chat-message-input').onkeydown = (e) => { 
        if (e.key === 'Enter') trimiteMesajChat(); 
    };
}

function trimiteMesajChat() {
    let inputEl = document.getElementById('chat-message-input');
    if (!inputEl) return;
    let text = inputEl.value.trim();
    if (text === "") return;
    socket.emit('sendChatMessage', { roomId: currentRoomId, username: myUsername, text: text });
    inputEl.value = "";
}

socket.on('receiveChatMessage', (data) => {
    const msgEl = document.createElement('div');
    msgEl.className = data.username === myUsername ? 'chat-msg me' : 'chat-msg';
    msgEl.innerHTML = `<b>${data.username}:</b> ${data.text}`;
    let messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        messagesContainer.appendChild(msgEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Dacă chat-ul este închis și mesajul vine de la adversar, aprindem punctul roșu
    let sidebarEl = document.getElementById('chat-sidebar');
    let esteChatInchis = sidebarEl && !sidebarEl.classList.contains('open');
    if (data.username !== myUsername && esteChatInchis) {
        let badgeEl = document.getElementById('chat-badge');
        if (badgeEl) badgeEl.style.display = 'inline-block';
    }
});

if (document.getElementById('go-lobby-btn')) {
    document.getElementById('go-lobby-btn').onclick = () => {
        if (myRole !== 1 && myRole !== 2) { alert("Spectatorii nu pot abandona meciul!"); return; }
        let confirmare = confirm("Sigur vrei să te întorci în Lobby? Vei pierde meciul automat prin abandon!");
        if (confirmare) { 
            document.getElementById('go-lobby-btn').disabled = true;
            socket.emit('playerSurrender', { roomId: currentRoomId, role: myRole }); 
        }
    };
}

socket.on('matchOverBySurrender', (data) => {
    let pierzator = data.abandonedRole === 1 ? p1Username : p2Username;
    let castigator = data.winnerRole === 1 ? p1Username : p2Username;
    alert(`${pierzator} a părăsit meciul! Câștigătorul este ${castigator} prin abandon!`);
    if (document.getElementById('go-lobby-btn')) document.getElementById('go-lobby-btn').disabled = false;
    intoarceInLobby();
});

socket.on('updateLeaderboard', (top10List) => {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (top10List.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:10px; color:#888;">Niciun jucător înregistrat încă.</td></tr>`;
        return;
    }
    top10List.forEach((player, index) => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #333';
        let rankColor = '#fff';
        if (index === 0) rankColor = '#f1c40f';
        if (index === 1) rankColor = '#d2dae2';
        if (index === 2) rankColor = '#cd7f32';
        row.innerHTML = `
            <td style="padding: 6px; font-weight: bold; color: ${rankColor};">#${index + 1}</td>
            <td style="padding: 6px; color: ${player.username === myUsername ? '#2ed573' : '#fff'}; font-weight: ${player.username === myUsername ? 'bold' : 'normal'};">
                ${player.username} ${player.username === myUsername ? '(Tu)' : ''}
            </td>
            <td style="padding: 6px; text-align: right; font-weight: bold; color: #ff9f43;">${player.wins}</td>
        `;
        tbody.appendChild(row);
    });
});

// Inițializare globală și pornire interfață
updateUI();
