const firebaseConfig = {
    apiKey: "AIzaSyCXb4TRE4HcIRjqv5DqvYIr0jxgEuvnhPw",
    authDomain: "sistema-shield.firebaseapp.com",
    projectId: "sistema-shield",
    storageBucket: "sistema-shield.firebasestorage.app",
    messagingSenderId: "1041018025450",
    appId: "1:1041018025450:web:a03a48413628a5f3e96e93"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    ['missions', 'docs', 'agents'].forEach(c => {
        startSync(c);
        updateCounter(c);
    });

    setTimeout(() => {
        const intro = document.getElementById('intro-overlay');
        if (intro) { intro.style.opacity = '0'; setTimeout(() => intro.style.display = 'none', 1000); }
    }, 2000);
});

function updateCounter(coll) {
    db.collection(coll).onSnapshot(snap => {
        const el = document.getElementById(`count-${coll}`);
        if (el) el.innerText = snap.size;
    });
}

function startSync(coll) {
    db.collection(coll).orderBy("timestamp", "desc").onSnapshot(snap => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderContent(coll, data);
    });
}

async function saveData(coll, data) {
    await db.collection(coll).add({ ...data, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
}

async function updateMissionStatus(id, status) {
    await db.collection('missions').doc(id).update({ status });
}

async function deleteItem(coll, id) {
    if(confirm("Confirmar exclusão?")) await db.collection(coll).doc(id).delete();
}

// SALVAR
function saveMission() {
    const title = document.getElementById('m-title').value;
    const desc = document.getElementById('m-desc').value;
    const status = document.getElementById('m-status').value;
    if(!title) return;
    saveData('missions', { title, desc, status });
    closeModal('mission-modal');
}

function saveDoc() {
    const title = document.getElementById('d-title').value;
    const desc = document.getElementById('d-desc').value;
    if(!title) return;
    saveData('docs', { title, desc });
    closeModal('doc-modal');
}

function saveAgent() {
    const name = document.getElementById('a-name').value;
    const file = document.getElementById('a-image').files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
        saveData('agents', { name, image: reader.result });
        closeModal('agent-modal');
    };
    reader.readAsDataURL(file);
}

// RENDERIZAR
function renderContent(coll, data) {
    const cont = document.getElementById(`${coll}-container`);
    if(!cont) return;

    cont.innerHTML = data.map(item => {
        if(coll === 'missions') {
            let col = item.status === 'concluida' ? "#00ff88" : (item.status === 'fracassada' ? "#ff4444" : "#00d4ff");
            return `<div class="card" style="border-left: 4px solid ${col}">
                <small style="color: ${col}">${item.status.toUpperCase()}</small>
                <h3>${item.title}</h3>
                <p>${item.desc}</p>
                <div style="margin-top: 15px; display: flex; gap: 5px;">
                    <button onclick="updateMissionStatus('${item.id}', 'concluida')" style="background:#030; color:#0f0; border:1px solid #0f0; font-size:10px; cursor:pointer;">OK</button>
                    <button onclick="updateMissionStatus('${item.id}', 'fracassada')" style="background:#300; color:#f00; border:1px solid #f00; font-size:10px; cursor:pointer;">FAIL</button>
                    <button onclick="deleteItem('missions', '${item.id}')" style="background:none; color:#555; border:none; margin-left:auto; cursor:pointer;">[X]</button>
                </div>
            </div>`;
        }
        if(coll === 'docs') {
            return `<div class="card">
                <h3 style="color:var(--accent)">${item.title}</h3>
                <p style="font-size:12px; opacity:0.7;">${item.desc}</p>
                <button onclick="deleteItem('docs', '${item.id}')" style="background:none; color:var(--danger); border:none; margin-top:10px; cursor:pointer;">ELIMINAR</button>
            </div>`;
        }
        if(coll === 'agents') {
            return `<div class="card" style="text-align:center;">
                <img src="${item.image}" style="width:100%; height:150px; object-fit:cover; filter: grayscale(1);">
                <h3 style="margin-top:10px;">${item.name}</h3>
                <button onclick="deleteItem('agents', '${item.id}')" style="background:none; color:#444; border:none; cursor:pointer;">DELETAR</button>
            </div>`;
        }
    }).join('');
}

function switchPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
