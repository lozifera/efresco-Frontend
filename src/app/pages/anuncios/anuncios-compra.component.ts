import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AnunciosService, AnunciosCompraQuery, AnunciosCompraListResponse, AnuncioCompra } from '../../core/services/anuncios.service';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-anuncios-compra',
  templateUrl: './anuncios-compra.component.html',
  styleUrls: ['./anuncios-compra.component.scss'],
  standalone: true
})

export class AnunciosCompraComponent implements OnInit {
    anuncios: AnuncioCompra[] = [];
  searchControl = new FormControl('');
  cargando = false;
  errorMensaje = '';

  // Paginación
  paginaActual = 1;
  limitePorPagina = 12;
  totalAnuncios = 0;
  totalPaginas = 0;

  // Filtros
  filtros: AnunciosCompraQuery = {
    page: 1,
    limit: this.limitePorPagina
  };

  constructor(
    private anunciosService: AnunciosService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.cargarAnuncios();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.filtros.search = searchTerm || '';
        this.paginaActual = 1;
        this.filtros.page = 1;
        this.cargarAnuncios();
      });
  }

  cargarAnuncios(): void {
    this.cargando = true;
    this.errorMensaje = '';

    this.anunciosService.getAnunciosCompra(this.filtros)
      .pipe(
        finalize(() => this.cargando = false)
      )
      .subscribe({
        next: (response: AnunciosCompraListResponse) => {
          this.anuncios = (response.anuncios || [])
            .filter(anuncio => anuncio.estado === 'activo')
            .map(anuncio => ({
              ...anuncio,
              producto: anuncio.producto ? {
                ...anuncio.producto,
                id: typeof anuncio.producto.id === 'number' ? anuncio.producto.id : 0,
                imagen: anuncio.producto.imagen_url ? anuncio.producto.imagen_url : 'assets/no-image.png'
              } : {
                id: 0,
                nombre: '',
                imagen: 'assets/no-image.png'
              }
            }));
          this.totalAnuncios = response.total || 0;
          this.totalPaginas = response.pages || Math.ceil(this.totalAnuncios / this.limitePorPagina);
        },
        error: (error) => {
          this.errorMensaje = error.error?.mensaje ||
                             error.message ||
                             'Error al cargar los anuncios de compra.';
          this.anuncios = [];
        }
      });
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.filtros.page = nuevaPagina;
      this.cargarAnuncios();

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  contactarComprador(anuncio: AnuncioCompra): void {
    // Lógica: buscar o crear chat y redirigir
    const idUsuarioDestinatario = anuncio.comprador?.id;
    if (!idUsuarioDestinatario) return;
    this.chatService.buscarChatConUsuario(idUsuarioDestinatario).subscribe(chatExistente => {
      if (chatExistente) {
        this.router.navigate(['/chat', chatExistente.id_chat]);
      } else {
        this.chatService.crearChat({ id_usuario_destinatario: idUsuarioDestinatario }).subscribe(resp => {
          if (resp.success && resp.data) {
            this.router.navigate(['/chat', resp.data.id_chat]);
          }
        });
      }
    });
  }

  contactarCompradorWhatsApp(anuncio: AnuncioCompra): void {
    this.anunciosService.contactarCompradorWhatsApp(anuncio);
  }

  verDetalles(anuncioId: number): void {
    // Implementar navegación a vista de detalles
    console.log('Ver detalles del anuncio:', anuncioId);
  }

  getEstadoTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'activo': 'Activo',
      'pausado': 'Pausado',
      'completado': 'Completado',
      'expirado': 'Expirado'
    };
    return estados[estado] || 'Desconocido';
  }

  getFechaFormateada(fecha?: string): string {
    if (!fecha) return 'Sin fecha';

    try {
      const fechaObj = new Date(fecha);
      const ahora = new Date();
      const diff = ahora.getTime() - fechaObj.getTime();
      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (dias === 0) {
        return 'Hoy';
      } else if (dias === 1) {
        return 'Ayer';
      } else if (dias < 7) {
        return `Hace ${dias} días`;
      } else {
        return fechaObj.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch {
      return 'Fecha inválida';
    }
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/producto-placeholder.png';
  }
}
