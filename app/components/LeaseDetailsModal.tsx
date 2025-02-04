'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

type LeaseDetailsModalProps = {
  lease: Lease;
  isOpen: boolean;
  onClose: () => void;
};

export function LeaseDetailsModal({ lease, isOpen, onClose }: LeaseDetailsModalProps) {
  if (!lease) return null;

  // Add this debug log
  console.log('Lease details:', {
    mediaItemType: lease.mediaSpace?.mediaItem?.mediaItemType,
    type: lease.mediaSpace?.mediaItem?.type,
    dimensions: lease.mediaSpace?.mediaItem?.dimensions
  });

  // Get status name safely
  const statusName = lease.status?.name || lease.status || 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de la Solicitud</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="font-semibold mb-3">Información Básica</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Lease #</p>
                <p className="font-medium">{lease.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium">{lease.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <p className="font-medium">{lease.status?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Solicitud #</p>
                <p className="font-medium">{lease.order?.id || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium truncate">{lease.order?.user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Procesado por</p>
                <p className="font-medium">{lease.order?.user?.name || '-'}</p>
              </div>
            </div>
          </div>

          {/* Client and Dates Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Monto</h3>
              <p>${lease.amount.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Fecha Inicio</h3>
              <p>{format(new Date(lease.startDate), 'dd MMM yyyy', { locale: es })}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Fecha Fin</h3>
              <p>{format(new Date(lease.endDate), 'dd MMM yyyy', { locale: es })}</p>
            </div>
          </div>

          {/* Media Space Information */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Información del Espacio</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tienda</p>
                <p>{lease.mediaSpace?.store?.name || 'N/A'}</p>
                <p className="text-sm text-gray-500 mt-2">Ubicación</p>
                <p>{lease.mediaSpace?.store?.location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de Medio</p>
                <p>{lease.mediaSpace?.mediaItem?.type || 'N/A'}</p>

                {lease.extraInformation?.planAlaMedida ? (
                  <>
                    <p className="text-sm text-gray-500 mt-2">Plan a la Medida URL</p>
                    <a href={lease.extraInformation.planAlaMedida} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {lease.extraInformation.planAlaMedida}
                    </a>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mt-2">Dimensiones</p>
                    <p>{lease.mediaSpace?.mediaItem?.dimensions || 'N/A'}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Campaign Information */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Información de Campaña</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Información del Proveedor</p>
                <p>{lease.extraInformation?.providerInfo || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Detalles del Producto</p>
                <p>{lease.extraInformation?.productDetails || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Redirección de Campaña</p>
                <p>{lease.extraInformation?.campaignRedirect || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Objetivos de Marketing</p>
                <p>{lease.extraInformation?.marketingGoals || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">URL del Producto</p>
                <p>{lease.extraInformation?.productUrl || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Público Objetivo</p>
                <p>{lease.extraInformation?.targetAudience || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Información Adicional</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Línea Gráfica</p>
                <p>{lease.extraInformation?.brandGraphics || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contacto del Proveedor</p>
                <p>{lease.extraInformation?.providerContact || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de Facturación</p>
                <p>{lease.extraInformation?.billingType.join(', ') || 'N/A'}</p>
              </div>
              {lease.extraInformation?.billingType.includes('GIFT') && (
                <div>
                  <p className="text-sm text-gray-500">Detalles de Regalía</p>
                  <p>{lease.extraInformation?.giftCampaignDetails || 'N/A'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t pt-4 text-sm text-gray-500">
            <p>Creado: {format(new Date(lease.createdAt), 'dd MMM yyyy HH:mm', { locale: es })}</p>
            <p>Última actualización: {format(new Date(lease.updatedAt), 'dd MMM yyyy HH:mm', { locale: es })}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 