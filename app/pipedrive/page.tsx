'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { LoadingAnimation } from '@/app/components/LoadingAnimation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RoleGuard } from '@/app/components/RoleGuard';
import { Button } from '@/app/components/ui/button';
import { LeaseDetailsModal } from '@/app/components/LeaseDetailsModal';
import { ChevronRight, ChevronLeft, MoreVertical, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useNotifications } from '@/app/contexts/NotificationContext';

type Status = {
  id: number;
  name: string;
};

type Lease = {
  id: number;
  customerName: string;
  startDate: string;
  endDate: string;
  amount: number;
  statusId: number;
  status: {
    name: string;
  };
  mediaSpace: {
    id: number;
    name: string;
    mediaItem: {
      type: string;
      dimensions: string;
      mediaItemType?: {
        id: number;
      };
    };
    store: {
      name: string;
      location: string;
    };
  };
  order: {
    id: number;
    user: {
      name: string;
      email: string;
    };
    createdAt: string;
  };
  extraInformation: {
    providerInfo: string;
    productDetails: string;
    campaignRedirect: string;
    marketingGoals: string;
    disclaimer: string;
    productUrl: string;
    targetAudience: string;
    brandGraphics: string;
    providerContact: string;
    billingType: string[];
    giftCampaignDetails: string;
    planAlaMedida: string;
  };
  createdAt: string;
  updatedAt: string;
};

export default function PipedrivePage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingLeaseId, setUpdatingLeaseId] = useState<number | null>(null);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [noveyEmail, setNoveyEmail] = useState('');
  const [cochezEmail, setCochezEmail] = useState('');
  const { addNotification } = useNotifications();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch statuses and leases on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both statuses and leases in parallel
        const [statusesRes, leasesRes] = await Promise.all([
          fetch('/api/statuses'), // Gets status buckets from DB (Recibido, Asignado, etc)
          fetch('/api/leases')    // Gets all leases
        ]);

        const statusesData = await statusesRes.json();
        const leasesData = await leasesRes.json();

        // Set the statuses and leases in state
        setStatuses(Array.isArray(statusesData) ? statusesData : []);
        setLeases(Array.isArray(leasesData) ? leasesData : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setStatuses([]);
        setLeases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const moveToStatus = async (leaseId: number, currentStatusId: number, direction: 'next' | 'prev') => {
    const currentStatusIndex = statuses.findIndex(s => s.id === currentStatusId);
    if (currentStatusIndex === -1) return;

    const newStatusIndex = direction === 'next' ? currentStatusIndex + 1 : currentStatusIndex - 1;
    if (newStatusIndex < 0 || newStatusIndex >= statuses.length) return;

    const newStatusId = statuses[newStatusIndex].id;

    setUpdatingLeaseId(leaseId);
    try {
      const response = await fetch(`/api/leases/${leaseId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statusId: newStatusId }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      await refreshData();
    } catch (error) {
      console.error('Error updating lease status:', error);
      await refreshData();
    } finally {
      setUpdatingLeaseId(null);
      await refreshData();
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const [statusesRes, leasesRes] = await Promise.all([
        fetch('/api/statuses'),
        fetch('/api/leases')
      ]);

      const statusesData = await statusesRes.json();
      const leasesData = await leasesRes.json();

      setStatuses(Array.isArray(statusesData) ? statusesData : []);
      setLeases(Array.isArray(leasesData) ? leasesData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setStatuses([]);
      setLeases([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/notification-settings');
      const settings = await response.json();
      
      settings.forEach((setting: { brandId: number; email: string }) => {
        if (setting.brandId === 2) setNoveyEmail(setting.email);
        if (setting.brandId === 3) setCochezEmail(setting.email);
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save Novey settings
      if (noveyEmail) {
        const noveyResponse = await fetch('/api/notification-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandId: 2, email: noveyEmail })
        });

        if (!noveyResponse.ok) throw new Error('Failed to save Novey settings');
      }

      // Save Cochez settings
      if (cochezEmail) {
        const cochezResponse = await fetch('/api/notification-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandId: 3, email: cochezEmail })
        });

        if (!cochezResponse.ok) throw new Error('Failed to save Cochez settings');
      }

      addNotification('Configuración guardada exitosamente');
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      addNotification('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const testEmail = async (email: string) => {
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) throw new Error('Failed to send test email');
      addNotification('Email de prueba enviado correctamente');
    } catch (error) {
      console.error('Error sending test email:', error);
      addNotification('Error al enviar email de prueba');
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) return <LoadingAnimation />;

  return (
    <RoleGuard allowedRoles={['ADMIN', 'ASSOCIATE']}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pipeline de Solicitudes</h1>
          <div className="flex items-center gap-2">
            <Button 
              onClick={refreshData}
              disabled={loading}
            >
              Actualizar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {Array.isArray(statuses) && statuses.filter(s => s.id !== 7).map((status, statusIndex) => (
              <div key={status.id} className="bg-gray-100 rounded-lg p-4 w-[300px]">
                <h2 className="font-semibold mb-4">{status.name}</h2>
                
                <div className="space-y-2">
                  {Array.isArray(leases) && leases
                    .filter(lease => lease.statusId === status.id)
                    .map((lease) => (
                      <Card 
                        key={lease.id}
                        className={`p-2 bg-white shadow-sm hover:shadow-md transition-shadow relative ${
                          updatingLeaseId === lease.id ? 'opacity-50' : ''
                        }`}
                      >
                        {updatingLeaseId === lease.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                            <LoadingAnimation />
                          </div>
                        )}
                        
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{lease.customerName}</p>
                              <div className="flex items-center text-xs text-gray-600 gap-1 truncate">
                                <span className="truncate max-w-[120px]">{lease.mediaSpace.store.name}</span>
                                <span className="flex-shrink-0">•</span>
                                <span className="truncate">{lease.mediaSpace.mediaItem.type}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedLease(lease)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 flex-shrink-0"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2 pt-2 border-t">
                            <span className="text-xs text-gray-500 truncate max-w-[150px]">
                              {format(new Date(lease.startDate), 'dd/MM/yy')} - {format(new Date(lease.endDate), 'dd/MM/yy')}
                            </span>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveToStatus(lease.id, status.id, 'prev')}
                                disabled={statusIndex === 0 || updatingLeaseId === lease.id}
                                className="px-1.5 py-0.5 h-auto"
                              >
                                <ChevronLeft size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveToStatus(lease.id, status.id, 'next')}
                                disabled={statusIndex === statuses.length - 1 || updatingLeaseId === lease.id}
                                className="px-1.5 py-0.5 h-auto"
                              >
                                <ChevronRight size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <LeaseDetailsModal
          lease={selectedLease}
          isOpen={!!selectedLease}
          onClose={() => setSelectedLease(null)}
        />

        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configuración de Notificaciones</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email para Novey</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="ejemplo@novey.com"
                    value={noveyEmail}
                    onChange={(e) => setNoveyEmail(e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => testEmail(noveyEmail)}
                    disabled={!noveyEmail}
                  >
                    Probar
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email para Cochez</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="ejemplo@cochez.com"
                    value={cochezEmail}
                    onChange={(e) => setCochezEmail(e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => testEmail(cochezEmail)}
                    disabled={!cochezEmail}
                  >
                    Probar
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={saveSettings} 
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
} 