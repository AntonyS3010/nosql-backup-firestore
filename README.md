# Estrategia de respaldo NoSQL de Campus Tareas

**Equipo:** Antony Piero Solorzano Zegarra y Adriana Rafaela Laos Gonzales.

Herramienta independiente de respaldo lógico cifrado de los documentos de tareas en Cloud Firestore. No modifica la app existente ni sus reglas.

- [Aplicación pública existente](https://antonys3010.github.io/campus-tareas-nosql/)
- [Repositorio público de la app](https://github.com/AntonyS3010/campus-tareas-nosql)
- [Despliegue automatizado de la app](https://github.com/AntonyS3010/campus-tareas-nosql/actions/workflows/deploy.yml)
- [Estrategia, retención, custodia y recuperación](BACKUP_STRATEGY.md)
- [Herramienta](scripts/backup.mjs)
- [Ensayo reproducible](tests/backup.test.mjs)

## Ensayar

Requisitos: Node.js 24, Java 21 y Firebase CLI 15.36.0.

```sh
npm install --global firebase-tools@15.36.0
firebase emulators:exec --only firestore --project demo-backup-ci 'node --test tests/backup.test.mjs'
```

El ensayo genera una clave efímera y datos ficticios; no accede a producción. Comprueba cifrado, simulación sin escrituras, recuperación exacta, destino no vacío, origen igual y alteración del archivo.

## Automatizar respaldo real

`backup.yml` requiere configurar un entorno `backups`, la variable `FIREBASE_PROJECT_ID`, el secreto `FIRESTORE_BACKUP_SERVICE_ACCOUNT` con lectura del proyecto dedicado y el secreto `BACKUP_KEY` de 32 bytes aleatorios en Base64. No incluir credenciales ni respaldos descifrados en Git.

La programación queda omitida hasta configurar la variable. Su existencia no acredita ejecución real. Configurar estos accesos requiere autorización del titular. La restauración implementada solo permite un emulador y un destino demo separado: no sobrescribe producción.

## Estado

Aplicación y despliegue existentes enlazados arriba. Ensayo local aprobado. El respaldo diario de producción, la nueva publicación de artículos y el video específico de backup aún requieren configuración/publicación. No se afirman como completados.
