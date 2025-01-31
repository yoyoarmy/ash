'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Store, DollarSign, Plus } from 'lucide-react';
import { LoadingAnimation } from "@/app/components/LoadingAnimation";
import { RoleGuard } from '../../components/RoleGuard';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

type Lease = {
  id: number;
  startDate: string;
  endDate: string;
  amount: number;
  statusId: number;
  mediaSpace: {
    mediaItem: {
      type: string;
      format: string;
    };
    store: {
      name: string;
      location: string;
    };
  };
};

const getStatusName = (statusId: number) => {
  switch (statusId) {
    case 1:
      return 'Recibido';
    case 2:
      return 'Asignado';
    case 3:
      return 'Encendido';
    case 4:
      return 'Evidencia Enviada';
    case 5:
      return 'Reporte Enviado';
    case 6:
      return 'Facturado';
    case 7:
      return 'Completado';
    default:
      return 'Estado Desconocido';
  }
};

export default function MyLeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchMyLeases = async () => {
      try {
        const response = await fetch('/api/leases/my-leases');
        const data = await response.json();
        console.log('Leases data:', data.map(lease => ({
          id: lease.id,
          statusId: lease.statusId,
          statusName: getStatusName(lease.statusId)
        })));
        setLeases(data);
      } catch (err) {
        console.error('Error al cargar arriendos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyLeases();
  }, []);

  if (isLoading) return <LoadingAnimation />;

  return (
    <RoleGuard allowedRoles={['ADVERTISER']}>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Mis Solicitudes</h1>
          <Link href="/leasing">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4" />
              Nueva Solicitud
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          {leases.map(lease => (
            <Card 
              key={lease.id} 
              className="bg-white hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Store className="h-4 w-4" />
                      <span className="text-sm font-medium">Ubicación</span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {lease.mediaSpace.mediaItem.type}
                      <span className="block text-sm text-gray-500">
                        {lease.mediaSpace.store.name} - {lease.mediaSpace.store.location}
                      </span>
                      <span className="block text-sm text-gray-500">
                        Formato: {lease.mediaSpace.mediaItem.format}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Duración</span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {format(new Date(lease.startDate), 'd MMM yyyy', { locale: es })}
                      <span className="block text-sm text-gray-500">
                        hasta {format(new Date(lease.endDate), 'd MMM yyyy', { locale: es })}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm font-medium">Estado</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">
                        ${lease.amount.toLocaleString()}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        getStatusName(lease.statusId) === 'Recibido' ? 'bg-red-100 text-red-800' :
                        getStatusName(lease.statusId) === 'Asignado' ? 'bg-orange-100 text-orange-800' :
                        getStatusName(lease.statusId) === 'Encendido' ? 'bg-amber-100 text-amber-800' :
                        getStatusName(lease.statusId) === 'Evidencia Enviada' ? 'bg-yellow-100 text-yellow-800' :
                        getStatusName(lease.statusId) === 'Reporte Enviado' ? 'bg-lime-100 text-lime-800' :
                        getStatusName(lease.statusId) === 'Facturado' ? 'bg-emerald-100 text-emerald-800' :
                        getStatusName(lease.statusId) === 'Completado' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusName(lease.statusId)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {leases.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No tienes solicitudes activas</p>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
} 