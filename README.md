# Bitácora NoSQL: Backup Strategy

Aplicación web en español para crear, listar, completar y eliminar tareas. Cada sesión anónima tiene su propia colección de documentos en **Cloud Firestore Standard**, una base NoSQL documental. La interfaz utiliza JavaScript, Vite y el SDK modular de Firebase; el alojamiento previsto es Firebase Hosting.

Integrantes:

- Antony Piero Solorzano Zegarra.
- Adriana Rafaela Laos Gonzales.

## Modelo y acceso

Ruta: `users/{uid}/tasks/{taskId}`.

```json
{"title":"Preparar el artículo","completed":false,"createdAt":"timestamp del servidor"}
```

Firebase Authentication asigna una identidad anónima persistida en el navegador. Firestore Rules exige que el UID coincida con la ruta, valida los tres campos y limita las actualizaciones al estado `completed`. No se utiliza Redis, MongoDB, Neo4j ni Prometheus. La configuración pública del SDK se obtiene del endpoint reservado de Firebase Hosting `/__/firebase/init.json`; las credenciales administrativas nunca forman parte del cliente.

La sesión no se comparte entre dispositivos. Borrar los datos del navegador hace perder acceso a sus tareas. La aplicación es una demostración académica; no tiene recuperación de cuenta ni colaboración entre usuarios.

## Ejecutar y comprobar localmente

Requisitos: Node.js 24, pnpm 11.25.0 y Java 21.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

Las cinco pruebas se ejecutan contra Firestore Emulator con el proyecto ficticio `demo-bitacora-nosql`. No escriben en una base de producción. Cubren CRUD del propietario, aislamiento entre usuarios, rechazo de usuarios sin autenticar, validación del documento e inmutabilidad de la fecha.

Para probar la interfaz sin usar una cuenta de nube:

```sh
pnpm exec firebase emulators:start --only auth,firestore --project demo-bitacora-nosql
# En otro terminal:
VITE_USE_EMULATORS=true pnpm dev
```

Abrir la URL local que muestra Vite. Las tareas de esa ejecución viven en el emulador, no en la nube. La variable de emulación debe estar ausente al compilar para producción.

## Configuración inicial de la nube

1. Crear un proyecto nuevo de Firebase en el plan gratuito Spark, sin vincular facturación.
2. Crear Firestore **Standard**, en modo nativo, y elegir su ubicación antes de confirmar.
3. Habilitar el proveedor **Anónimo** en Authentication.
4. Publicar el contenido de `firestore.rules` en la pestaña Rules de Firestore. La base no debe quedar en modo de pruebas con acceso abierto.
5. Registrar una app web en el proyecto y habilitar Firebase Hosting.
6. Crear una cuenta de servicio de despliegue limitada a **Firebase Hosting Admin** para este proyecto. Guardar su JSON únicamente en el secreto de Actions `FIREBASE_SERVICE_ACCOUNT`; no subirlo al repositorio. Configurar la variable de Actions `FIREBASE_PROJECT_ID` con el ID real.
7. Subir el código a un repositorio público y ejecutar el workflow. Cada push a `main` vuelve a probar las reglas, compilar y publicar el mismo artefacto compilado en el canal `live`.

Los PR ejecutan comprobaciones y generan un artefacto, sin desplegar. El workflow no crea proyectos, no habilita facturación y no modifica las reglas de producción; cualquier cambio de reglas requiere publicar su versión comprobada en la consola. Las cuotas del plan gratuito y los requisitos de acceso del proveedor siguen vigentes.

## Entrega y comprobación

Los enlaces definitivos de repositorio, aplicación, ejecución automática, artículos y video se registrarán cuando estén publicados y comprobados. El código y los artículos preparados no constituyen por sí solos una publicación en la nube.

Fuentes oficiales:

- [Firestore: inicio](https://firebase.google.com/docs/firestore/quickstart).
- [Autenticación anónima](https://firebase.google.com/docs/auth/web/anonymous-auth).
- [Firebase Hosting y GitHub](https://firebase.google.com/docs/hosting/github-integration).
- [Configuración mediante URLs reservadas](https://firebase.google.com/docs/hosting/reserved-urls?hl=es-419).
- [Planes de Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).

## Respaldo y recuperación

La estrategia, los comandos, la custodia de claves y las limitaciones están en [BACKUP_STRATEGY.md](BACKUP_STRATEGY.md). El script está en `scripts/backup.mjs`; su ensayo se integra en CI. Repositorio público: https://github.com/AntonyS3010/nosql-backup-firestore
