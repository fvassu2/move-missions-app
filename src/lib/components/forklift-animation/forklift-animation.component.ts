import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissionState } from '../../models';

interface ForkliftSprite {
  x: number;
  y: number;
  width: number;
  height: number;
  forkHeight: number;
  hasPallet: boolean;
  direction: 1 | -1; // 1 = right, -1 = left
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

@Component({
  selector: 'app-forklift-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forklift-animation.component.html',
  styleUrls: ['./forklift-animation.component.css']
})
export class ForkliftAnimationComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() missionState!: MissionState;

  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number = 0;
  private forklift: ForkliftSprite = {
    x: 100,
    y: 0,
    width: 80,
    height: 60,
    forkHeight: 0,
    hasPallet: false,
    direction: 1
  };
  
  private particles: Particle[] = [];
  private targetX: number = 100;
  private targetForkHeight: number = 0;
  private readonly CANVAS_WIDTH = 800;
  private readonly CANVAS_HEIGHT = 300;
  private readonly GROUND_Y = 240;
  private readonly MOVE_SPEED = 2;
  private readonly FORK_SPEED = 1.5;
  
  // Warehouse positions
  private readonly SOURCE_X = 200;
  private readonly DEST_X = 600;
  private readonly IDLE_X = 100;

  private wheelRotation: number = 0;
  private frameCount: number = 0;

  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.CANVAS_WIDTH;
    canvas.height = this.CANVAS_HEIGHT;
    
    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Could not get canvas context');
      return;
    }
    
    this.ctx = context;
    this.forklift.y = this.GROUND_Y - this.forklift.height;
    this.startAnimation();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  ngOnChanges(): void {
    if (this.missionState) {
      this.updateAnimation();
    }
  }

  private updateAnimation(): void {
    switch (this.missionState.phase) {
      case 'idle':
        this.targetX = this.IDLE_X;
        this.targetForkHeight = 0;
        this.forklift.hasPallet = false;
        break;
      
      case 'moving_to_source':
        this.targetX = this.SOURCE_X;
        this.targetForkHeight = 0;
        this.forklift.direction = this.targetX > this.forklift.x ? 1 : -1;
        break;
      
      case 'loading':
        this.targetX = this.SOURCE_X;
        this.targetForkHeight = 40;
        if (this.missionState.progress > 50) {
          this.forklift.hasPallet = true;
        }
        break;
      
      case 'moving_to_dest':
        this.targetX = this.DEST_X;
        this.targetForkHeight = 40;
        this.forklift.hasPallet = true;
        this.forklift.direction = this.targetX > this.forklift.x ? 1 : -1;
        break;
      
      case 'unloading':
        this.targetX = this.DEST_X;
        if (this.missionState.progress < 50) {
          this.targetForkHeight = 40;
          this.forklift.hasPallet = true;
        } else {
          this.targetForkHeight = 0;
          this.forklift.hasPallet = false;
        }
        break;
    }
  }

  private startAnimation(): void {
    const animate = () => {
      this.frameCount++;
      this.update();
      this.draw();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  private update(): void {
    // Move forklift towards target
    if (Math.abs(this.forklift.x - this.targetX) > this.MOVE_SPEED) {
      const direction = this.targetX > this.forklift.x ? 1 : -1;
      this.forklift.x += this.MOVE_SPEED * direction;
      this.wheelRotation += 5 * direction;
      
      // Add dust particles when moving
      if (this.frameCount % 5 === 0) {
        this.addDustParticle();
      }
    }

    // Move forks towards target height
    if (Math.abs(this.forklift.forkHeight - this.targetForkHeight) > this.FORK_SPEED) {
      const direction = this.targetForkHeight > this.forklift.forkHeight ? 1 : -1;
      this.forklift.forkHeight += this.FORK_SPEED * direction;
    }

    // Update particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // Gravity
      p.life--;
      return p.life > 0;
    });

    // Idle animation - small bounce
    if (this.missionState?.phase === 'idle' && Math.abs(this.forklift.x - this.targetX) < 2) {
      this.forklift.y = this.GROUND_Y - this.forklift.height + Math.sin(this.frameCount * 0.05) * 2;
    } else {
      this.forklift.y = this.GROUND_Y - this.forklift.height;
    }
  }

  private draw(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1f2937';
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

    // Draw warehouse floor
    this.drawFloor();

    // Draw warehouse locations
    this.drawWarehouseLocations();

    // Draw particles
    this.drawParticles();

    // Draw forklift
    this.drawForklift();

    // Draw progress indicator
    if (this.missionState && this.missionState.phase !== 'idle') {
      this.drawProgressBar();
    }

    // Draw phase label
    this.drawPhaseLabel();
  }

  private drawFloor(): void {
    // Ground
    this.ctx.fillStyle = '#374151';
    this.ctx.fillRect(0, this.GROUND_Y, this.CANVAS_WIDTH, this.CANVAS_HEIGHT - this.GROUND_Y);
    
    // Ground lines
    this.ctx.strokeStyle = '#4b5563';
    this.ctx.lineWidth = 2;
    for (let i = 0; i < this.CANVAS_WIDTH; i += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, this.GROUND_Y);
      this.ctx.lineTo(i + 20, this.GROUND_Y);
      this.ctx.stroke();
    }
  }

  private drawWarehouseLocations(): void {
    // Source location
    this.drawLocation(this.SOURCE_X, 'A-01-01', '#3b82f6');
    
    // Destination location
    this.drawLocation(this.DEST_X, 'B-03-05', '#10b981');
  }

  private drawLocation(x: number, label: string, color: string): void {
    const width = 60;
    const height = 100;
    const y = this.GROUND_Y - height;

    // Rack structure
    this.ctx.fillStyle = color + '40';
    this.ctx.fillRect(x - width / 2, y, width, height);
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x - width / 2, y, width, height);

    // Shelves
    for (let i = 1; i < 4; i++) {
      const shelfY = y + (height / 4) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(x - width / 2, shelfY);
      this.ctx.lineTo(x + width / 2, shelfY);
      this.ctx.stroke();
    }

    // Label
    this.ctx.fillStyle = '#f9fafb';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x, y - 10);
  }

  private drawForklift(): void {
    const { x, y, width, height, forkHeight, hasPallet, direction } = this.forklift;

    this.ctx.save();
    
    // Flip horizontally if moving left
    if (direction === -1) {
      this.ctx.translate(x + width / 2, 0);
      this.ctx.scale(-1, 1);
      this.ctx.translate(-(x + width / 2), 0);
    }

    // Body
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillRect(x, y, width, height);
    
    // Cabin
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.fillRect(x + width * 0.6, y, width * 0.35, height * 0.6);
    
    // Window
    this.ctx.fillStyle = '#60a5fa';
    this.ctx.fillRect(x + width * 0.65, y + 5, width * 0.25, height * 0.35);

    // Wheels
    const wheelRadius = 12;
    const wheel1X = x + 15;
    const wheel2X = x + width - 15;
    const wheelY = y + height + 5;

    this.drawWheel(wheel1X, wheelY, wheelRadius);
    this.drawWheel(wheel2X, wheelY, wheelRadius);

    // Mast (vertical part)
    this.ctx.fillStyle = '#6b7280';
    this.ctx.fillRect(x + 5, y - 80, 8, 80);

    // Forks
    const forkY = y - forkHeight;
    this.ctx.fillStyle = '#9ca3af';
    this.ctx.fillRect(x + 3, forkY, 4, 40);
    this.ctx.fillRect(x + 10, forkY, 4, 40);

    // Pallet on forks
    if (hasPallet) {
      const palletWidth = 30;
      const palletHeight = 25;
      const palletX = x;
      const palletY = forkY - palletHeight;

      // Pallet
      this.ctx.fillStyle = '#8b4513';
      this.ctx.fillRect(palletX, palletY, palletWidth, palletHeight);
      
      // Pallet slats
      this.ctx.strokeStyle = '#654321';
      this.ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const slat = palletY + (palletHeight / 4) * i;
        this.ctx.beginPath();
        this.ctx.moveTo(palletX, slat);
        this.ctx.lineTo(palletX + palletWidth, slat);
        this.ctx.stroke();
      }

      // Sparkles around pallet
      if (this.frameCount % 20 < 10) {
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        this.ctx.arc(palletX - 5, palletY + 10, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(palletX + palletWidth + 5, palletY + 15, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    this.ctx.restore();
  }

  private drawWheel(x: number, y: number, radius: number): void {
    // Tire
    this.ctx.fillStyle = '#1f2937';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Rim
    this.ctx.fillStyle = '#6b7280';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    this.ctx.fill();

    // Spokes
    this.ctx.strokeStyle = '#9ca3af';
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const angle = (this.wheelRotation + i * 90) * Math.PI / 180;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + Math.cos(angle) * radius * 0.5, y + Math.sin(angle) * radius * 0.5);
      this.ctx.stroke();
    }
  }

  private drawParticles(): void {
    this.particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      this.ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  private addDustParticle(): void {
    this.particles.push({
      x: this.forklift.x + this.forklift.width / 2,
      y: this.GROUND_Y,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2 - 1,
      life: 30,
      maxLife: 30,
      color: 'rgb(156, 163, 175)'
    });
  }

  private addSparkles(): void {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: this.forklift.x + this.forklift.width / 2,
        y: this.forklift.y - this.forklift.forkHeight,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 4 - 2,
        life: 40,
        maxLife: 40,
        color: 'rgb(251, 191, 36)'
      });
    }
  }

  private drawProgressBar(): void {
    if (!this.missionState) return;

    const barWidth = 200;
    const barHeight = 20;
    const barX = (this.CANVAS_WIDTH - barWidth) / 2;
    const barY = 20;

    // Background
    this.ctx.fillStyle = '#374151';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress
    const progress = this.missionState.progress / 100;
    this.ctx.fillStyle = '#10b981';
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Border
    this.ctx.strokeStyle = '#f9fafb';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Text
    this.ctx.fillStyle = '#f9fafb';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${Math.round(this.missionState.progress)}%`, barX + barWidth / 2, barY + 15);
  }

  private drawPhaseLabel(): void {
    if (!this.missionState) return;

    const labels: Record<string, string> = {
      idle: '🏠 In Attesa',
      moving_to_source: '🚜 Verso Sorgente',
      loading: '📦 Caricamento',
      moving_to_dest: '🚜 Verso Destinazione',
      unloading: '📤 Scaricamento'
    };

    const label = labels[this.missionState.phase] || this.missionState.phase;

    this.ctx.fillStyle = '#f9fafb';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT - 20);
  }
}
