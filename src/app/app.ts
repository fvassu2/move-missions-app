import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  title = 'Move Missions App';
  isDarkTheme = false;
  currentTheme: 'azure' | 'cyan' | 'violet' | 'green' | 'dark' = 'azure';
  themes = [
    { value: 'azure', label: 'Azure', icon: 'water_drop' },
    { value: 'cyan', label: 'Cyan', icon: 'wb_sunny' },
    { value: 'violet', label: 'Violet', icon: 'auto_awesome' },
    { value: 'green', label: 'Green', icon: 'eco' },
    { value: 'dark', label: 'Dark', icon: 'dark_mode' }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme') as any;
      if (savedTheme && this.themes.find(t => t.value === savedTheme)) {
        this.currentTheme = savedTheme;
      }
      this.isDarkTheme = this.currentTheme === 'dark';
      this.applyTheme();
    }
  }

  toggleTheme() {
    const currentIndex = this.themes.findIndex(t => t.value === this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    this.currentTheme = this.themes[nextIndex].value as any;
    this.isDarkTheme = this.currentTheme === 'dark';
    this.applyTheme();

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', this.currentTheme);
    }
  }

  private applyTheme() {
    if (isPlatformBrowser(this.platformId)) {
      const htmlElement = document.documentElement;
      // Remove all theme classes
      htmlElement.classList.remove('theme-azure', 'theme-cyan', 'theme-violet', 'theme-green', 'theme-dark');
      // Add current theme class
      if (this.currentTheme !== 'azure') {
        htmlElement.classList.add(`theme-${this.currentTheme}`);
      }
    }
  }

  getCurrentThemeIcon(): string {
    return this.themes.find(t => t.value === this.currentTheme)?.icon || 'palette';
  }
}
