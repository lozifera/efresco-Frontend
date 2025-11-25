import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatService, Chat, Mensaje, CrearChatRequest, EnviarMensajeRequest } from '../../core/services/chat.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked, OnChanges {
  @ViewChild('mensajesContainer') private mensajesContainer!: ElementRef;
  @ViewChild('mensajeInput') private mensajeInput!: ElementRef;

  // Estados del componente
  chats: Chat[] = [];
  chatActivo: Chat | null = null;
  mensajes: Mensaje[] = [];
  isLoading = true;
  isLoadingMensajes = false;
  isSendingMessage = false;

  // Usuario actual
  currentUser: any = null;

  // Formulario de mensaje
  nuevoMensaje = '';

  // Control de destrucción
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  // Parámetros de la URL
  @Input() destinatarioId: number | null = null;

  constructor(
    private chatService: ChatService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}


  ngOnInit(): void {
    this.initializeUser();
    this.subscribeToChats();
    this.subscribeToMensajes();
    this.loadChats();
    if (this.destinatarioId) {
      this.buscarOCrearChatConDestinatario();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['destinatarioId'] && this.destinatarioId) {
      this.buscarOCrearChatConDestinatario();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatService.cerrarChatActivo();
  }

  private initializeUser(): void {
    // Simulamos el usuario actual
    this.currentUser = {
      id_usuario: 1,
      nombre: 'Juan Carlos Pérez',
      imagen_perfil: 'https://via.placeholder.com/40x40/22c55e/ffffff?text=JP'
    };
  }

  // subscribeToRoute eliminado, ahora destinatarioId viene por @Input

  private subscribeToChats(): void {
    this.chatService.chats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(chats => {
      this.chats = chats;

      // Si hay un destinatario específico, buscar o crear chat
      if (this.destinatarioId && chats.length > 0) {
        this.buscarOCrearChatConDestinatario();
      }
    });
  }

  private subscribeToMensajes(): void {
    this.chatService.mensajes$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(mensajes => {
      this.mensajes = mensajes;
      this.shouldScrollToBottom = true;
      this.isLoadingMensajes = false;

      // Marcar mensajes como leídos si el chat está activo
      if (this.chatActivo && mensajes.length > 0) {
        this.marcarMensajesComoLeidos();
      }
    });
  }

  private loadChats(): void {
    this.chatService.getMisChats().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading chats:', error);
        this.notificationService.error('Error', 'No se pudieron cargar los chats');
        this.isLoading = false;
      }
    });
  }

  private buscarOCrearChatConDestinatario(): void {
    this.chatService.buscarChatConUsuario(this.destinatarioId!).pipe(
      takeUntil(this.destroy$)
    ).subscribe(chatExistente => {
      if (chatExistente) {
        this.seleccionarChat(chatExistente);
      } else {
        this.crearNuevoChat();
      }
    });
  }

  private crearNuevoChat(): void {
    if (!this.destinatarioId) return;

    const request: CrearChatRequest = {
      id_usuario_destinatario: this.destinatarioId
    };

    this.chatService.crearChat(request).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.seleccionarChat(response.data);
          this.notificationService.success('Chat creado', 'Ahora puedes conversar con este usuario');
        }
      },
      error: (error) => {
        console.error('Error creating chat:', error);
        this.notificationService.error('Error', 'No se pudo crear el chat');
      }
    });
  }

  seleccionarChat(chat: Chat): void {
    this.chatActivo = chat;
    this.chatService.establecerChatActivo(chat);
    this.isLoadingMensajes = true;

    // Cargar mensajes del chat
    this.chatService.getMensajes(chat.id_chat).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      error: (error) => {
        console.error('Error loading messages:', error);
        this.notificationService.error('Error', 'No se pudieron cargar los mensajes');
        this.isLoadingMensajes = false;
      }
    });
  }

  enviarMensaje(): void {
    if (!this.chatActivo || !this.nuevoMensaje.trim() || this.isSendingMessage) {
      return;
    }

    const request: EnviarMensajeRequest = {
      contenido: this.nuevoMensaje.trim(),
      tipo_mensaje: 'texto'
    };

    this.isSendingMessage = true;

    this.chatService.enviarMensaje(this.chatActivo.id_chat, request).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.nuevoMensaje = '';
        this.isSendingMessage = false;
        this.shouldScrollToBottom = true;

        // Enfocar el input de mensaje
        if (this.mensajeInput) {
          this.mensajeInput.nativeElement.focus();
        }
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.notificationService.error('Error', 'No se pudo enviar el mensaje');
        this.isSendingMessage = false;
      }
    });
  }

  private marcarMensajesComoLeidos(): void {
    if (!this.chatActivo) return;

    const mensajesNoLeidos = this.mensajes.filter(m =>
      !m.leido && m.id_usuario_remitente !== this.currentUser.id_usuario
    );

    if (mensajesNoLeidos.length > 0) {
      this.chatService.marcarMensajesComoLeidos(this.chatActivo.id_chat).subscribe();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.mensajesContainer) {
        this.mensajesContainer.nativeElement.scrollTop = this.mensajesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  onMensajeKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  getOtroUsuario(chat: Chat): any {
    return this.chatService.getOtroUsuarioDelChat(chat, this.currentUser.id_usuario);
  }

  esMensajePropio(mensaje: Mensaje): boolean {
    return this.chatService.esMensajePropio(mensaje, this.currentUser.id_usuario);
  }

  formatearFecha(fecha: string): string {
    return this.chatService.formatearFechaMensaje(fecha);
  }

  formatearFechaCompleta(fecha: string): string {
    const fechaMensaje = new Date(fecha);
    return fechaMensaje.toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
  }

  cerrarChat(): void {
    this.chatActivo = null;
    this.chatService.cerrarChatActivo();
  }

  volverAAnuncios(): void {
    this.router.navigate(['/anuncios/venta']);
  }

  // Funciones de utilidad para el template
  getChatPreview(chat: Chat): string {
    if (chat.ultimo_mensaje) {
      const maxLength = 50;
      return chat.ultimo_mensaje.contenido.length > maxLength
        ? chat.ultimo_mensaje.contenido.substring(0, maxLength) + '...'
        : chat.ultimo_mensaje.contenido;
    }
    return 'No hay mensajes';
  }

  tieneNuevosMensajes(chat: Chat): boolean {
    return chat.ultimo_mensaje?.leido === false &&
           chat.ultimo_mensaje?.id_usuario_remitente !== this.currentUser.id_usuario;
  }

  getMensajesSeparadosPorFecha(): { fecha: string; mensajes: Mensaje[] }[] {
    const grupos: { [fecha: string]: Mensaje[] } = {};

    this.mensajes.forEach(mensaje => {
      const fecha = new Date(mensaje.fecha_envio).toDateString();
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(mensaje);
    });

    return Object.keys(grupos).map(fecha => ({
      fecha: this.formatearFechaGrupo(fecha),
      mensajes: grupos[fecha]
    }));
  }

  private formatearFechaGrupo(fecha: string): string {
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy.getTime() - 24 * 60 * 60 * 1000);

    if (fechaObj.toDateString() === hoy.toDateString()) {
      return 'Hoy';
    } else if (fechaObj.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    } else {
      return fechaObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: fechaObj.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined
      });
    }
  }
}
