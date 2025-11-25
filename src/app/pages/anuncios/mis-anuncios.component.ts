import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AnunciosService } from '../../core/services/anuncios.service';

@Component({
  selector: 'app-mis-anuncios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-anuncios.component.html',
  styleUrl: './mis-anuncios.component.scss'
})
export class MisAnunciosComponent implements OnInit {
  anuncios: any[] = [];
  tipo: 'venta' | 'compra' = 'venta';
  isLoading = false;
  error = '';

  constructor(private anunciosService: AnunciosService, public router: Router) {}

  ngOnInit(): void {
    this.cargarAnuncios();
  }

  cambiarTipo(tipo: 'venta' | 'compra') {
    this.tipo = tipo;
    this.cargarAnuncios();
  }

  cargarAnuncios() {
    this.isLoading = true;
    this.error = '';
    this.anunciosService.getMisAnunciosGeneral(this.tipo).subscribe({
      next: (resp) => {
        this.anuncios = resp.anuncios || [];
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Error al cargar tus anuncios';
        this.isLoading = false;
      }
    });
  }
}
