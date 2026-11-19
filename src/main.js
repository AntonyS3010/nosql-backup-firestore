import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy, serverTimestamp, connectFirestoreEmulator } from 'firebase/firestore';
import './style.css';

const form = document.querySelector('#task-form');
const input = document.querySelector('#title');
const add = document.querySelector('#add');
const status = document.querySelector('#status');
const list = document.querySelector('#tasks');
const empty = document.querySelector('#empty');
const counter = document.querySelector('#counter');
let tasks;

function message(text, error = false) {
  status.textContent = text;
  status.classList.toggle('error', error);
}

async function mutate(button, action) {
  button.disabled = true;
  try { await action(); message('Cambios guardados.'); }
  catch { message('No se pudo guardar. Comprueba tu conexión e inténtalo de nuevo.', true); }
  finally { if (button.isConnected) button.disabled = false; }
}

function render(snapshot) {
  list.replaceChildren();
  let pending = 0;
  snapshot.forEach(task => {
    const data = task.data();
    if (!data.completed) pending++;
    const row = document.createElement('li');
    row.className = `task${data.completed ? ' done' : ''}`;
    const toggle = document.createElement('button');
    toggle.type = 'button'; toggle.className = 'toggle';
    toggle.setAttribute('aria-label', `${data.completed ? 'Reabrir' : 'Completar'}: ${data.title}`);
    toggle.setAttribute('aria-pressed', String(data.completed));
    toggle.textContent = data.completed ? '✓' : '';
    toggle.addEventListener('click', () => mutate(toggle, () => updateDoc(task.ref, { completed: !data.completed })));
    const title = document.createElement('span');
    title.className = 'task-title'; title.textContent = data.title;
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'remove'; remove.textContent = 'Eliminar';
    remove.setAttribute('aria-label', `Eliminar: ${data.title}`);
    remove.addEventListener('click', () => mutate(remove, () => deleteDoc(task.ref)));
    row.append(toggle, title, remove); list.append(row);
  });
  counter.textContent = `${pending} ${pending === 1 ? 'pendiente' : 'pendientes'}`;
  empty.hidden = !snapshot.empty;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title || title.length > 100 || !tasks || add.disabled) return;
  await mutate(add, async () => {
    await addDoc(tasks, { title, completed: false, createdAt: serverTimestamp() });
    input.value = ''; input.focus();
  });
});

async function start() {
  const local = import.meta.env.VITE_USE_EMULATORS === 'true';
  let config;
  if (local) config = { projectId: 'demo-bitacora-nosql', apiKey: 'demo-key', authDomain: 'localhost' };
  else {
    const response = await fetch('/__/firebase/init.json');
    if (!response.ok) throw new Error('Firebase Hosting no configurado');
    config = await response.json();
  }
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (local) {
    connectAuthEmulator(auth, 'http://127.0.0.1:19098', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 18081);
  }
  const { user } = await signInAnonymously(auth);
  tasks = collection(db, 'users', user.uid, 'tasks');
  onSnapshot(query(tasks, orderBy('createdAt', 'desc')), snapshot => {
    render(snapshot); add.disabled = false; message('Tu espacio está conectado.');
  }, () => { add.disabled = true; message('No se pudieron cargar tus tareas. Recarga la página para reconectar.', true); });
}
start().catch(() => message('No se pudo conectar con Firebase. Recarga la página o revisa la configuración del proyecto.', true));
