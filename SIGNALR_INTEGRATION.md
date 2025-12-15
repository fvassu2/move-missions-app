# SignalR Integration Guide - .NET 8 Backend

This document provides examples and guidelines for integrating the Angular Dashboard with a .NET 8 SignalR backend.

## Quick Start - .NET 8 SignalR Hub

### 1. Create MissionHub.cs

```csharp
using Microsoft.AspNetCore.SignalR;

namespace MoveWarehouse.Hubs
{
    public class MissionHub : Hub
    {
        private readonly IMissionService _missionService;

        public MissionHub(IMissionService missionService)
        {
            _missionService = missionService;
        }

        // Called when operator connects
        public override async Task OnConnectedAsync()
        {
            var operatorId = Context.UserIdentifier ?? Context.ConnectionId;
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Operator_{operatorId}");
            
            // Send current missions to operator
            var missions = await _missionService.GetOperatorMissions(operatorId);
            await Clients.Caller.SendAsync("InitialMissions", missions);
            
            await base.OnConnectedAsync();
        }

        // Called when operator disconnects
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var operatorId = Context.UserIdentifier ?? Context.ConnectionId;
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Operator_{operatorId}");
            
            await base.OnDisconnectedAsync(exception);
        }

        // Operator accepts a mission
        public async Task AcceptMission(string missionId, string operatorId)
        {
            try
            {
                var mission = await _missionService.AssignMission(missionId, operatorId);
                
                // Notify the operator
                await Clients.Group($"Operator_{operatorId}")
                    .SendAsync("MissionAssigned", new
                    {
                        missionId = missionId,
                        operatorId = operatorId,
                        timestamp = DateTime.UtcNow
                    });

                // Notify all other clients that mission is no longer available
                await Clients.Others.SendAsync("MissionUpdate", new
                {
                    missionId = missionId,
                    status = "assigned",
                    operatorId = operatorId
                });
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Error", new
                {
                    message = "Failed to accept mission",
                    error = ex.Message
                });
            }
        }

        // Update mission status
        public async Task UpdateMissionStatus(string missionId, string newStatus)
        {
            try
            {
                await _missionService.UpdateStatus(missionId, newStatus);
                
                // Broadcast to all clients
                await Clients.All.SendAsync("MissionStatusChanged", new
                {
                    missionId = missionId,
                    newStatus = newStatus,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Error", new
                {
                    message = "Failed to update mission status",
                    error = ex.Message
                });
            }
        }

        // Report a problem with mission
        public async Task ReportProblem(string missionId, string issue)
        {
            try
            {
                await _missionService.ReportProblem(missionId, issue);
                
                // Notify supervisors/management
                await Clients.Group("Supervisors").SendAsync("ProblemReported", new
                {
                    missionId = missionId,
                    issue = issue,
                    reportedAt = DateTime.UtcNow
                });

                // Update mission status
                await Clients.All.SendAsync("MissionStatusChanged", new
                {
                    missionId = missionId,
                    newStatus = "failed",
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Error", new
                {
                    message = "Failed to report problem",
                    error = ex.Message
                });
            }
        }

        // Admin assigns mission to specific operator
        public async Task AssignMissionToOperator(string missionId, string operatorId)
        {
            try
            {
                var mission = await _missionService.AssignMission(missionId, operatorId);
                
                // Notify specific operator
                await Clients.Group($"Operator_{operatorId}")
                    .SendAsync("MissionAssigned", new
                    {
                        missionId = missionId,
                        operatorId = operatorId,
                        timestamp = DateTime.UtcNow
                    });
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Error", new
                {
                    message = "Failed to assign mission",
                    error = ex.Message
                });
            }
        }

        // Send notification to operator
        public async Task NotifyOperator(string operatorId, string message)
        {
            await Clients.Group($"Operator_{operatorId}")
                .SendAsync("NotifyOperator", message);
        }

        // Broadcast new mission to all operators
        public async Task BroadcastNewMission(object mission)
        {
            await Clients.All.SendAsync("NewMissionAvailable", mission);
        }
    }
}
```

### 2. Configure in Program.cs

```csharp
using MoveWarehouse.Hubs;
using MoveWarehouse.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
});

// Add your mission service
builder.Services.AddScoped<IMissionService, MissionService>();

// Add CORS for Angular development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularDevClient", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure middleware
app.UseCors("AngularDevClient");
app.UseRouting();

// Map SignalR hub
app.MapHub<MissionHub>("/missionHub");
app.MapControllers();

app.Run();
```

### 3. Mission Model Example

```csharp
namespace MoveWarehouse.Models
{
    public class Mission
    {
        public string Id { get; set; } = string.Empty;
        public string? OperatorId { get; set; }
        public MissionType Type { get; set; }
        public string SourceLocation { get; set; } = string.Empty;
        public string DestinationLocation { get; set; } = string.Empty;
        public string Material { get; set; } = string.Empty;
        public string? Sku { get; set; }
        public int Quantity { get; set; }
        public MissionPriority Priority { get; set; }
        public MissionStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public enum MissionType
    {
        Load,
        Unload,
        Move
    }

    public enum MissionPriority
    {
        Low,
        Normal,
        High
    }

    public enum MissionStatus
    {
        Pending,
        Assigned,
        InProgress,
        Completed,
        Failed
    }
}
```

### 4. Mission Service Interface

```csharp
namespace MoveWarehouse.Services
{
    public interface IMissionService
    {
        Task<IEnumerable<Mission>> GetOperatorMissions(string operatorId);
        Task<IEnumerable<Mission>> GetAvailableMissions();
        Task<Mission> AssignMission(string missionId, string operatorId);
        Task UpdateStatus(string missionId, string status);
        Task ReportProblem(string missionId, string issue);
        Task<Mission> CreateMission(Mission mission);
    }
}
```

## Angular Configuration

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  signalRHubUrl: 'http://localhost:5000/missionHub', // Your .NET backend URL
  mockMode: false, // Set to false to connect to real SignalR
  reconnectInterval: 5000,
  maxReconnectAttempts: 10
};
```

## Testing the Integration

### 1. Start .NET Backend

```bash
cd YourBackendProject
dotnet run
```

### 2. Start Angular Frontend

```bash
cd move-missions-app
npm start
```

### 3. Test Connection

Open browser console and look for:
```
✅ SignalR: Connected
```

## SignalR Events Reference

### Events FROM Backend TO Frontend

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `InitialMissions` | `Mission[]` | Sent on connection with operator's current missions |
| `MissionAssigned` | `{ missionId, operatorId, timestamp }` | New mission assigned to operator |
| `MissionStatusChanged` | `{ missionId, newStatus, timestamp }` | Mission status updated |
| `MissionUpdate` | `Mission` | General mission update |
| `NewMissionAvailable` | `Mission` | New mission broadcast to all operators |
| `NotifyOperator` | `string` | Text notification to operator |
| `Error` | `{ message, error }` | Error notification |

### Methods FROM Frontend TO Backend

| Method Name | Parameters | Description |
|------------|------------|-------------|
| `AcceptMission` | `(missionId, operatorId)` | Operator accepts available mission |
| `UpdateMissionStatus` | `(missionId, newStatus)` | Update mission status |
| `ReportProblem` | `(missionId, issue)` | Report problem with mission |

## Production Deployment

### Update Angular Environment

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  signalRHubUrl: 'https://your-production-server.com/missionHub',
  mockMode: false,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10
};
```

### Update .NET CORS Policy

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("ProductionClient", policy =>
    {
        policy.WithOrigins("https://your-angular-app.com")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

## Troubleshooting

### Connection Issues

1. **CORS Error**: Ensure backend CORS is configured correctly
2. **Hub URL**: Verify `signalRHubUrl` in environment file
3. **Firewall**: Check if port is accessible
4. **SSL**: In production, use HTTPS for SignalR

### Check Connection Status

In Angular app header, connection status is displayed:
- 🟢 **Connesso**: Successfully connected
- 🟡 **Connessione...**: Connecting
- 🔴 **Disconnesso**: Disconnected

### Console Logs

Both Angular and .NET provide detailed logging:

**Angular Console:**
```
📡 SignalR: Connected
📨 Mission Assigned: {...}
```

**ASP.NET Console:**
```
info: Microsoft.AspNetCore.SignalR.HubConnectionContext[1]
      Connection established
```

## Advanced Features

### Authentication

Add JWT authentication to SignalR:

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* ... */ });

app.MapHub<MissionHub>("/missionHub")
    .RequireAuthorization();
```

### Message Pack Protocol

For better performance, use MessagePack:

```bash
# .NET
dotnet add package Microsoft.AspNetCore.SignalR.Protocols.MessagePack

# Angular
npm install @microsoft/signalr-protocol-msgpack
```

```typescript
// Angular
this.hubConnection = new signalR.HubConnectionBuilder()
  .withUrl(environment.signalRHubUrl)
  .withHubProtocol(new signalR.protocols.msgpack.MessagePackHubProtocol())
  .build();
```

## Additional Resources

- [ASP.NET Core SignalR Documentation](https://docs.microsoft.com/en-us/aspnet/core/signalr/)
- [SignalR JavaScript Client](https://docs.microsoft.com/en-us/aspnet/core/signalr/javascript-client)
- [Angular SignalR Integration Guide](https://angular.io/guide/http)
