/** * SHIELD OS - MAIN ENGINE
 * VERSION: 4.0.2
 * DATABASE: FIREBASE FIRESTORE
 */

const firebaseConfig = {
    apiKey: "AIzaSyCXb4TRE4HcIRjqv5DqvYIr0jxgEuvnhPw",
    authDomain: "sistema-shield.firebaseapp.com",
    projectId: "sistema-shield",
    storageBucket: "sistema-shield.firebasestorage.app",
    messagingSenderId: "1041018025450",
    appId: "1:1041018025450:web:a03a48413628a5f3e96e93"
};

// Initialize Security Layers
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ---------------------------------------------------------
// CORE INITIALIZATION
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    console.log("SHIELD ENGINE: ONLINE");
    
    const modules = ['missions', 'docs', 'agents'];
    modules.forEach(mod => {
        initSyncStream(mod);
        syncCounters(mod);
    });

    // Boot Sequence
    setTimeout(() => {
        document.querySelector('.ambient-glow').style.opacity = '1';
    }, 1000);
});

// ---------------------------------------------------------
// DATA STREAMS (FIREBASE)
// ---------------------------------------------------------
function initSyncStream(collection) {
    db.collection(collection).orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
          const data = snapshot.docs.map(doc => ({ 
              id: doc.id, 
              ...doc.data() 
          }));
          renderInterface(collection, data);
      });
}

function syncCounters(collection) {
    db.collection(collection).onSnapshot(snapshot => {
        const el = document.getElementById(`count-${collection}`);
        if (el) animateNumber(el, snapshot.size);
    });
}

function animateNumber(element, target) {
    let current = parseInt(element.innerText) || 0;
    const step = target > current ? 1 : -1;
    if (current === target) return;

    const timer = setInterval(() => {
        current += step;
        element.innerText = current;
        if (current === target) clearInterval(timer);
    }, 50);
}

// ---------------------------------------------------------
// INTERFACE ENGINE
// ---------------------------------------------------------
function renderInterface(collection, data) {
    const container = document.getElementById(`${collection}-container`);
    if (!container) return;

    container.innerHTML = data.map(item => {
        if (collection === 'missions') {
            const statusColor = item.status === 'concluida' ? '#00ffaa' : (item.status === 'fracassada' ? '#ff0055' : '#00e5ff');
            return `
            <div class="card-v2">
                <div style="font-family: Orbitron; font-size: 8px; color: ${statusColor}; margin-bottom: 10px;">
                    // STATUS: ${item.status.toUpperCase()}
                </div>
                <h3 style="margin-bottom: 10px; font-weight: 500;">${item.title}</h3>
                <p style="font-size: 13px; color: #888; margin-bottom: 20px; line-height: 1.6;">${item.desc}</p>
                <div style="display: flex; gap: 10px;">
                    <button class="nav-link" style="height: 35px; width: 100px; padding: 0; justify-content: center; background: rgba(0,255,170,0.1); color: #00ffaa;" 
                        onclick="updateStatus('${item.id}', 'concluida')">CLEAR</button>
                    <button class="nav-link" style="height: 35px; width: 100px; padding: 0; justify-content: center; background: rgba(255,0,85,0.1); color: #ff0055;" 
                        onclick="updateStatus('${item.id}', 'fracassada')">ABORT</button>
                    <button onclick="deleteRecord('${collection}', '${item.id}')" style="background: none; border: none; color: #333; cursor: pointer; margin-left: auto;">[X]</button>
                </div>
            </div>`;
        }
        
        if (collection === 'docs') {
            return `
            <div class="card-v2">
                <div class="logo-spinner" style="width: 30px; height: 30px; margin-bottom: 10px;">
                    <div class="ring" style="border-width: 1px;"></div>
                </div>
                <h3 style="color: var(--primary);">${item.title}</h3>
                <p style="font-size: 12px; margin: 10px 0;">${item.desc}</p>
                <button onclick="deleteRecord('docs', '${item.id}')" style="color: var(--danger); background: none; border: none; font-size: 10px; cursor: pointer;">DELETE_FILE</button>
            </div>`;
        }

        if (collection === 'agents') {
            return `
            <div class="card-v2" style="text-align: center;">
                <img src="${item.image}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary); margin-bottom: 15px; filter: grayscale(1);">
                <h3 style="font-family: Orbitron; font-size: 14px;">${item.name}</h3>
                <button onclick="deleteRecord('agents', '${item.id}')" style="margin-top: 15px; background: none; border: 1px solid #222; color: #555; padding: 5px 15px; font-size: 9px; cursor: pointer;">REVOKE_ACCESS</button>
            </div>`;
        }
    }).join('');
}

// ---------------------------------------------------------
// ACTIONS & COMMANDS
// ---------------------------------------------------------
async function saveMission() {
    const title = document.getElementById('m-title').value;
    const desc = document.getElementById('m-desc').value;
    const status = document.getElementById('m-status').value;
    if (!title) return;

    await db.collection('missions').add({
        title, desc, status,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal('mission-modal');
}

async function updateStatus(id, status) {
    await db.collection('missions').doc(id).update({ status });
}

async function deleteRecord(coll, id) {
    if(confirm("PERMANENT DELETE?")) await db.collection(coll).doc(id).delete();
}

// NAVIGATION ENGINE
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    event.currentTarget.classList.add('active');
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
