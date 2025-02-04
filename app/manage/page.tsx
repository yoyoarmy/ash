'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, CheckCircle } from 'lucide-react';
import { ToastProvider, ToastViewport, Toast, ToastClose } from '../components/ui/toast';
import { useNotifications } from '../contexts/NotificationContext';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { BrandSelect } from '../components/BrandSelect';
import { LoadingAnimation } from "@/app/components/LoadingAnimation";
import { RoleGuard } from '../components/RoleGuard';
import { Store } from '@prisma/client';

type Item = {
  type: string;
  dimensions: string;
  basePrice: number;
  leaseDuration: number;
  format: string;
  capacity: number;
};

type Brand = {
  id: number;
  name: string;
  stores?: Store[];
};

type MediaItemType = {
  id: number;
  name: string;
};

export default function ManagePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState<Item>({
    type: '',
    dimensions: '',
    basePrice: 0,
    leaseDuration: 0,
    format: '',
    capacity: 0
  });
  const [newStore, setNewStore] = useState({
    name: '',
    location: '',
    brandId: 0
  });
  const [showToast, setShowToast] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: '' });
  const { addNotification } = useNotifications();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaItemTypes, setMediaItemTypes] = useState<MediaItemType[]>([]);
  const [selectedMediaItemType, setSelectedMediaItemType] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error('Failed to fetch items:', err));
    setLoading(false);
  }, []);

  useEffect(() => {
    console.log('Fetching brands...');
    fetch('/api/brands')
      .then(async res => {
        console.log('Response status:', res.status);
        const data = await res.json();
        console.log('Available brands:', data);
        if (!Array.isArray(data)) {
          console.error('Se esperaba un array de marcas, se obtuvo:', data);
          return;
        }
        setBrands(data);
      })
      .catch(err => {
        console.error('Fallo al obtener las marcas:', err);
      });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch('/api/media-item-types')
      .then(res => res.json())
      .then(data => setMediaItemTypes(data))
      .catch(err => console.error('Failed to fetch media item types:', err));
  }, []);

  const showNotification = (message: string) => {
    setShowToast({ show: true, message });
    setTimeout(() => setShowToast({ show: false, message: '' }), 5000);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting item:', newItem);
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Fallo al crear el medio');
      }

      setItems([...items, data]);
      setNewItem({ type: '', dimensions: '', basePrice: 0, leaseDuration: 0, format: '', capacity: 0 });
      showNotification(`Nuevo medio "${data.type}" creado exitosamente!`);
    } catch (error) {
      console.error('Fallo al crear el medio:', error);
      showNotification(`Error: ${error instanceof Error ? error.message : 'Fallo al crear el medio'}`);
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newStore.brandId) {
        showNotification('Por favor selecciona una marca');
        return;
      }

      console.log('Submitting store with brand:', {
        ...newStore,
        brandExists: brands.some(b => b.id === newStore.brandId)
      });

      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStore.name,
          location: newStore.location,
          brandId: newStore.brandId,
          mediaSpaces: { create: [] }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Fallo al crear la tienda');
      }

      setNewStore({ name: '', location: '', brandId: 0 });
      showNotification(`Nueva tienda "${data.name}" creada exitosamente!`);
      addNotification(`Nueva tienda "${data.name}" creada exitosamente!`);
    } catch (error) {
      console.error('Fallo al crear la tienda:', error);
      showNotification(`Error: ${error instanceof Error ? error.message : 'Fallo al crear la tienda'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedMediaItemType) {
      showNotification('Por favor seleccione un tipo de medio');
      return;
    }

    try {
      const formData = new FormData(e.currentTarget);
      const mediaItem = {
        type: formData.get('type'),
        dimensions: formData.get('dimensions'),
        basePrice: parseFloat(formData.get('basePrice') as string),
        leaseDuration: parseInt(formData.get('leaseDuration') as string),
        format: formData.get('format'),
        capacity: parseInt(formData.get('capacity') as string),
        mediaItemTypeId: parseInt(selectedMediaItemType)
      };

      const response = await fetch('/api/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediaItem),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create media item');
      }

      const result = await response.json();
      showNotification('Medio publicitario creado exitosamente');

      // Add 3 second delay before resetting and refreshing
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.reset();
        }
        setSelectedMediaItemType('');
        window.location.reload();
      }, 3000);

    } catch (error) {
      console.error('Error creating media item:', error);
      showNotification(error instanceof Error ? error.message : 'Error al crear medio publicitario');
    }
  };

  if (loading) return <LoadingAnimation />;

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <ToastProvider>
        <div className="p-6 space-y-8">
          <h1 className="text-2xl font-bold">Administrar Base de Datos</h1>
          
          
          <Card>
            <CardHeader>
              <CardTitle>Agregar Nueva Tienda</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStore} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre de Tienda</Label>
                  <Input
                    id="name"
                    value={newStore.name}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                    placeholder="Nombre de Tienda"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    value={newStore.location}
                    onChange={(e) => setNewStore({ ...newStore, location: e.target.value })}
                    placeholder="Ubicación de la Tienda"
                  />
                </div>
                <div>
                  <BrandSelect
                    value={newStore.brandId}
                    onChange={(brandId) => setNewStore({ ...newStore, brandId })}
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                    Agregar Nueva Tienda
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agregar Nuevo Medio</CardTitle>
            </CardHeader>
            <CardContent>
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="mediaItemType">Tipo de Medio</Label>
                  <Select
                    value={selectedMediaItemType}
                    onValueChange={setSelectedMediaItemType}
                  >
                    <SelectTrigger className="w-full bg-white border border-gray-200">
                      <SelectValue placeholder="Seleccionar tipo de medio" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      {mediaItemTypes.map(type => (
                        <SelectItem 
                          key={type.id} 
                          value={type.id.toString()}
                          className="hover:bg-gray-50"
                        >
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Nombre</Label>
                  <Input id="type" name="type" required 
                  placeholder="Nombre del Medio ej: Banner, Pantallas "/>
           
                </div>
                
                <div>
                  <Label htmlFor="dimensions">Dimensiones</Label>
                  <Input id="dimensions" name="dimensions" required 
                  placeholder="Dimensiones ej: 4 x 6 "/>
                </div>
                
                <div>
                  <Label htmlFor="format">Formato</Label>
                  <Input id="format" name="format" required 
                  placeholder="Formato ej: Arte, Impreso"/>
                </div>
                
                <div>
                  <Label htmlFor="basePrice">Precio Base</Label>
                  <Input id="basePrice" name="basePrice" type="number" required 
                  placeholder="1"/>
                </div>
                
                <div>
                  <Label htmlFor="leaseDuration">Duración del Arriendo (días)</Label>
                  <Input id="leaseDuration" name="leaseDuration" type="number" required 
                  placeholder="1"/>
                </div>

                <div>
                  <Label htmlFor="capacity">Capcidad de Arriendo</Label>
                  <Input id="capacity" name="capacity" type="number" required 
                  placeholder="1"/>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Nuevo Medio
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {showToast.show && (
          <Toast className="fixed top-4 right-4 z-50 bg-green-50 border border-green-100 animate-slide-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="flex-1 text-sm font-medium text-green-800">
                {showToast.message}
              </div>
              <ToastClose 
                onClick={() => setShowToast({ show: false, message: '' })}
                className="text-gray-400 hover:text-gray-600"
              />
            </div>
          </Toast>
        )}
        <ToastViewport />
      </ToastProvider>
    </RoleGuard>
  );
} 