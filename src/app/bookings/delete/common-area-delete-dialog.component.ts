import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonArea } from '../../core/models/booking.model';

export interface CommonAreaDeleteDialogData {
  area: CommonArea;
}

@Component({
  selector: 'app-common-area-delete-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Eliminar área común</h2>

    <mat-dialog-content class="dialog-body">
      <div class="area-name">
        <mat-icon>apartment</mat-icon>
        <span>{{ data.area.name }}</span>
      </div>
      <p class="message">
        ¿Está seguro de que desea eliminar esta área común? Esta acción no se puede deshacer.
      </p>
      <div class="warning-box">
        <mat-icon color="warn">warning</mat-icon>
        <span>
          Las reservas activas o pendientes asociadas a esta área podrían verse afectadas.
          Verifique que no existan reservas vigentes antes de continuar.
        </span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="warn" type="button" [mat-dialog-close]="true">
        <mat-icon>delete</mat-icon>
        Eliminar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-body {
      min-width: 360px;
      max-width: 460px;
    }
    .area-name {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.05rem;
      font-weight: 500;
      margin-bottom: 12px;
    }
    .message {
      margin: 0 0 12px;
      color: rgba(0, 0, 0, 0.7);
      font-size: 0.9rem;
    }
    .warning-box {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: rgba(244, 67, 54, 0.06);
      border: 1px solid rgba(244, 67, 54, 0.2);
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 0.85rem;
      color: rgba(0, 0, 0, 0.65);
      line-height: 1.4;
    }
    .warning-box mat-icon {
      flex-shrink: 0;
      margin-top: 1px;
    }
  `],
})
export class CommonAreaDeleteDialogComponent {
  readonly data = inject<CommonAreaDeleteDialogData>(MAT_DIALOG_DATA);
}
