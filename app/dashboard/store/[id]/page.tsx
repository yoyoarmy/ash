'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft, Package, Clock, DollarSign, Settings, Plus, Trash2, Lightbulb, Camera, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Input } from '@/app/components/ui/input';
import { useNotifications } from '@/app/contexts/NotificationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/app/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/components/ui/select';
import { LoadingAnimation } from "@/app/components/LoadingAnimation";

interface MediaSpace {
  id: number;
  status: string;
  info?: string;
  mediaItem: {
    id: number;
    type: string;
    dimensions: string;
    basePrice: number;
    leaseDuration: number;
    capacity?: number;
  };
  leases: Array<{
    id: number;
    startDate: string;
    endDate: string;
    statusId: number;
    status: {
      name: string;
    };
    customerName: string;
    amount: number;
  }> | undefined;
  photo?: string;
}

interface Store {
  id: number;
  name: string;
  location: string;
  mediaSpaces: MediaSpace[];
  historicalRevenue: number;
}

type MediaItemType = {
  id: number;
  type: string;
  dimensions: string;
  basePrice: number;
  leaseDuration: number;
};

export default function StorePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSpaceId, setExpandedSpaceId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    location: ''
  });
  const [mediaTypes, setMediaTypes] = useState<MediaItemType[]>([]);
  const [newMediaSpace, setNewMediaSpace] = useState({
    mediaItemId: '',
    quantity: '1'
  });
  const [editingSpaceId, setEditingSpaceId] = useState<number | null>(null);
  const [editingInfo, setEditingInfo] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [editingPhotoSpaceId, setEditingPhotoSpaceId] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch(`/api/stores/${params.id}?include=mediaSpaces`);
        if (!response.ok) throw new Error('Failed to fetch store');
        const data = await response.json();
        
        // Transform the data to include capacity information
        const transformedData = {
          ...data,
          mediaSpaces: data.mediaSpaces.map((space: MediaSpace) => ({
            ...space,
            activeLeases: space.leases?.length || 0,
            capacity: space.mediaItem.capacity || 1
          }))
        };
        
        setStore(transformedData);
      } catch (error) {
        console.error('Error fetching store:', error);
        addNotification('Error loading store data');
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [params.id, addNotification]);

  useEffect(() => {
    const fetchMediaTypes = async () => {
      try {
        const response = await fetch('/api/media');
        if (!response.ok) throw new Error('Failed to fetch media types');
        const data = await response.json();
        setMediaTypes(data);
      } catch (error) {
        console.error('Error fetching media types:', error);
        addNotification('Failed to fetch media types');
      }
    };

    fetchMediaTypes();
  }, [addNotification]);

  if (loading) return <LoadingAnimation />;

  if (!store) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-800">Store not found</h2>
          <Button onClick={() => router.back()} className="mt-4">
            Atras
          </Button>
        </div>
      </div>
    );
  }

  const getMediaSpaceStats = (mediaSpaces: any[]) => {
    return mediaSpaces.reduce((acc, space) => {
      // Count total spaces
      acc.total++;

      // Check if space has any non-completed leases
      const hasActiveLease = space.leases?.some(lease => 
        lease.statusId !== 7 && 
        new Date(lease.endDate) >= new Date()
      );

      if (hasActiveLease) {
        acc.active++;
      } else {
        acc.available++;
      }

      return acc;
    }, { total: 0, available: 0, active: 0 });
  };

  const activeLeases = store.mediaSpaces.filter(space => 
    space.leases?.some(lease => 
      lease.statusId !== 7 && 
      new Date(lease.endDate) >= new Date()
    ) ?? false
  ).length;

  const totalRevenue = store.historicalRevenue || 0;

  const handleUpdateStore = async () => {
    try {
      const response = await fetch(`/api/stores/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Failed to update store');

      setStore(prev => prev ? { ...prev, ...editForm } : null);
      addNotification('Store updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating store:', error);
      addNotification('Failed to update store');
    }
  };

  const handleAddMediaSpace = async () => {
    try {
      const response = await fetch(`/api/stores/${params.id}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaItemId: parseInt(newMediaSpace.mediaItemId),
          quantity: parseInt(newMediaSpace.quantity)
        }),
      });

      if (!response.ok) throw new Error('Failed to add media space');

      const updatedStore = await fetch(`/api/stores/${params.id}`).then(res => res.json());
      setStore(updatedStore);
      addNotification('Media space added successfully');
      setNewMediaSpace({ mediaItemId: '', quantity: '1' });
    } catch (error) {
      console.error('Error adding media space:', error);
      addNotification('Failed to add media space');
    }
  };

  const handleRemoveMediaSpace = async (spaceId: number) => {
    if (!confirm('Are you sure you want to remove this media space?')) return;

    try {
      const response = await fetch(`/api/stores/${params.id}/media/${spaceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove media space');

      const updatedStore = await fetch(`/api/stores/${params.id}`).then(res => res.json());
      setStore(updatedStore);
      addNotification('Media space removed successfully');
    } catch (error) {
      console.error('Error removing media space:', error);
      addNotification('Failed to remove media space');
    }
  };

  const handleUpdateInfo = async (spaceId: number) => {
    try {
      const response = await fetch(`/api/stores/${params.id}/media/${spaceId}/info`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ info: editingInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update info');
      }

      const updatedSpace = await response.json();
      
      setStore(prev => prev ? {
        ...prev,
        mediaSpaces: prev.mediaSpaces.map(space => 
          space.id === spaceId ? { ...space, info: editingInfo } : space
        )
      } : null);

      addNotification('Info updated successfully');
      setEditingSpaceId(null);
    } catch (error) {
      console.error('Error updating info:', error);
      addNotification(error instanceof Error ? error.message : 'Failed to update info');
    }
  };

  const handleUpdatePhoto = async (mediaSpaceId: number) => {
    try {
      // Validate the URL format
      if (!photoUrl.match(/^https?:\/\/i\.imgur\.com\/[a-zA-Z0-9]+\.(jpg|jpeg|png|gif)$/)) {
        throw new Error('Please enter a valid direct Imgur image URL (right-click image and copy image address)');
      }

      const response = await fetch(`/api/media-spaces/${mediaSpaceId}/photo`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photo: photoUrl }),
      });

      if (!response.ok) throw new Error('Failed to update photo');

      // Update the local state to reflect the change
      setStore(prev => prev ? {
        ...prev,
        mediaSpaces: prev.mediaSpaces.map(space => 
          space.id === mediaSpaceId ? { ...space, photo: photoUrl } : space
        )
      } : null);

      setPhotoUrl('');
      setEditingPhotoSpaceId(null);
      addNotification("Foto actualizada correctamente");
    } catch (error) {
      console.error('Error updating photo:', error);
      addNotification(error instanceof Error ? error.message : "No se pudo actualizar la foto");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Atras
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{store?.name}</h1>
            <p className="text-gray-600">{store?.location}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-white hover:bg-gray-50"
              >
                <Package className="h-4 w-4 mr-2" />
                Editar Inventario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Manejar Inventario</DialogTitle>
              </DialogHeader>

              {/* Add New Media Space - More compact */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-3">Agregar Nuevo Espacio</h3>
                
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1.5">Tipo de Medio</label>
                    <Select
                      value={newMediaSpace.mediaItemId}
                      onValueChange={(value) => setNewMediaSpace(prev => ({ ...prev, mediaItemId: value }))}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Seleccionar tipo de medio" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto bg-white">
                        {mediaTypes.map((type) => (
                          <SelectItem 
                            key={type.id} 
                            value={type.id.toString()}
                            className="cursor-pointer hover:bg-gray-50"
                          >
                            {type.type} - {type.dimensions}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-24">
                    <label className="block text-sm text-gray-600 mb-1.5">Cantidad</label>
                    <Input
                      type="number"
                      min="1"
                      value={newMediaSpace.quantity}
                      onChange={(e) => setNewMediaSpace(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>

                  <Button
                    onClick={handleAddMediaSpace}
                    variant="outline"
                    size="default"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Espacio
                  </Button>
                </div>
              </div>

              {/* Current Inventory - With scrolling */}
              <div className="mt-6">
                <h3 className="font-medium mb-3">Inventario Actual</h3>
                <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2">
                  {store?.mediaSpaces.map((space) => (
                    <div 
                      key={space.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-white"
                    >
                      <div>
                        <h4 className="font-medium">{space.mediaItem.type}</h4>
                        <p className="text-gray-600">{space.mediaItem.dimensions}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-yellow-500"
                              onClick={() => {
                                setEditingSpaceId(space.id);
                                setEditingInfo(space.info || '');
                              }}
                            >
                              <Lightbulb className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Editar Información del Espacio</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Información Adicional
                                </label>
                                <Input
                                  placeholder="Ingrese información adicional..."
                                  value={editingInfo}
                                  onChange={(e) => setEditingInfo(e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <DialogClose asChild>
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditingSpaceId(null)}
                                  >
                                    Cancelar
                                  </Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button
                                    onClick={() => handleUpdateInfo(space.id)}
                                  >
                                    Guardar
                                  </Button>
                                </DialogClose>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-red-600"
                          onClick={() => handleRemoveMediaSpace(space.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-blue-700"
                              onClick={() => setEditingPhotoSpaceId(space.id)}
                            >
                              <Camera className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Actualizar Foto</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label htmlFor="photoUrl" className="text-sm font-medium">
                                  URL de la Foto
                                </label>
                                <Input
                                  id="photoUrl"
                                  placeholder="https://i.imgur.com/example.jpg"
                                  value={photoUrl}
                                  onChange={(e) => setPhotoUrl(e.target.value)}
                                />
                                <p className="text-xs text-gray-500">
                                  En Imgur: Click derecho en la imagen → Copiar dirección de imagen
                                </p>
                              </div>
                              <Button 
                                onClick={() => handleUpdatePhoto(space.id)}
                                className="w-full"
                              >
                                Guardar
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configuración de la Tienda</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nombre de la Tienda</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ingrese el nombre de la tienda"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Ubicación</label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ingrese la ubicación de la tienda"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className="bg-white hover:bg-gray-50"
                      onClick={() => {
                        setEditForm({ name: store?.name || '', location: store?.location || '' });
                        setIsEditing(false);
                      }}
                    >
                      Cancelar
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button 
                      className="bg-white hover:bg-gray-50 border border-gray-200"
                      onClick={handleUpdateStore}
                    >
                      Guardar Cambios
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Espacios</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {store.mediaSpaces.length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600"> Ocupados</p>
                <h3 className="text-2xl font-bold text-gray-900">{activeLeases}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Ingresos</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  ${totalRevenue.toLocaleString()}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Media Spaces List */}
      <Card className="bg-white">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold">Inventario de Medios</CardTitle>
            <div className="flex gap-2">
              <span className="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full">
                {store.mediaSpaces.filter(s => s.status === 'available').length} Disponibles
              </span>
              <span className="text-sm px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
                {store.mediaSpaces.filter(s => s.status !== 'available').length} Ocupados
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {store.mediaSpaces.map((space) => {
              const activeLeases = space.leases?.filter(lease => lease.statusId !== 7).length || 0;
              const capacity = space.mediaItem.capacity || 0;
              const availableSpots = Math.max(0, capacity - activeLeases);
              
              return (
                <div 
                  key={space.id} 
                  className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => setExpandedSpaceId(expandedSpaceId === space.id ? null : space.id)}
                >
                  {/* Header Section */}
                  <div className="border-b bg-gray-50 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {space.mediaItem.type}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Package className="h-4 w-4 text-gray-500" />
                          <p className="text-sm text-gray-600">
                            {space.mediaItem.dimensions}
                            {space.info && (
                              <>
                                <span className="mx-2">•</span>
                                <span className="text-gray-500">{space.info}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            availableSpots <= 0 
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {availableSpots < 1 ?  'Actualmente Ocupado' : 'Espacios disponibles'}
                          </span>
                          {space.photo && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-blue-700"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Vista Previa de Foto</DialogTitle>
                                </DialogHeader>
                                <div className="relative aspect-video">
                                  <img 
                                    src={space.photo} 
                                    alt={`${space.mediaItem.type} preview`}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      console.error('Error loading image:', space.photo);
                                      e.currentTarget.src = '/placeholder-image.jpg';
                                    }}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                        {space.leases && space.leases.length > 0 && (
                          <span className="text-sm text-gray-600">
                            {space.leases.length} {space.leases.length === 1 ? 'solicitud' : 'solicitudes'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex gap-4">
                      <div className="text-sm">
                        <span className="text-gray-500">Precio Base:</span>
                        <span className="ml-1 font-medium">${space.mediaItem.basePrice}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Duración:</span>
                        <span className="ml-1 font-medium">{space.mediaItem.leaseDuration} días</span>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Lease Information Section */}
                  {expandedSpaceId === space.id && space.leases && space.leases.length > 0 && (
                    <div className="p-4 bg-white">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Detalles de la Solicitud
                      </h4>
                      <div className="space-y-3">
                        {space.leases
                          .filter(lease => lease.statusId !== 7)
                          .map((lease, index) => (
                          <div 
                            key={index}
                            className="bg-gray-50 rounded-lg p-3 text-sm"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-medium text-gray-900">
                                  {lease.customerName}
                                </span>
                                <div className="flex items-center gap-2 mt-1 text-gray-600">
                                  <span>Lease #{lease.id}</span>
                                  <span>•</span>
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">
                                    {lease.status.name}
                                  </span>
                                </div>
                              </div>
                              <span className="font-medium text-gray-900">
                                ${lease.amount}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              {format(new Date(lease.startDate), 'MMM d, yyyy')} - {' '}
                              {format(new Date(lease.endDate), 'MMM d, yyyy')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-4">
                    <div className="text-sm">
                      <span className={`px-2 py-1 rounded ${
                        availableSpots > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {availableSpots > 0 ? `${availableSpots} / ${capacity} disponibles` : '0 espacios disponibles'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add this Dialog for viewing photos */}
      <Dialog>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vista Previa de Foto</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video">
            <img 
              id="preview-image" 
              className="w-full h-full object-contain"
              src={selectedPhoto}
              alt="Media Space Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 