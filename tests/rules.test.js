import { before, after, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

let env;
const path = 'users/antony/tasks/primera';
const payload = () => ({ title: 'Publicar la app', completed: false, createdAt: serverTimestamp() });
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-bitacora-nosql', firestore: {
    host: '127.0.0.1', port: 18081, rules: await readFile('firestore.rules', 'utf8')
  } });
});
beforeEach(async () => env.clearFirestore());
after(async () => env?.cleanup());
test('El propietario crea, lista, completa y elimina su documento', async () => {
  const db = env.authenticatedContext('antony').firestore();
  await assertSucceeds(setDoc(doc(db, path), payload()));
  await assertSucceeds(getDocs(collection(db, 'users/antony/tasks')));
  await assertSucceeds(updateDoc(doc(db, path), { completed: true }));
  await assertSucceeds(deleteDoc(doc(db, path)));
});
test('Otra identidad no lee ni modifica las tareas del propietario', async () => {
  const owner = env.authenticatedContext('antony').firestore();
  await setDoc(doc(owner, path), payload());
  const other = env.authenticatedContext('adriana').firestore();
  await assertFails(getDoc(doc(other, path)));
  await assertFails(getDocs(collection(other, 'users/antony/tasks')));
  await assertFails(updateDoc(doc(other, path), { completed: true }));
  await assertFails(deleteDoc(doc(other, path)));
  await assertFails(setDoc(doc(other, 'users/antony/tasks/otra'), payload()));
});
test('Un visitante sin autenticar no puede leer ni escribir', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, path)));
  await assertFails(setDoc(doc(db, path), payload()));
});
test('Se rechazan campos adicionales, tipos incorrectos y títulos inválidos', async () => {
  const db = env.authenticatedContext('antony').firestore();
  for (const change of [{title:''},{title:'   '},{title:'x'.repeat(101)},{title:123},{completed:'sí'},{admin:true}]) {
    await assertFails(setDoc(doc(db, path), {...payload(), ...change}));
  }
});
test('La fecha de creación la determina el servidor y no puede alterarse', async () => {
  const db = env.authenticatedContext('antony').firestore();
  await assertFails(setDoc(doc(db, path), {...payload(), createdAt: Timestamp.fromMillis(0)}));
  await setDoc(doc(db, path), payload());
  await assertFails(updateDoc(doc(db, path), {createdAt: serverTimestamp()}));
  await assertFails(updateDoc(doc(db, path), {title:'Otro título'}));
});
