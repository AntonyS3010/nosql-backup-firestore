# Estrategia de respaldo de Campus Tareas

Equipo: Antony Piero Solorzano Zegarra y Adriana Rafaela Laos Gonzales.

## Alcance

Respaldo lógico de los documentos `users/{uid}/tasks/{id}` en Firestore Standard. Conserva campos tipados e identificadores; no respalda Authentication, reglas, índices, TTL ni configuraciones del proyecto. Las reglas y la infraestructura declarada permanecen en Git. No es una exportación administrada ni PITR.

La herramienta admite hasta 1000 documentos. Consulta 1001 y falla si excede el límite: no presenta una copia truncada como completa. Es una solución educativa para una app pequeña, no un reemplazo general de las funciones administradas de Firestore.

## Frecuencia, retención y custodia

- Programación diaria a las 08:00 UTC (03:00 de Perú), más ejecución manual.
- RPO objetivo: 24 horas, condicionado a ejecuciones exitosas; Actions puede retrasar o desactivar programaciones. Revisar diariamente la última ejecución y ejecutar manualmente ante un fallo.
- Retención configurada: 7 días. Descargar periódicamente una copia cifrada a otro medio administrado por el equipo. Esa copia externa es una tarea operativa, no un paso automatizado por este proyecto.
- Cifrado AES-256-GCM antes de subir un artefacto. `BACKUP_KEY` debe ser una clave aleatoria de 32 bytes en Base64, guardada como secreto del entorno `backups`. Conservar también una copia de la clave en un gestor independiente; perderla impide recuperar los datos. Nunca incorporarla al repositorio, al video ni a un artículo.
- La cuenta del respaldo solo necesita lectura del proyecto dedicado (`roles/datastore.viewer`). Su JSON se configura en `FIRESTORE_BACKUP_SERVICE_ACCOUNT`; el token OAuth temporal no se imprime.
- El artefacto cifrado de un repositorio público puede ser descargable por personas con acceso a Actions. El cifrado protege el contenido; no publicar datos reales de terceros sin autorización.

## Recuperación y ensayo

1. Descargar un artefacto y recuperar la clave de forma privada.
2. Levantar un emulador en `127.0.0.1:18081`.
3. Elegir otro ID `demo-...`, distinto al origen y vacío.
4. Ejecutar primero sin `--apply`; no escribe documentos.
5. Ejecutar con `--apply` para restaurar el destino de ensayo.
6. Comparar el SHA-256 del contenido y verificar cantidad y campos. El código realiza esta comparación automáticamente.

```sh
node scripts/backup.mjs backup ID_ORIGEN backups/tasks.enc.json
node scripts/backup.mjs restore demo-recuperacion backups/tasks.enc.json
node scripts/backup.mjs restore demo-recuperacion backups/tasks.enc.json --apply
```

El respaldo en nube exige `BACKUP_ACCESS_TOKEN` y `BACKUP_KEY`. El ensayo exige además `FIRESTORE_EMULATOR_HOST=127.0.0.1:18081`. La restauración está limitada intencionalmente a un emulador: no sobrescribe producción. No existe recuperación de identidades anónimas de Authentication; recuperar documentos no recupera una cuenta perdida.

## Evidencia disponible

Prueba real local: respaldo cifrado, simulación sin escrituras, recuperación exacta, rechazo de destino no vacío, rechazo del mismo origen y rechazo de corrupción. Una prueba aprobada, cero fallidas; aproximadamente 1,04 segundos de ejecución de pruebas, excluyendo arranque del emulador. No representa un RTO medido en nube.

RTO objetivo para el ensayo educativo: 5 minutos incluyendo preparación. La recuperación de producción necesita un procedimiento autorizado adicional y no está implementada por esta herramienta.

## Automatización y estado

La app existente se publica en GitHub Pages mediante su propio `deploy.yml`; este repositorio no modifica ese despliegue. `check.yml` ensaya la recuperación. `backup.yml` genera la copia cifrada y configura 7 días de retención. La existencia de YAML no acredita una ejecución: comprobar el job, descargar el artefacto y ensayar su recuperación.

Repositorio: https://github.com/AntonyS3010/nosql-backup-firestore

La app existente está disponible en https://antonys3010.github.io/campus-tareas-nosql/ . Credenciales de lectura para el respaldo, ejecución programada real, nuevos artículos y video de backup: pendientes de configuración y publicación. No se modifica la app ni se activa facturación.

Fuentes: https://firebase.google.com/docs/firestore/manage-data/export-import ; https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/runQuery ; https://docs.github.com/en/actions/tutorials/store-and-share-data
