# 🚜 Dashboard Mulettista - Forklift Operator Dashboard

Una moderna applicazione Angular 19 per tablet destinata agli operatori di muletto in magazzino, con integrazione real-time tramite SignalR e animazione arcade 2D.

![Angular](https://img.shields.io/badge/Angular-19.2-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![SignalR](https://img.shields.io/badge/SignalR-8.0-green)

## 🎯 Caratteristiche Principali

### ✨ Funzionalità Core
- **Dashboard Missioni Real-Time**: Visualizzazione in tempo reale delle missioni assegnate e disponibili
- **Integrazione SignalR**: Connessione bidirezionale con hub .NET 8 per aggiornamenti istantanei
- **Animazione Arcade 2D**: Rappresentazione animata del muletto con sprite e particelle
- **Design Tablet-First**: Ottimizzato per tablet 10-12 pollici con controlli touch-friendly
- **Gestione Stati Missione**: Workflow completo da assegnazione a completamento
- **Mock Mode**: Simulazione completa per sviluppo senza backend

### 🎮 Animazione Muletto
L'animazione arcade include:
- **Sprite animato** del muletto con movimento fluido
- **Fasi della missione** visivamente rappresentate:
  - 🏠 Idle: Muletto in attesa con animazione di rimbalzo
  - 🚜 Movimento verso sorgente/destinazione
  - 📦 Caricamento: Forche si alzano e prendono il pallet
  - 📤 Scaricamento: Forche si abbassano e depositano il pallet
- **Effetti particellari**: Polvere durante il movimento, scintille durante il carico
- **Warehouse visualizzato**: Posizioni sorgente e destinazione mostrate graficamente
- **Progress bar**: Avanzamento della fase corrente

### 📱 UI/UX Features
- **Touch-friendly**: Pulsanti grandi (min 44x44px)
- **Colori vivaci**: Indicatori di stato colorati per alta leggibilità
  - 🟢 Verde: Missione completata
  - 🟡 Giallo: Missione in corso
  - 🔴 Rosso: Priorità alta / Problema
  - 🔵 Blu: Missione disponibile
- **Current Mission Highlight**: Bordo verde animato con glow effect
- **Dark Mode**: Ottimizzato per ambienti con varia illuminazione
- **Responsive**: Adattabile ma ottimizzato per tablet landscape

## 🚀 Quick Start

### Prerequisiti
- Node.js 20.x o superiore
- npm 10.x o superiore
- Angular CLI 19.x (opzionale ma consigliato)

### Installazione

```bash
# Clone repository
git clone https://github.com/fvassu2/move-missions-app.git
cd move-missions-app

# Install dependencies
npm install

# Start development server
npm start
```

L'applicazione sarà disponibile su `http://localhost:4200`

### Build Production

```bash
npm run build
```

I file di produzione saranno in `dist/move-missions-app/`

## 📂 Struttura Progetto

```
move-missions-app/
├── src/
│   ├── app/
│   │   ├── app.component.ts          # Main app component
│   │   ├── app.component.html        # Main template
│   │   ├── app.component.css         # Main styles
│   │   ├── app.config.ts             # App configuration
│   │   └── app.routes.ts             # Routing configuration
│   │
│   ├── lib/
│   │   ├── components/
│   │   │   ├── mission-card/         # Single mission card
│   │   │   ├── mission-list/         # List of missions
│   │   │   └── forklift-animation/   # 2D arcade animation
│   │   │
│   │   ├── services/
│   │   │   ├── signalr.service.ts    # SignalR connection management
│   │   │   └── mission.service.ts    # Mission state management
│   │   │
│   │   └── models/
│   │       ├── mission.model.ts      # Mission interfaces
│   │       └── signalr-message.model.ts
│   │
│   ├── environments/
│   │   ├── environment.ts            # Dev environment
│   │   └── environment.prod.ts       # Production environment
│   │
│   ├── index.html                    # HTML entry point
│   ├── main.ts                       # TypeScript entry point
│   └── styles.css                    # Global styles
│
├── public/                           # Static assets
├── angular.json                      # Angular configuration
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # This file
```

## ⚙️ Configurazione

### Ambiente Development (Mock Mode)

File: `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  signalRHubUrl: 'http://localhost:5000/missionHub',
  mockMode: true,  // ← Impostare su true per usare dati mock
  reconnectInterval: 5000,
  maxReconnectAttempts: 10
};
```

In **Mock Mode**, l'applicazione:
- Simula la connessione SignalR
- Genera missioni fake periodicamente
- Simula aggiornamenti di stato
- Non richiede un backend

### Ambiente Production

File: `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  signalRHubUrl: 'https://your-server.com/missionHub',
  mockMode: false,  // ← Connessione reale a SignalR
  reconnectInterval: 5000,
  maxReconnectAttempts: 10
};
```

## 🔌 Integrazione SignalR Hub (.NET 8)

### Backend Setup Example

Esempio di implementazione del SignalR Hub in .NET 8:

```csharp
using Microsoft.AspNetCore.SignalR;

public class MissionHub : Hub
{
    // Notify operator about new mission
    public async Task AssignMission(string missionId, string operatorId)
    {
        await Clients.User(operatorId).SendAsync("MissionAssigned", new
        {
            missionId = missionId,
            operatorId = operatorId
        });
    }

    // Update mission status
    public async Task UpdateMissionStatus(string missionId, string newStatus)
    {
        await Clients.All.SendAsync("MissionStatusChanged", new
        {
            missionId = missionId,
            newStatus = newStatus,
            timestamp = DateTime.UtcNow
        });
    }

    // Accept mission from operator
    public async Task AcceptMission(string missionId, string operatorId)
    {
        // Logic to assign mission to operator
        await Clients.All.SendAsync("MissionUpdate", new
        {
            missionId = missionId,
            operatorId = operatorId,
            status = "assigned"
        });
    }

    // Report problem
    public async Task ReportProblem(string missionId, string issue)
    {
        // Logic to handle problem reporting
        await Clients.All.SendAsync("MissionUpdate", new
        {
            missionId = missionId,
            status = "failed",
            issue = issue
        });
    }

    // Generic notification
    public async Task NotifyOperator(string operatorId, string message)
    {
        await Clients.User(operatorId).SendAsync("NotifyOperator", message);
    }
}
```

### Program.cs Configuration

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add SignalR
builder.Services.AddSignalR();

// Add CORS for Angular app
builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("AngularApp");
app.MapHub<MissionHub>("/missionHub");

app.Run();
```

### Eventi SignalR Supportati

L'applicazione Angular ascolta i seguenti eventi:

| Event Name | Payload | Description |
|------------|---------|-------------|
| `MissionAssigned` | `{ missionId, operatorId }` | Nuova missione assegnata |
| `MissionStatusChanged` | `{ missionId, newStatus, timestamp }` | Cambio stato missione |
| `MissionUpdate` | `{ ...data }` | Aggiornamento generico |
| `NotifyOperator` | `string message` | Notifica all'operatore |

## 📊 Modelli Dati

### Mission Interface

```typescript
interface Mission {
  id: string;
  operatorId?: string;
  type: 'load' | 'unload' | 'move';
  sourceLocation: string;
  destinationLocation: string;
  material: string;
  sku?: string;
  quantity: number;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  assignedToMe: boolean;
  isCurrentMission: boolean;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}
```

### Mission State

```typescript
interface MissionState {
  phase: 'idle' | 'moving_to_source' | 'loading' | 'moving_to_dest' | 'unloading';
  progress: number; // 0-100
}
```

## 🎨 Personalizzazione

### Colori

I colori principali sono definiti in `src/styles.css`:

```css
:root {
  --color-primary: #2563eb;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #3b82f6;
}
```

### Animazione Forklift

Per modificare l'animazione, vedi `src/lib/components/forklift-animation/forklift-animation.component.ts`:

- `CANVAS_WIDTH/HEIGHT`: Dimensioni canvas
- `MOVE_SPEED`: Velocità movimento muletto
- `FORK_SPEED`: Velocità alzata/abbassamento forche
- `SOURCE_X/DEST_X`: Posizioni warehouse

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run e2e
```

## 🔧 Troubleshooting

### SignalR non si connette

1. Verificare che `mockMode: false` in environment
2. Controllare che il backend sia avviato
3. Verificare CORS configurato correttamente
4. Controllare l'URL dell'hub in `signalRHubUrl`

### Animazione non fluida

1. Verificare le performance del browser
2. Ridurre `CANVAS_WIDTH/HEIGHT` se necessario
3. Controllare la console per errori

### Missioni non appaiono

1. In mock mode, verificare `mission.service.ts`
2. In real mode, verificare connessione SignalR
3. Controllare console per errori

## 📝 License

MIT License - Vedi LICENSE file per dettagli

## 👥 Contributi

Contributi sono benvenuti! Per favore:
1. Fork il repository
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📧 Supporto

Per domande o supporto, aprire una issue su GitHub.

---

**Sviluppato con ❤️ per ottimizzare il workflow dei mulettisti in magazzino! 🚜✨**
