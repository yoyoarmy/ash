'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { LoadingAnimation } from '@/app/components/LoadingAnimation';
import { RoleGuard } from '@/app/components/RoleGuard';
import { useSession } from 'next-auth/react';

type Lease = {
  id: number;
  customerName: string;
  mediaSpace: {
    store: {
      name: string;
    };
    mediaItem: {
      type: string;
    };
  };
  extraInformation: {
    campaignRedirect: string;
  };
};

export default function RedirectPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    const fetchLease = async () => {
      try {
        const response = await fetch(`/api/leases/${params.id}`);
        if (!response.ok) throw new Error('Lease not found');
        const data = await response.json();
        setLease(data);
        setRedirectUrl("Producto que se desea destacar dentro de la marca (Nombre + SKU)");
      } catch (error) {
        console.error('Error fetching lease:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchLease();
    }
  }, [params.id]);

  const handleUpdate = async () => {
    if (!lease) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/leases/${lease.id}/redirect`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignRedirect: redirectUrl,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      // Send notification using the proper endpoint
      await fetch(`/api/leases/${lease.id}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lease,
          redirectUrl
        }),
      });

      setLease(prev => prev ? {
        ...prev,
        extraInformation: {
          ...prev.extraInformation,
          campaignRedirect: redirectUrl
        }
      } : null);

      alert('Redirección de Campaña actualizada exitosamente');
    } catch (error) {
      console.error('Error updating lease:', error);
      alert('Error al actualizar la redirección');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingAnimation />;
  if (!lease) return <div className="p-6 bg-white">Lease not found</div>;

  return (
    <RoleGuard allowedRoles={['ADMIN', 'ASSOCIATE']}>
      <div className="min-h-screen p-6 bg-white">
        <div className="max-w-2xl mx-auto bg-white">
          <Card>
            <CardHeader className="bg-white">
              <CardTitle>Actualizar Redirección de Campaña</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div className="space-y-2 bg-white">
                <h3 className="font-medium">Detalles de la Solicitud</h3>
                <p className="text-sm text-gray-600">Lease #{lease.id}</p>
                <p className="text-sm text-gray-600">Cliente: {lease.customerName}</p>
                <p className="text-sm text-gray-600">
                  Tienda: {lease.mediaSpace.store.name}
                </p>
                <p className="text-sm text-gray-600">
                  Tipo de Medio: {lease.mediaSpace.mediaItem.type}
                </p>
              </div>

              <div className="space-y-2 bg-white">
                <label className="text-sm font-medium">
                  Redirección de Campaña
                </label>
                <div className="flex flex-col gap-4">
                  <input
                    type="url" 
                    value={redirectUrl}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                    placeholder="Ingrese la URL de redirección"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <Button 
                onClick={handleUpdate}
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Actualizando...' : 'Actualizar Redirección'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}