import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/operator',
    pathMatch: 'full'
  },
  {
    path: 'operator',
    loadComponent: () => 
      import('./features/operator-dashboard/operator-dashboard.component').then(m => m.OperatorDashboardComponent)
  },
  {
    path: 'missions',
    loadComponent: () => 
      import('./features/mission-manager/mission-manager.component').then(m => m.MissionManagerComponent)
  },
  {
    path: '**',
    redirectTo: '/operator'
  }
];
