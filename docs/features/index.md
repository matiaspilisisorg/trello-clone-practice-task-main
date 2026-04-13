# Trello Clone Documentation

A full-stack Trello clone built as a portfolio project. This application replicates core Trello functionality including boards, lists, cards with drag-and-drop reordering, labels, checklists, due dates, and user authentication with JWT refresh tokens.

## Documentation Index

| Document | Description |
|---|---|
| [Architecture](./architecture.md) | Full-stack architecture overview, monorepo layout, ER diagram, and JWT refresh flow |
| [Authentication](./auth.md) | Registration, login, password hashing, token strategy, and API reference |
| [Boards](./boards.md) | Board CRUD operations, color presets, list management, and API reference |
| [Cards](./cards.md) | Card creation/editing, due date logic, checklists, labels, and API reference |
| [Drag and Drop](./drag-and-drop.md) | @hello-pangea/dnd integration, position strategy, and optimistic updates |

## Architecture at a Glance

```mermaid
graph TB
    subgraph Client["Client (React + Vite)"]
        UI[React Components]
        CTX[Auth Context]
        API[Axios API Layer]
    end

    subgraph Server["Server (Express)"]
        MW[Auth Middleware]
        RT[Routes]
        CTRL[Controllers]
    end

    subgraph Data["Data Layer"]
        PRISMA[Prisma ORM]
        PG[(PostgreSQL)]
    end

    UI --> CTX
    UI --> API
    API -->|REST + JWT| MW
    MW --> RT
    RT --> CTRL
    CTRL --> PRISMA
    PRISMA --> PG

    style Client fill:#e0f2fe,stroke:#0284c7
    style Server fill:#fef3c7,stroke:#d97706
    style Data fill:#f0fdf4,stroke:#16a34a
```

## Quick Links

- **Setup instructions**: See the [project README](../../README.md)
- **Server tests**: `cd server && npm test`
- **Client tests**: `cd client && npm test`
- **E2E tests**: `cd e2e && npx playwright test`
