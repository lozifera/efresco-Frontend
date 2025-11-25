import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(c => c.HomeComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./pages/auth/register/register.component').then(c => c.RegisterComponent)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(c => c.ProfileComponent)
  },
  {
    path: 'test-upload',
    loadComponent: () => import('./shared/components/test-upload.component').then(c => c.TestUploadComponent)
  },
  {
    path: 'favoritos',
    loadComponent: () => import('./pages/favoritos/favoritos.component').then(c => c.FavoritosComponent)
  },
  {
    path: 'anuncios',
    loadComponent: () => import('./pages/anuncios/anuncios-venta.component').then(c => c.AnunciosVentaComponent)
  },
  {
    path: 'anuncios/venta',
    loadComponent: () => import('./pages/anuncios/anuncios-venta.component').then(c => c.AnunciosVentaComponent)
  },
  {
    path: 'anuncios/venta/crear',
    loadComponent: () => import('./pages/anuncios/crear-anuncio-venta.component').then(c => c.CrearAnuncioVentaComponent)
  },
  {
    path: 'anuncios/compra',
    loadComponent: () => import('./pages/anuncios/anuncios-compra.component').then(c => c.AnunciosCompraComponent)
  },
  {
    path: 'anuncios/compra/crear',
    loadComponent: () => import('./pages/anuncios/crear-anuncio-compra.component').then(c => c.CrearAnuncioCompraComponent)
  },
  {
    path: 'anuncios/crear',
    loadComponent: () => import('./pages/anuncios/crear-anuncio-venta.component').then(c => c.CrearAnuncioVentaComponent)
  },
  {
    path: 'mis-pedidos',
    loadComponent: () => import('./pages/pedidos/mis-pedidos.component').then(c => c.MisPedidosComponent)
  },
  {
    path: 'pedidos/crear',
    loadComponent: () => import('./pages/pedidos/crear-pedido.component').then(c => c.CrearPedidoComponent)
  },
  {
    path: 'pedidos/crear/:anuncioId',
    loadComponent: () => import('./pages/pedidos/crear-pedido.component').then(c => c.CrearPedidoComponent)
  },
  {
    path: 'chat',
    loadComponent: () => import('./pages/chat/chat.component').then(c => c.ChatComponent)
  },
  {
    path: 'reputacion',
    loadComponent: () => import('./pages/reputacion/reputacion.component').then(c => c.ReputacionComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then(c => c.AdminComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/productos/crear',
    loadComponent: () => import('./pages/admin/crear-producto.component').then(c => c.CrearProductoComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/productos/editar/:id',
    loadComponent: () => import('./pages/admin/editar-producto.component').then(c => c.EditarProductoComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/productos/:id',
    loadComponent: () => import('./pages/admin/ver-producto.component').then(c => c.VerProductoComponent),
    canActivate: [adminGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
