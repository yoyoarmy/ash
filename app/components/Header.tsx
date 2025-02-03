'use client';

import { Bell, User, LogOut, ShoppingCart, X } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { format } from 'date-fns';
import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '../contexts/CartContext';
import { es } from 'date-fns/locale';
import { Button } from './ui/button';

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { notifications, unreadCount, markAsRead, clearNotification } = useNotifications();
  const { data: session } = useSession();
  const pathname = usePathname();
  const { itemCount, items, removeItem, clearCart, formData } = useCart();
  const [showCart, setShowCart] = useState(false);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isExactLeasingPage = pathname === '/leasing';

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      notifications.forEach(notif => {
        if (!notif.read) markAsRead(notif.id);
      });
    }
  };

  const handleCreateOrder = async () => {
    if (items.length === 0 || !session?.user) return;
    
    if (!formData) {
      alert('Por favor complete el formulario de información adicional primero.');
      return;
    }

    if (!formData.customerName.trim()) {
      alert('Por favor ingrese el nombre del cliente.');
      return;
    }

    setIsSubmitting(true);
    try {
      // First create the order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const order = await orderResponse.json();
      console.log('Order created:', order);

      // Wait for 1 second before creating leases
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then create leases sequentially instead of in parallel
      for (const item of items) {
        await fetch('/api/leases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mediaSpaceId: item.spaceId,
            customerName: formData.customerName,
            startDate: item.startDate,
            endDate: item.endDate,
            amount: item.amount,
            statusId: 1, // pending status
            orderId: order.id,
            extraInformation: {
              providerInfo: formData.providerInfo,
              productDetails: formData.productDetails,
              campaignRedirect: formData.campaignRedirect,
              marketingGoals: formData.marketingGoals,
              disclaimer: formData.disclaimer,
              productUrl: formData.productUrl,
              targetAudience: formData.targetAudience,
              brandGraphics: formData.brandGraphics || '',
              providerContact: formData.providerContact,
              billingType: formData.billingType,
              giftCampaignDetails: formData.giftCampaignDetails || '',
              planAlaMedida: formData.planAlaMedida || '',
              planAlaMedidaAmount: formData.planAlaMedidaAmount || ''
            }
          })
        });
      }
      
      clearCart();
      setShowCart(false);
      if (session?.user?.role === 'ADVERTISER') {
        router.push('/leasing/my-leases');
      } else {
        router.push('/leasing/history');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error al crear la solicitud. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold">Gestor de Medios Publicitarios</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isExactLeasingPage && (
              <button className="p-2 text-gray-600 hover:text-gray-900 relative" onClick={() => setShowCart(true)}>
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            )}
            <div className="relative">
              <button
                onClick={handleBellClick}
                className="p-2 hover:bg-gray-100 rounded-full relative"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Notificaciones</h3>
                    {notifications.length === 0 ? (
                      <p className="text-gray-500">No hay notificaciones</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3 rounded-lg ${
                              notif.read ? 'bg-gray-50' : 'bg-blue-50'
                            }`}
                          >
                            <p className="text-sm">{notif.message}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-500">
                                {format(notif.timestamp, 'MMM d, h:mm a')}
                              </span>
                              <button
                                onClick={() => clearNotification(notif.id)}
                                className="text-xs text-gray-400 hover:text-gray-600"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 hover:bg-gray-100 rounded-full flex items-center gap-2"
              >
                <User className="h-6 w-6" />
                {session?.user?.name && (
                  <span className="text-sm font-medium">{session.user.name}</span>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="p-2">
                    {session?.user?.role === 'ADMIN' ? (
                      <>
                        <div className="px-4 py-2 text-sm text-gray-500">
                          Conectado como<br />
                          <span className="font-medium text-gray-900 truncate w-full block">
                          {session.user.email}
                        </span>
                        </div>
                        <div className="border-t border-gray-100 my-1"></div>
                        <Link
                          href="/register"
                          className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                        >
                          Crear Usuario
                        </Link>
                        <button
                          onClick={() => signOut()}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2 relative z-9999"
                        >
                          <LogOut className="h-4 w-4" />
                          Cerrar Sesión
        </button>
                      </>
                    ) : session?.user ? (
                      <>
                        <div className="px-4 py-2 text-sm text-gray-500">
                          Conectado como<br />
                          <span className="font-medium text-gray-900">
                            {session.user.email}
                          </span>
                        </div>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                        onClick={() => signOut()}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2 relative z-9999"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar Sesión
                      </button>

                      </>
                    ) : (
                      <Link
                        href="/login"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        Sign in
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-[800px] w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Carrito de Solicitudes</h3>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length > 0 ? (
              <>
                <div className="space-y-4 mb-6">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{item.mediaType}</h4>
                        <p className="text-sm text-gray-600">{item.storeName}</p>
                        <p className="text-sm text-gray-600">
                          {format(item.startDate, 'd MMM', { locale: es })} - {
                            format(item.endDate, 'd MMM yyyy', { locale: es })
                          }
                        </p>
                        <p className="text-sm font-medium">${item.amount.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.spaceId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Total:</span>
                    <span className="font-medium">${totalAmount.toLocaleString()}</span>
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleCreateOrder}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Procesando...' : 'Confirmar Solicitud'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No hay items en el carrito
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

