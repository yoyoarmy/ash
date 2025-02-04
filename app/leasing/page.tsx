'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { DayPicker } from 'react-day-picker';
import { addDays, differenceInDays, format, isSameDay, isWithinInterval } from 'date-fns';
import 'react-day-picker/dist/style.css';
import { useNotifications } from '../contexts/NotificationContext';
import { ToastProvider, Toast, ToastViewport } from '../components/ui/toast';
import { CheckCircle } from 'lucide-react';
import { LoadingAnimation } from '../components/LoadingAnimation';
import { useSession } from 'next-auth/react';
import { es } from 'date-fns/locale';
import { useCart } from '../contexts/CartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Eye } from 'lucide-react';

type Brand = {
  id: number;
  name: string;
};

type Store = {
  id: number;
  name: string;
  location: string;
  brandId: number;
  mediaSpaces: Array<{
    mediaItem: {
      mediaItemType: {
        id: number;
      }
    }
  }>;
};

type MediaSpace = {
  id: number;
  photo?: string;
  store: {
    name: string;
  };
  mediaItem: {
    id: number;
    type: string;
    dimensions: string;
    basePrice: number;
    leaseDuration: number;
    capacity?: number;
    mediaItemType: {
      id: number;
    };
  };
  leases: Array<{
    id: number;
    status: string;
    startDate: string;
    endDate: string;
    customerName: string;
  }>;
  info?: string;
  currentLease?: {
    customerName: string;
    startDate: string;
    endDate: string;
  } | null;
  upcomingLeases: Array<{
    startDate: string;
    endDate: string;
    customerName?: string;
  }>;
  status: 'leased' | 'available';
  availableSlots?: number;
  isAtCapacity?: boolean;
};

type DateSelection = {
  from: Date | undefined;
  to: Date | undefined;
};

type BillingType = 'INVOICE' | 'GIFT';

interface LeaseFormData {
  customerName: string;
  providerInfo: string;
  productDetails: string;
  campaignRedirect: string;
  marketingGoals: string;
  disclaimer: string;
  productUrl: string;
  targetAudience: string;
  brandGraphics: string;
  providerContact: string;
  billingType: BillingType[];
  giftCampaignDetails?: string;
  planAlaMedida?: string;
  planAlaMedidaAmount?: number;
}

// Add this type for the lease response
type LeaseResponse = {
  id: number;
  // ... other lease fields
};

type MediaItem = {
  id: number;
  type: string;
  dimensions: string;
  basePrice: number;
  leaseDuration: number;
};

type MediaItemType = {
  id: number;
  name: string;
};

export default function LeasingPage() {
  const { data: session } = useSession();
  const [customerName, setCustomerName] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [inventory, setInventory] = useState<MediaSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<MediaSpace | null>(null);
  const [dateSelection, setDateSelection] = useState<DateSelection>({ 
    from: undefined, 
    to: undefined 
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const { addNotification } = useNotifications();
  const [showToast, setShowToast] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: '' });
  const [bookedDates, setBookedDates] = useState<{start: Date, end: Date}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBrandsLoading, setIsBrandsLoading] = useState(true);
  const [isStoresLoading, setIsStoresLoading] = useState(false);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedMediaItemId, setSelectedMediaItemId] = useState<string>('');
  const [isMediaItemsLoading, setIsMediaItemsLoading] = useState(false);
  const [selectedMediaItemTypeId, setSelectedMediaItemTypeId] = useState<string>('');
  const [mediaItemTypes, setMediaItemTypes] = useState<MediaItemType[]>([]);
  const [isMediaItemTypesLoading, setIsMediaItemTypesLoading] = useState(true);
  const [availableMediaTypes, setAvailableMediaTypes] = useState<MediaItemType[]>([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const { addItem, formData, setFormData } = useCart();
  const [planAlaMedida, setPlanAlaMedida] = useState<string>('');
  const [planAlaMedidaAmount, setPlanAlaMedidaAmount] = useState<string>('');
  const [availabilityCache, setAvailabilityCache] = useState<Map<string, boolean>>(new Map());
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [planAlaMedidaInfo, setPlanAlaMedidaInfo] = useState({
    url: '',
    amount: ''
  });

  // Set customer name when session loads for advertisers
  useEffect(() => {
    if (session?.user?.role === 'ADVERTISER') {
      const name = session.user.name || '';
      setCustomerName(name);
      // Also update form data if it exists
      setFormData(prev => prev ? {...prev, customerName: name} : null);
    }
  }, [session]);

  // Fetch brands on load
  useEffect(() => {
    setIsBrandsLoading(true);
    fetch('/api/brands')
      .then(res => res.json())
      .then(data => setBrands(data))
      .catch(err => console.error('Failed to fetch brands:', err))
      .finally(() => setIsBrandsLoading(false));
  }, []);

  // Add a fetch function for media item types
  useEffect(() => {
    const fetchMediaItemTypes = async () => {
      try {
        const response = await fetch('/api/media-item-types');
        const data = await response.json();
        console.log('Fetched media item types:', data);
        setMediaItemTypes(data);
      } catch (error) {
        console.error('Error fetching media item types:', error);
      } finally {
        setIsMediaItemTypesLoading(false);
      }
    };

    fetchMediaItemTypes();
  }, []);

  // Update the media items fetch to filter by store and type
  useEffect(() => {
    if (selectedStoreId && selectedMediaItemTypeId) {
      const fetchMediaItems = async () => {
        setIsMediaItemsLoading(true);
        try {
          console.log('Fetching media items for:', {
            storeId: selectedStoreId,
            typeId: selectedMediaItemTypeId
          });
          
          const response = await fetch(
            `/api/media-items?storeId=${selectedStoreId}&typeId=${selectedMediaItemTypeId}`
          );
          const data = await response.json();
          
          console.log('Fetched media items:', data);
          setMediaItems(data);
        } catch (error) {
          console.error('Error fetching media items:', error);
        } finally {
          setIsMediaItemsLoading(false);
        }
      };

      fetchMediaItems();
    }
  }, [selectedStoreId, selectedMediaItemTypeId]);

  // Update store fetching when media type is selected
  useEffect(() => {
    if (selectedBrandId && selectedMediaItemTypeId) {
      setIsStoresLoading(true);
      fetch('/api/stores')
        .then(res => res.json())
        .then(data => {
          // Filter stores that have media items of the selected type
          const filteredStores = data.filter((store: Store) => 
            store.brandId.toString() === selectedBrandId &&
            store.mediaSpaces.some(space => 
              space.mediaItem.mediaItemType.id.toString() === selectedMediaItemTypeId
            )
          );
          console.log('Filtered stores:', filteredStores);
          setStores(filteredStores);
          setSelectedStoreId('');
        })
        .catch(err => console.error('Failed to fetch stores:', err))
        .finally(() => setIsStoresLoading(false));
    }
  }, [selectedBrandId, selectedMediaItemTypeId]);

  // Update the inventory fetch to depend on media item selection
  useEffect(() => {
    if (selectedStoreId && selectedMediaItemId) {
      fetchInventory(selectedStoreId);
    }
  }, [selectedStoreId, selectedMediaItemId]);

  // Function to validate lease duration
  const isValidLeaseDuration = (from: Date, to: Date, leaseDuration: number) => {
    const days = differenceInDays(to, from) + 1;
    return days % leaseDuration === 0;
  };

  // Update the useEffect that fetches availability
  useEffect(() => {
    if (selectedSpace) {
      fetch(`/api/spaces/${selectedSpace.id}/availability`)
        .then(res => res.json())
        .then(data => {
          console.log('Availability data:', data);
          
          // Only block dates that are actually at capacity
          const blockedDates = data.dateCapacities
            .filter(dc => dc.activeLeases >= selectedSpace.mediaItem.capacity)
            .map(dc => ({
              start: new Date(dc.date),
              end: new Date(dc.date)
            }));

          console.log('Blocked dates:', blockedDates);
          setBookedDates(blockedDates);
        })
        .catch(err => {
          console.error('Failed to fetch availability:', err);
          addNotification('Error al cargar disponibilidad');
        });
    }
  }, [selectedSpace]);

  // Batch fetch availability for a range of dates
  const fetchDateRangeAvailability = async (start: Date, end: Date) => {
    try {
      setIsLoadingDates(true);
      const response = await fetch(
        `/api/spaces/${selectedSpace?.id}/availability-range?` + 
        new URLSearchParams({
          start: start.toISOString(),
          end: end.toISOString()
        })
      );
      
      if (!response.ok) throw new Error('Failed to fetch availability');
      
      const data = await response.json();
      const newCache = new Map(availabilityCache);
      
      // Update cache with new availability data
      data.dates.forEach(({ date, isAvailable }: { date: string, isAvailable: boolean }) => {
        newCache.set(date, isAvailable);
      });
      
      setAvailabilityCache(newCache);
    } catch (error) {
      console.error('Error fetching availability:', error);
      addNotification('Error al cargar disponibilidad');
    } finally {
      setIsLoadingDates(false);
    }
  };

  // Optimize the isDateAvailable function
  const isDateAvailable = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check cache first
    if (availabilityCache.has(dateStr)) {
      return availabilityCache.get(dateStr);
    }
    
    // If not in cache, it needs to be fetched
    return true; // Default to available until we know otherwise
  };

  // Add this effect to pre-fetch dates when calendar opens
  useEffect(() => {
    if (selectedSpace && showCalendar) {
      const today = new Date();
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(today.getMonth() + 3);
      
      fetchDateRangeAvailability(today, threeMonthsFromNow);
    }
  }, [selectedSpace, showCalendar]);

  // Add this to handle calendar month changes
  const handleMonthChange = (month: Date) => {
    const start = new Date(month);
    const end = new Date(month);
    end.setMonth(end.getMonth() + 2); // Fetch next two months
    
    fetchDateRangeAvailability(start, end);
  };

  // Update getValidEndDates to use the same logic
  const getValidEndDates = (start: Date, leaseDuration: number) => {
    const validDates: Date[] = [];
    let multiplier = 1;
    
    // Generate next 52 possible end dates
    while (validDates.length < 52) {
      const endDate = addDays(start, (leaseDuration * multiplier) - 1);
      
      // Check if any date in the range is at capacity
      let isRangeAvailable = true;
      for (let d = start; d <= endDate; d = addDays(d, 1)) {
        if (!isDateAvailable(d)) {
          isRangeAvailable = false;
          break;
        }
      }
      
      if (isRangeAvailable) {
        validDates.push(endDate);
      }
      
      multiplier++;
    }
    
    return validDates;
  };

  // Add these helper functions
  const isDateInRange = (date: Date, start: Date, end: Date) => {
    return date >= start && date <= end;
  };

  const getAvailableEndDates = (start: Date, leaseDuration: number) => {
    const validDates: Date[] = [];
    let multiplier = 1;
    
    // Generate next 6 possible end dates
    while (validDates.length < 52) {
      const endDate = addDays(start, (leaseDuration * multiplier) - 1);
      
      // Check if all dates in the range are available
      let isRangeAvailable = true;
      for (let d = start; d <= endDate; d = addDays(d, 1)) {
        if (!isDateAvailable(d)) {
          isRangeAvailable = false;
          break;
        }
      }
      
      if (isRangeAvailable) {
        validDates.push(endDate);
      }
      
      multiplier++;
    }
    
    return validDates;
  };

  // Update handleDateSelect to use the same logic
  const handleDateSelect = (date: Date | undefined) => {
    if (!selectedSpace || !date) return;

    if (!startDate) {
      // First click - validate and set start date
      if (isDateAvailable(date)) {
        setStartDate(date);
        setDateSelection({
          from: date,
          to: undefined
        });
      } else {
        addNotification('Esta fecha no está disponible - capacidad alcanzada');
      }
    } else {
      // Second click - validate and set end date
      const validEndDates = getValidEndDates(startDate, selectedSpace.mediaItem.leaseDuration);
      if (validEndDates.some(validDate => isSameDay(validDate, date))) {
        setDateSelection({
          from: startDate,
          to: date
        });
      } else {
        addNotification(`Por favor seleccione una fecha válida basada en la duración del arriendo de ${selectedSpace.mediaItem.leaseDuration} días`);
      }
    }
  };

  // Reset dates when closing calendar
  const handleCloseCalendar = () => {
    setShowCalendar(false);
    setStartDate(undefined);
    setDateSelection({ from: undefined, to: undefined });
  };

  // Update the calculateLeaseAmount function
  const calculateLeaseAmount = () => {
    if (!selectedSpace || !dateSelection.from || !dateSelection.to) return 0;

    // If it's Plan a la Medida type, use the planAlaMedidaAmount
    if (isPlanAlaMedida(selectedSpace.mediaItem.mediaItemType.id)) {
      return planAlaMedidaAmount ? parseFloat(planAlaMedidaAmount) : 0;
    }

    // Otherwise use the regular calculation
    const days = differenceInDays(dateSelection.to, dateSelection.from) + 1;
    const cycles = Math.floor(days / selectedSpace.mediaItem.leaseDuration);
    return cycles * selectedSpace.mediaItem.basePrice;
  };

  // Update the checkAvailability function
  const checkAvailability = async (mediaSpaceId: number, startDate: Date, endDate: Date) => {
    try {
      const response = await fetch('/api/leases/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaSpaceId,
          startDate,
          endDate
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          // Show capacity information to user
          addNotification(
            `Espacio no disponible: ${data.currentLeases}/${data.capacity} espacios ocupados en las fechas seleccionadas`,
          
          );
          return false;
        }
        throw new Error(data.error);
      }

      // If available, show remaining capacity
      if (data.remainingCapacity > 0) {
        addNotification(
          `Espacio disponible: ${data.remainingCapacity} espacios restantes`,
        
        );
      }

      return true;
    } catch (error) {
      console.error('Error checking availability:', error);
      addNotification('Error al verificar disponibilidad');
      return false;
    }
  };

  // Add this helper function to check if it's mediaItemType 7
  const isPlanAlaMedida = (mediaTypeId: number) => {
    const result = mediaTypeId === 7;
    console.log('isPlanAlaMedida check:', { mediaTypeId, result });
    return result;
  };

  // Modify your handleSubmit to include the new fields
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // First check availability
      const isAvailable = await checkAvailability(
        selectedSpace.id,
        startDate,
        dateSelection.to
      );

      if (!isAvailable) {
        return;
      }

      // Continue with lease creation if available
      // ... rest of your submit logic ...

      // When creating the lease extra information
      const extraInfoData = {
        customerName: customerName,
        providerInfo: formData.providerInfo || '',
        productDetails: formData.productDetails || '',
        campaignRedirect: formData.campaignRedirect || '',
        marketingGoals: formData.marketingGoals || '',
        disclaimer: formData.disclaimer || '',
        productUrl: formData.productUrl || '',
        targetAudience: formData.targetAudience || '',
        brandGraphics: formData.brandGraphics || '',
        providerContact: formData.providerContact || '',
        billingType: formData.billingType || [],
        giftCampaignDetails: formData.giftCampaignDetails || '',
        planAlaMedida: formData.planAlaMedida || '',
      };

      // Send to your API
      const response = await fetch('/api/leases/extra-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extraInfoData),
      });

      // ... rest of your submit logic ...
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Add this helper function
  const isDateBooked = (date: Date) => {
    return bookedDates.some(booking => 
      isWithinInterval(date, { 
        start: new Date(booking.start), 
        end: new Date(booking.end) 
      })
    );
  };

  // Add this function to disable booked dates
  const disabledDays = [
    { before: new Date() }, // Disable past dates
    (date: Date) => isDateBooked(date) // Disable booked dates
  ];

  // Update fetchInventory function
  const fetchInventory = async (storeId: string) => {
    setIsInventoryLoading(true);
    try {
      const response = await fetch(`/api/inventory?storeId=${storeId}&mediaItemId=${selectedMediaItemId}`);
      const data = await response.json();
      console.log('Fetched inventory:', data);
      setInventory(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setIsInventoryLoading(false);
    }
  };

  // Update brand selection handler
  const handleBrandSelect = (brandId: string) => {
    setSelectedBrandId(brandId);
    setSelectedStoreId('');
    setInventory([]);
    setSelectedSpace(null);
    setShowCalendar(false);
  };

  // Update the useEffect that runs when brand is selected
  useEffect(() => {
    if (!selectedBrandId) return;

    const fetchStoresAndMediaTypes = async () => {
      try {
        // Fetch stores for the selected brand
        const storesResponse = await fetch(`/api/stores?brandId=${selectedBrandId}`);
        const storesData = await storesResponse.json();

        // Extract unique mediaItemTypes from the stores' mediaSpaces
        const mediaTypes = new Set();
        storesData.forEach((store: any) => {
          store.mediaSpaces.forEach((space: any) => {
            if (space.mediaItem?.mediaItemType) {
              mediaTypes.add(JSON.stringify(space.mediaItem.mediaItemType));
            }
          });
        });

        // Convert Set back to array and parse JSON strings
        const uniqueMediaTypes = Array.from(mediaTypes).map(type => JSON.parse(type as string));
        setAvailableMediaTypes(uniqueMediaTypes);
        
        setStores(storesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchStoresAndMediaTypes();
  }, [selectedBrandId]);

  // Add this helper function
  const getFilteredInventory = (stores: any[], mediaItemTypeId: string) => {
    const inventory = [];
    
    for (const store of stores) {
      for (const space of store.mediaSpaces) {
        if (space.mediaItem?.mediaItemType?.id.toString() === mediaItemTypeId) {
          inventory.push({
            ...space,
            storeName: store.name,
            storeLocation: store.location,
            upcomingLeases: space.leases || [],
            currentLease: space.leases?.find(lease => 
              lease.status !== 'Completed' && 
              new Date(lease.endDate) >= new Date()
            )
          });
        }
      }
    }
    
    return inventory;
  };

  // Add this effect to update filtered inventory when media type changes
  useEffect(() => {
    if (!selectedBrandId || !selectedMediaItemTypeId || !stores.length) return;
    
    const inventory = getFilteredInventory(stores, selectedMediaItemTypeId);
    setFilteredInventory(inventory);
  }, [selectedBrandId, selectedMediaItemTypeId, stores]);

  // Update handleAddToCart to validate Plan a la Medida amount
  const handleAddToCart = () => {
    if (!selectedSpace || !dateSelection.from || !dateSelection.to) return;

    const extraInformation = {
      customerName: customerName,
      providerInfo: formData?.providerInfo || '',
      productDetails: formData?.productDetails || '',
      campaignRedirect: formData?.campaignRedirect || '',
      marketingGoals: formData?.marketingGoals || '',
      disclaimer: formData?.disclaimer || '',
      productUrl: formData?.productUrl || '',
      targetAudience: formData?.targetAudience || '',
      brandGraphics: formData?.brandGraphics || '',
      providerContact: formData?.providerContact || '',
      billingType: formData?.billingType || [],
      giftCampaignDetails: formData?.giftCampaignDetails || '',
      // Don't use default values here
      planAlaMedida: formData?.planAlaMedida || '',
      planAlaMedidaAmount: planAlaMedidaAmount ? parseFloat(planAlaMedidaAmount) : null
    };

    console.log('Adding to cart with data:', extraInformation);

    addItem({
      spaceId: selectedSpace.id,
      storeName: selectedSpace.store?.name || '',
      mediaType: selectedSpace.mediaItem.type,
      startDate: dateSelection.from,
      endDate: dateSelection.to,
      amount: calculateLeaseAmount(),
      extraInformation
    });

    // Reset fields after adding to cart
    setSelectedSpace(null);
    setDateSelection({ from: undefined, to: undefined });
    setShowCalendar(false);
    setPlanAlaMedida('');
    setPlanAlaMedidaAmount('');
    addNotification('Agregado al carrito correctamente');
  };

  const handleFormSubmit = (data: LeaseFormData) => {
    const formDataToSubmit = {
      ...data,
      customerName: customerName,
      billingType: data.billingType || [],
      // Only include plan a la medida fields if it's the right media type
      ...(isPlanAlaMedida(selectedSpace?.mediaItem?.mediaItemType?.id) ? {
        planAlaMedida,
        planAlaMedidaAmount: parseFloat(planAlaMedidaAmount)
      } : {})
    };

    setFormData(formDataToSubmit);
    addNotification('Información adicional guardada correctamente');
  };

  // Add initial form data if none exists
  useEffect(() => {
    if (!formData) {
      setFormData({
        customerName,
        providerInfo: '',
        productDetails: '',
        campaignRedirect: '',
        marketingGoals: '',
        disclaimer: '',
        productUrl: '',
        targetAudience: '',
        brandGraphics: '',
        providerContact: '',
        billingType: [],
        giftCampaignDetails: '',
        planAlaMedida: '',
        planAlaMedidaAmount: 0,
      });
    }
  }, [customerName, formData]);

  // Add this function to handle Plan a la Medida inputs
  const handlePlanAlaMedidaChange = (field: 'url' | 'amount', value: string) => {
    setPlanAlaMedidaInfo(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Also update the main form data
    if (field === 'url') {
      setPlanAlaMedida(value);
      // Update formData with the new URL
      setFormData(prev => ({
        ...prev,
        planAlaMedida: value
      }));
    } else if (field === 'amount') {
      setPlanAlaMedidaAmount(value);
      // Update formData with the new amount
      setFormData(prev => ({
        ...prev,
        planAlaMedidaAmount: value ? parseFloat(value) : null
      }));
    }
  };

  if (isLoading) return <LoadingAnimation />;

  return (
    <ToastProvider>
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold mb-6">Nueva Solicitud</h1>
        
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="bg-white shadow-md">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl text-gray-800">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 bg-white">
              <div>
                <Label>Nombre del Cliente</Label>
                <Input
                  value={customerName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setCustomerName(newName);
                    setFormData(prev => prev ? {...prev, customerName: newName} : null);
                  }}
                  placeholder="Ingrese nombre del cliente"
                  disabled={session?.user?.role === 'ADVERTISER'}
                  required
                />
              </div>

              <div>
                <Label>Información del Proveedor</Label>
                <Input
                  value={formData?.providerInfo || ''}
                  onChange={(e) => setFormData(prev => ({...prev, providerInfo: e.target.value}))}
                  placeholder="Proveedor (Incluir nombre y Código externo de Aludra) + Marca"
                />
              </div>
              
              <div>
                <Label>Detalles del Producto</Label>
                <Input
                  value={formData?.productDetails || ''}
                  onChange={(e) => setFormData(prev => ({...prev, productDetails: e.target.value}))}
                  placeholder="Producto que se desea destacar dentro de la marca (Nombre + SKU)"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl text-gray-800">Detalles de Campaña</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 bg-white">
              <div>
                <Label>Redirección de Campaña</Label>
                <Select
                  value={formData?.campaignRedirect || ''}
                  onValueChange={(value) => setFormData(prev => ({...prev, campaignRedirect: value}))}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Seleccione la redirección de la campaña" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Agrupado">Agrupado</SelectItem>
                    <SelectItem value="No Aplica">No Aplica</SelectItem>
                    <SelectItem value="Producto Unico">Producto Unico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Objetivos de Marketing</Label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  value={formData?.marketingGoals || ''}
                  onChange={(e) => setFormData(prev => ({...prev, marketingGoals: e.target.value}))}
                  placeholder="¿A nivel comercial, que NO puede hacer falta en el arte promocional? ¿Qué necesitas lograr con esta comunicación?"
                  rows={4}
                />
              </div>

              <div>
                <Label>Disclaimer</Label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  value={formData?.disclaimer || ''}
                  onChange={(e) => setFormData(prev => ({...prev, disclaimer: e.target.value}))}
                  placeholder="Inserte el disclaimer que debe llevar el arte promocional"
                  rows={3}
                />
              </div>

              <div>
                <Label>URL del Producto</Label>
                <Input
                  type="url"
                  name="productUrl"
                  value={formData?.productUrl || ''}
                  onChange={(e) => setFormData(prev => ({...prev, productUrl: e.target.value}))}
                  placeholder="URL del producto"
                />
              </div>

              <div>
                <Label>Público Objetivo</Label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  value={formData?.targetAudience || ''}
                  onChange={(e) => setFormData(prev => ({...prev, targetAudience: e.target.value}))}
                  placeholder="Especifica a quienes quisieras dirigir esta comunicación. Trata de ser muy detallado. (Ej. Cliente final o contratista, interesados en algo en particular, de cierta edad, género, etc)"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl text-gray-800">Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 bg-white">
              <div>
                <Label>Linea Gráfica</Label>
                <Input
                  value={formData?.brandGraphics || ''}
                  onChange={(e) => setFormData(prev => ({...prev, brandGraphics: e.target.value}))}
                  placeholder="Si el proveedor ha solicitado usar su línea gráfica, ingresa link del drive, WeTransfer o Dropbox con el material"
                />
              </div>

              <div>
                <Label>Contacto del Proveedor</Label>
                <Input
                  value={formData?.providerContact || ''}
                  onChange={(e) => setFormData(prev => ({...prev, providerContact: e.target.value}))}
                  placeholder="Contacto del proveedor para que se le envíe la información"
                />
              </div>

              <div className="space-y-2">
                <Label>Se debe facturar</Label>
                <div className="space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData?.billingType.includes('INVOICE') || false}
                      onChange={(e) => {
                        const newTypes = e.target.checked 
                          ? [...formData.billingType, 'INVOICE']
                          : formData.billingType.filter(t => t !== 'INVOICE');
                        setFormData(prev => ({...prev, billingType: newTypes}));
                      }}
                      className="form-checkbox"
                    />
                    <span className="ml-2">Se debe facturar</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData?.billingType.includes('GIFT') || false}
                      onChange={(e) => {
                        const newTypes = e.target.checked 
                          ? [...formData.billingType, 'GIFT']
                          : formData.billingType.filter(t => t !== 'GIFT');
                        setFormData(prev => ({...prev, billingType: newTypes}));
                      }}
                      className="form-checkbox"
                    />
                    <span className="ml-2">Es Regalia</span>
                  </label>
                </div>
              </div>

              {formData?.billingType.includes('GIFT') && (
                <div>
                  <Label>Regalia</Label>
                  <Input
                    value={formData?.giftCampaignDetails || ''}
                    onChange={(e) => setFormData(prev => ({...prev, giftCampaignDetails: e.target.value}))}
                    placeholder="Si es regalía especificar a qué campaña corresponde. "
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Brand Selection */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Label className="text-gray-700">Seleccionar Marca</Label>
            <Select
              value={selectedBrandId}
              onValueChange={handleBrandSelect}
              disabled={isBrandsLoading}
            >
              <SelectTrigger className="mt-1 w-full border-gray-200">
                <SelectValue placeholder={isBrandsLoading ? "Cargando marcas..." : "Seleccione una marca"} />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {brands.map(brand => (
                  <SelectItem 
                    key={brand.id} 
                    value={brand.id.toString()}
                    className="hover:bg-gray-50"
                  >
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Media Type Selection */}
          {selectedBrandId && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Label className="text-gray-700">Tipo de Medio</Label>
              <Select
                value={selectedMediaItemTypeId}
                onValueChange={setSelectedMediaItemTypeId}
              >
                <SelectTrigger className="mt-1 w-full border-gray-200">
                  <SelectValue placeholder="Seleccione tipo de medio" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {availableMediaTypes.map(type => (
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
          )}

          {/* Plan a la Medida Form - Now above Inventario Disponible */}
          {selectedMediaItemTypeId && isPlanAlaMedida(parseInt(selectedMediaItemTypeId)) && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Plan a la Medida - Información Adicional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">URL del Plan</label>
                  <Input
                    placeholder="Ingrese la URL del plan..."
                    value={planAlaMedidaInfo.url}
                    onChange={(e) => handlePlanAlaMedidaChange('url', e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Monto del Plan</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ingrese el monto..."
                    value={planAlaMedidaInfo.amount}
                    onChange={(e) => handlePlanAlaMedidaChange('amount', e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Available Inventory */}
          {selectedBrandId && selectedMediaItemTypeId && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Label className="text-gray-700">Inventario Disponible</Label>
              {isInventoryLoading ? (
                <div className="text-center py-6 text-gray-500">
                  Cargando inventario...
                </div>
              ) : filteredInventory.length > 0 ? (
                <div className="mt-2 space-y-3">
                  {filteredInventory.map(space => (
                    <button
                      key={space.id}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                      onClick={() => {
                        console.log('Space selected:', space);
                        setSelectedSpace(space);
                        setDateSelection({ from: undefined, to: undefined });
                        setShowCalendar(true);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-800">
                          {space.mediaItem.type}  |  {space.storeName}
                        </h3>
                        <div className="flex items-center gap-2">
                          {space.photo && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-blue-700"
                                  onClick={(e) => e.stopPropagation()}
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
                          <span className={`px-2 py-1 rounded text-sm ${
                            !space.isAtCapacity
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {!space.isAtCapacity
                              ? 'Disponible'
                              : 'No Disponible'
                            }
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>Dimensiones: {space.mediaItem.dimensions}</p>
                        <p>Precio Base: ${space.mediaItem.basePrice}</p>
                        <p>Duración del Arriendo: {space.mediaItem.leaseDuration} días</p>
                      </div>
                      {space.upcomingLeases?.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-sm font-medium text-gray-700">Arriendos Próximos:</p>
                          {space.upcomingLeases.map((lease, index) => (
                            <p key={index} className="text-sm text-gray-600">
                              {format(new Date(lease.startDate), 'd MMM', { locale: es })} - {
                                format(new Date(lease.endDate), 'd MMM yyyy', { locale: es })
                              }
                            </p>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No hay espacios disponibles para este tipo de medio
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calendar Modal */}
        {showCalendar && selectedSpace && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-[800px] w-full shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Seleccionar Fechas</h3>
                <button
                  onClick={handleCloseCalendar}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {!startDate 
                    ? 'Seleccione fecha de inicio'
                    : `Seleccione fecha final (debe ser en incrementos de ${selectedSpace.mediaItem.leaseDuration} días)`
                  }
                </p>
                <div className="bg-white p-4 rounded-lg">
                  <DayPicker
                    mode="single"
                    selected={dateSelection.from}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                    fromDate={new Date()}
                    toDate={addDays(new Date(), 365)}
                    locale={es}
                    modifiers={{
                      disabled: [
                        { before: new Date() },
                        startDate && {
                          after: addDays(startDate, 365)
                        },
                        ...bookedDates.map(date => ({
                          from: new Date(date.start),
                          to: new Date(date.end)
                        }))
                      ].filter(Boolean),
                      highlighted: startDate ? 
                        getValidEndDates(startDate, selectedSpace.mediaItem.leaseDuration) : 
                        []
                    }}
                    modifiersStyles={{
                      highlighted: {
                        backgroundColor: '#e0f2fe',
                        borderRadius: '100%'
                      },
                      disabled: {
                        backgroundColor: '#fee2e2',
                        borderRadius: '100%',
                        color: '#991b1b'
                      }
                    }}
                    formatters={{
                      formatCaption: (date, options) => {
                        return format(date, 'MMMM yyyy', { locale: es }).replace(/^\w/, (c) => c.toUpperCase());
                      },
                      formatWeekdayName: (date) => {
                        return format(date, 'EEEEEE', { locale: es }).toUpperCase();
                      }
                    }}
                    className="bg-white mx-auto"
                  />
                </div>
              </div>
              {dateSelection.from && dateSelection.to && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600">
                    Duración seleccionada: {differenceInDays(dateSelection.to, dateSelection.from) + 1} días
                  </p>
                  <p className="text-sm text-gray-600">
                    Monto del arriendo: ${calculateLeaseAmount().toLocaleString()}
                  </p>
                  <Button
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleAddToCart}
                    disabled={isLoading}
                  >
                    Agregar al carrito
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Toast */}
      {showToast.show && (
        <Toast className="fixed top-4 right-4 z-50 bg-green-50 border border-green-100 animate-slide-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div className="flex-1 text-sm font-medium text-green-800">
              {showToast.message}
            </div>
          </div>
        </Toast>
      )}
      <ToastViewport />
    </ToastProvider>
  );
} 