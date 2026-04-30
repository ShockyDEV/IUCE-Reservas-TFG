# Máquina de estados de una reserva

Documento técnico generado como cierre del spike **US-018 — Spike: diseño del flujo de estados de una reserva** (Sprint 3, EPIC-04).

## Estados modelados

| Estado     | Descripción                                                                         |
|------------|-------------------------------------------------------------------------------------|
| `PENDING`  | Estado inicial. La solicitud ha sido enviada y está pendiente de revisión.          |
| `APPROVED` | Un administrador del IUCE ha aprobado la reserva. Bloquea el espacio en ese rango.  |
| `REJECTED` | Un administrador ha rechazado la solicitud. No bloquea el espacio.                  |

## Transiciones

```
                ┌──────────┐
   crear()  ──▶ │ PENDING  │
                └────┬─────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   aprobar()                  rechazar()
        │                         │
        ▼                         ▼
  ┌──────────┐              ┌──────────┐
  │ APPROVED │              │ REJECTED │
  └──────────┘              └──────────┘
```

Diagrama equivalente en formato visual: [`docs/img/maquina-estados-reserva.png`](img/maquina-estados-reserva.png).

## Reglas

1. Toda reserva nace en estado `PENDING` (default del enum `ReservationStatus`).
2. Solo un usuario con rol `ADMIN` o `SUPER_ADMIN` puede transicionar a `APPROVED` o `REJECTED`.
3. Las transiciones desde `APPROVED` o `REJECTED` no se contemplan en el alcance de Sprint 3 (estados terminales para el MVP).
4. Estados adicionales como `CANCELLED` o `EXPIRED` quedan diferidos a sprints posteriores (Sprint 5+).
5. La detección de solapamientos en el endpoint POST considera tanto reservas `APPROVED` como `PENDING`, evitando dobles solicitudes simultáneas sobre el mismo espacio.

## Implicaciones de diseño

- El endpoint `POST /api/reservations` (US-021) crea la reserva siempre con `status = PENDING`.
- El endpoint `GET /api/reservations` (US-022) admite filtro por `?status=PENDING|APPROVED|REJECTED`.
- El dashboard del usuario muestra la última lista de reservas con su estado actual mediante badges visuales.
- La aprobación/rechazo por parte de admin se desarrollará en Sprint 4 (EPIC-04 + EPIC-05).
