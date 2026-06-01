# Despliegue en CPD-USAL

Guía operativa para desplegar y mantener IUCE Reservas en el servidor
institucional `solis.usal.es` del Centro de Procesamiento de Datos de la
Universidad de Salamanca. Producción accesible en
[https://reservas.iuce.usal.es](https://reservas.iuce.usal.es).

## 1. Resumen de la arquitectura productiva

| Capa | Tecnología | Detalles |
|------|------------|----------|
| Front-of-house | Apache 2 (HTTPS) | Reverse proxy hacia `localhost:3000` |
| Certificado SSL | Let's Encrypt (certbot) | Renovación automática 90 días |
| WAF | ModSecurity + OWASP CRS | Excepciones específicas para PATCH/DELETE |
| Aplicación | Next.js 14 standalone | Proceso Node 20 gestionado por `systemd` |
| Base de datos | PostgreSQL 16 | Instancia local sobre el mismo servidor |
| Cron | `cron` del sistema | Llamada diaria a `/api/cron/reminders` |

## 2. Estructura de directorios en el servidor

```
/opt/iuce-reservas/
├── current/                  # Symlink al release activo
├── releases/
│   ├── v1.0.0/
│   ├── v0.2.0/
│   └── v0.1.0/
└── shared/
    ├── .env                  # Variables de entorno (chmod 600)
    └── logs/
```

El despliegue de una nueva versión cambia el symlink `current` después
de hacer build y reiniciar el servicio, manteniendo la versión anterior
disponible para rollback.

## 3. Configuración de Apache (VirtualHost)

El archivo `/etc/apache2/sites-available/reservas-le-ssl.conf`:

```apache
<VirtualHost *:443>
    ServerName reservas.iuce.usal.es
    DocumentRoot /var/www/html

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/reservas.iuce.usal.es/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/reservas.iuce.usal.es/privkey.pem

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # Excepciones de ModSecurity para los métodos REST del API
    <Location /api/>
        SecRuleRemoveById 911100
        SecRuleRemoveById 949110
    </Location>

    ErrorLog ${APACHE_LOG_DIR}/reservas-iuce-error.log
    CustomLog ${APACHE_LOG_DIR}/reservas-iuce-access.log combined
</VirtualHost>
```

> **Por qué `SecRuleRemoveById 911100` y `949110`?**
> La regla 911100 de OWASP CRS marca como sospechosos los métodos
> distintos de `GET`/`POST`. La API de IUCE Reservas usa `PATCH` y
> `DELETE` para operaciones administrativas (revisión de reservas,
> desactivación de espacios). La regla 949110 es el detector de
> anomalías agregadas que se dispara después. Se desactivan **solo**
> para `/api/`, sin afectar al resto de servicios alojados en el mismo
> Apache.

## 4. Servicio systemd

`/etc/systemd/system/iuce-reservas.service`:

```ini
[Unit]
Description=IUCE Reservas (Next.js)
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=iuce-app
WorkingDirectory=/opt/iuce-reservas/current
EnvironmentFile=/opt/iuce-reservas/shared/.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Comandos habituales:

```bash
sudo systemctl status iuce-reservas
sudo systemctl restart iuce-reservas
sudo journalctl -u iuce-reservas -f
```

## 5. Variables de entorno (`/opt/iuce-reservas/shared/.env`)

```dotenv
NODE_ENV=production
DATABASE_URL=postgresql://iuce:***@localhost:5432/iuce_reservas
NEXTAUTH_URL=https://reservas.iuce.usal.es
NEXTAUTH_SECRET=***
RESEND_API_KEY=***
EMAIL_FROM=IUCE Reservas <noreply@reservas.iuce.usal.es>
CRON_SECRET=***
```

Permisos del archivo: `chmod 600 /opt/iuce-reservas/shared/.env`,
propietario `iuce-app`.

## 6. Cron de recordatorios y EXPIRED

Entrada del crontab del usuario `iuce-app` (`crontab -e`):

```cron
# Recordatorio 24h + marcado EXPIRED, todos los días a las 09:00
0 9 * * * curl -fsS -H "Authorization: Bearer $(cat /opt/iuce-reservas/shared/cron-secret)" https://reservas.iuce.usal.es/api/cron/reminders >> /opt/iuce-reservas/shared/logs/cron.log 2>&1
```

## 7. Health check

El endpoint `GET /api/health` expone un estado JSON con la versión, la
latencia a la base de datos y el uptime del proceso. Está pensado para
ser consumido por las herramientas de monitorización del CPD:

```bash
curl -fsS https://reservas.iuce.usal.es/api/health | jq
```

Una respuesta con `status: "ok"` y código HTTP 200 indica salud completa.
Una respuesta con `status: "degraded"` y código 503 indica que la
aplicación está arriba pero la base de datos no responde.

## 8. Rollback rápido

```bash
# 1. Apuntar el symlink a la versión anterior
sudo ln -sfn /opt/iuce-reservas/releases/v0.2.0 /opt/iuce-reservas/current

# 2. Reiniciar el servicio
sudo systemctl restart iuce-reservas

# 3. Verificar
curl -fsS https://reservas.iuce.usal.es/api/health
```

## 9. Lista de tareas tras un despliegue nuevo

- [ ] Copiar el nuevo build a `/opt/iuce-reservas/releases/vX.Y.Z/`
- [ ] Ejecutar `npx prisma migrate deploy` desde el nuevo release
- [ ] Cambiar el symlink `current`
- [ ] `sudo systemctl restart iuce-reservas`
- [ ] Comprobar `journalctl -u iuce-reservas -n 50`
- [ ] Curl al health check
- [ ] Smoke test manual: login + listado de espacios + creación de reserva
- [ ] Anotar la versión desplegada en `/opt/iuce-reservas/shared/DEPLOYMENT_HISTORY.md`

## 10. Contactos

- **Equipo técnico CPD-USAL**: tickets internos vía OTRS de la USAL.
- **Mantenedor del proyecto**: Enrique González Gutiérrez (Universidad
  de Burgos).
- **Servicio de incidencias del IUCE**:
  [iuce.tecnico@usal.es](mailto:iuce.tecnico@usal.es)
