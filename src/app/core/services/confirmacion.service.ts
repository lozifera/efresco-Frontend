import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  constructor(private http: HttpClient) {}

  confirmarTrato(tipo: 'venta' | 'compra', id: number, mensaje: string): Observable<any> {
    return this.http.post(`/api/anuncios/${tipo}/${id}/confirmar`, { mensaje });
  }
}
