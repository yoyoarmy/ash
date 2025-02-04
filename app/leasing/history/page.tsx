'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingAnimation } from '@/app/components/LoadingAnimation';
import { Input } from '@/app/components/ui/input';
import { Search } from 'lucide-react';
import { LeaseDetailsModal } from '@/app/components/LeaseDetailsModal';
import { Button } from '@/app/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useNotifications } from '@/app/contexts/NotificationContext';

const getStatusClass = (status: any) => {
  if (!status?.name) return 'bg-gray-100 text-gray-800';
  
  switch (status.name) {
    case 'Recibido':
      return 'bg-red-100 text-red-800';
    case 'Asignado':
      return 'bg-orange-100 text-orange-800';
    case 'Encendido':
      return 'bg-amber-100 text-amber-800';
    case 'Evidencia Enviada':
      return 'bg-yellow-100 text-yellow-800';
    case 'Reporte Enviado':
      return 'bg-lime-100 text-lime-800';
    case 'Facturado':
      return 'bg-emerald-100 text-emerald-800';
    case 'Completado':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function LeaseHistoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLease, setSelectedLease] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Redirect advertisers to my-leases
    if (session?.user?.role === 'ADVERTISER') {
      router.replace('/leasing/my-leases');
      return;
    }

    const fetchOrders = async () => {
      if (!session?.user) return;

      try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchOrders();
    }
  }, [session, router]);

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    
    // Check order number
    if (order.id.toString().includes(searchLower)) {
      return true;
    }
    
    // Search in order leases
    return order.leases.some(lease => 
      lease.id.toString().includes(searchLower) || // Search by lease number
      lease.customerName.toLowerCase().includes(searchLower) ||
      lease.mediaSpace.store.name.toLowerCase().includes(searchLower) ||
      lease.mediaSpace.mediaItem.type.toLowerCase().includes(searchLower)
    );
  });

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta solicitud?')) {
      return;
    }

    setIsDeleting(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      // Refresh the orders list
      const updatedOrders = orders.filter(order => order.id !== orderId);
      setOrders(updatedOrders);
      addNotification('Solicitud eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting order:', error);
      addNotification('Error al eliminar la solicitud');
    } finally {
      setIsDeleting(null);
    }
  };

  const fetchLeaseDetails = async (leaseId: number) => {
    try {
      const response = await fetch(`/api/leases/${leaseId}`);
      if (!response.ok) throw new Error('Failed to fetch lease details');
      const data = await response.json();
      setSelectedLease(data);
    } catch (error) {
      console.error('Error fetching lease details:', error);
      addNotification('Error al cargar los detalles del arriendo');
    }
  };

  if (loading) return <LoadingAnimation />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Historial de Solicitudes</h1>

      <div className="relative mb-6 mr-20">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          type="text"
          placeholder="Buscar por #orden, #lease, cliente, tienda o tipo de medio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full max-w-xl"
        />
      </div>
      
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          {searchTerm ? 'No se encontraron resultados' : 'No hay solicitudes para mostrar'}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map(order => {
            const totalAmount = order.leases.reduce((sum, lease) => sum + lease.amount, 0);
            
            return (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Numero de Orden #{order.id}</h3>
                    <p className="text-sm text-gray-500">Fecha de Creación:
                      {format(new Date(order.createdAt), ' dd MMM yyyy, HH:mm', { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold">
                      ${totalAmount.toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteOrder(order.id)}
                      disabled={isDeleting === order.id}
                    >
                      {isDeleting === order.id ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.leases.map(lease => (
                    <div 
                      key={lease.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={async () => {
                        await fetchLeaseDetails(lease.id);
                        setSelectedOrder(order);
                      }}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{lease.customerName}</h3>
                          <p className="text-sm text-gray-600">
                            {lease.mediaSpace?.store?.name ?? 'Store N/A'} - {lease.mediaSpace?.mediaItem?.type ?? 'Type N/A'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {lease.extraInformation?.planAlaMedida ? (
                              <span className="text-gray-600">
                                Plan a la Medida URL: {lease.extraInformation.planAlaMedida}
                              </span>
                            ) : (
                              lease.mediaSpace?.mediaItem?.dimensions
                            )}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(lease.startDate), 'd MMM', { locale: es })} - {
                              format(new Date(lease.endDate), 'd MMM yyyy', { locale: es })
                            }
                          </p>
                          
                          
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                            getStatusClass(lease.status)
                          }`}>
                            {lease.status?.name || 'Estado Desconocido'}
                          </span>
                          <p className="text-sm font-medium mt-1">
                            ${(lease.extraInformation?.planAlaMedidaAmount || lease.amount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LeaseDetailsModal
        lease={selectedLease}
        isOpen={!!selectedLease}
        onClose={() => setSelectedLease(null)}
      />
    </div>
  );
} 