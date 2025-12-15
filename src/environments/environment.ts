export const environment = {
  production: false,
  signalRHubUrl: 'http://localhost:5000/missionHub',
  mockMode: true, // Set to false when connecting to real SignalR hub
  reconnectInterval: 5000,
  maxReconnectAttempts: 10
};
