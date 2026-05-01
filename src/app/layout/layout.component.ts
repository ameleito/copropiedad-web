import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';
import { SidenavMenuComponent } from '../shared/components/sidenav-menu/sidenav-menu.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [NavbarComponent, SidenavMenuComponent, RouterOutlet, MatSidenavModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  toggleSidenav(): void {
    this.sidenav.toggle();
  }

  closeSidenav(): void {
    this.sidenav.close();
  }
}
