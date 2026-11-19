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

## Resultados verificados — 19 de noviembre de 2026

- [Respaldo real ejecutado correctamente](https://github.com/AntonyS3010/nosql-backup-firestore/actions/runs/44604077581): 0 tareas en el origen al consultar; artefacto cifrado de 434 bytes.
- Se descargó ese artefacto, se descifró y se comprobó en otro proyecto del emulador: 0 documentos, SHA-256 coincidente. Una copia vacía no demuestra recuperación de datos no vacíos.
- [Ensayo automático con datos ficticios aprobado](https://github.com/AntonyS3010/nosql-backup-firestore/actions/runs/44604023972): una tarea recuperada exactamente, corrupción y destinos inválidos rechazados.
- La cuenta lectora y los dos secretos del repositorio están configurados. Se usa OAuth de la cuenta de servicio sin impersonación ni permisos de escritura. La programación diaria está configurada; esta evidencia corresponde a una ejecución manual, no a una ejecución del cron.

La publicación de los nuevos artículos y del video específico de backup se gestiona por separado.
