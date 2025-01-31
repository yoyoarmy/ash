'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QuickStats from '../../components/QuickStats';
import { Button } from '../../components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { DateRangeFilter } from '../../components/DateRangeFilter';
import { DateRange } from 'react-day-picker';
import { isWithinInterval } from 'date-fns';
import { Card, CardContent } from '../../components/ui/card';
import { Package, CheckCircle, Store, RollerCoaster } from 'lucide-react';
import { LoadingAnimation } from '../../components/LoadingAnimation';
import { RoleGuard } from '../../components/RoleGuard';
import { useNotifications } from '../../contexts/NotificationContext';

type Store = {
  id: number;
  name: string;
  location: string;
  brandId: number;
  mediaSpaces: Array<{
    id: number;
    mediaItemId: number;
    mediaItem: {
      mediaItemType: {
        name: string;
        id: number;
      };
      id: number;
      type: string;
      dimensions: string;
      basePrice: number;
      leaseDuration: number;
    };
    leases: Array<{
      startDate: string;
      endDate: string;
      status: string;
    }>;
  }>;
  stats: {
    total: number;
    available: number;
    inUse: number;
  }
};

type SortType = 'Product' | 'Available' | 'In Use' | 'None';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const mediaTypeId = searchParams.get('mediaTypeId');
  
  const [stores, setStores] = useState<Store[]>([]);
  const [sortBy, setSortBy] = useState<SortType>('None');
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(new Date().getFullYear(), 11, 31) // End of current year
  });
  const [selectedMediaItemTypeId, setSelectedMediaItemTypeId] = useState<string>(mediaTypeId || 'all');
  const [mediaItemTypes, setMediaItemTypes] = useState<Array<{
    id: number;
    name: string;
  }>>([]);
  const { addNotification } = useNotifications();

  // Update selected media type when URL param changes
  useEffect(() => {
    if (mediaTypeId) {
      setSelectedMediaItemTypeId(mediaTypeId);
    }
  }, [mediaTypeId]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stores');
        if (!response.ok) {
          throw new Error('Failed to fetch stores');
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setStores(data);
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  useEffect(() => {
    fetch('/api/brands')
      .then(res => res.json())
      .then(data => setBrands(data))
      .catch(err => console.error('Failed to fetch brands:', err));
  }, []);

  useEffect(() => {
    fetch('/api/media-item-types')
      .then(res => res.json())
      .then(data => {
        setMediaItemTypes(data);
      })
      .catch(err => console.error('Failed to fetch media items:', err));
  }, []);

  const sortStores = (type: string) => {
    setSortBy(type);
    let sorted = [...stores];

    switch (type) {
      case 'Product':
        sorted.sort((a, b) => {
          // Sort by total number of media spaces (descending)
          const aTotal = a.mediaSpaces.length;
          const bTotal = b.mediaSpaces.length;
          return bTotal - aTotal;  // b - a for descending order
        });
        break;
      
      case 'Available':
        sorted.sort((a, b) => {
          const aAvailable = a.mediaSpaces.filter(space => space.status === 'available').length;
          const bAvailable = b.mediaSpaces.filter(space => space.status === 'available').length;
          return bAvailable - aAvailable; // Sort descending (most available first)
        });
        break;
      
      case 'In Use':
        sorted.sort((a, b) => {
          const aInUse = a.mediaSpaces.filter(space => 
            space.leases?.some(lease => 
              lease.status !== 'Completado' && new Date(lease.endDate) >= new Date()
            )
          ).length;
          const bInUse = b.mediaSpaces.filter(space => 
            space.leases?.some(lease => 
              lease.status !== 'Completado' && new Date(lease.endDate) >= new Date()
            )
          ).length;
          return bInUse - aInUse; // Sort descending (most in use first)
        });
        break;
    }

    setStores(sorted);
  };

  const filteredStores = Array.isArray(stores) ? stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.location.toLowerCase().includes(searchQuery.toLowerCase());

    // Special handling for Novey y Cochez (brandId 1)
    const matchesBrand = 
      selectedBrand === 'all' || 
      (selectedBrand === '1' && (store.brandId === 2 || store.brandId === 3)) || // Novey y Cochez shows both
      store.brandId.toString() === selectedBrand;

    const matchesMediaItemType = selectedMediaItemTypeId === 'all' || 
      store.mediaSpaces.some(space => 
        space.mediaItem.mediaItemType && space.mediaItem.mediaItemType.id === parseInt(selectedMediaItemTypeId)
      );

    return matchesSearch && matchesBrand && matchesMediaItemType;
  }) : [];

  const storesWithDateFilteredStats = useMemo(() => {
    return filteredStores.map(store => {
      const relevantSpaces = selectedMediaItemTypeId === 'all'
        ? store.mediaSpaces
        : store.mediaSpaces.filter(space => 
            space.mediaItem && 
            space.mediaItem.mediaItemType.id === parseInt(selectedMediaItemTypeId)
          );

      // Calculate stats based on date range
      const stats = {
        total: relevantSpaces.length,
        inUse: relevantSpaces.filter(space => 
          space.leases?.some(lease => {
            if (!dateRange?.from || !dateRange?.to) return lease.status !== 'Completado';
            
            const leaseStart = new Date(lease.startDate);
            const leaseEnd = new Date(lease.endDate);
            return lease.status !== 'Completado' && 
              leaseStart <= dateRange.to &&
              leaseEnd >= dateRange.from;
          })
        ).length,
        available: 0  // Will be calculated below
      };

      // Calculate available spaces
      stats.available = stats.total - stats.inUse;

      return {
        ...store,
        stats,
        filteredSpaces: relevantSpaces
      };
    });
  }, [filteredStores, selectedMediaItemTypeId, dateRange]);

  // Then calculate the quick stats based on the filtered stores
  const quickStats = useMemo(() => {
    const totals = storesWithDateFilteredStats.reduce((acc, store) => ({
      total: acc.total + store.stats.total,
      inUse: acc.inUse + store.stats.inUse,
      available: acc.available + store.stats.available
    }), { total: 0, inUse: 0, available: 0 });

    return {
      totalAdItems: totals.total,
      availableSpaces: totals.available,
      occupiedSpaces: totals.inUse
    };
  }, [storesWithDateFilteredStats]);

  const sortedStores = useMemo(() => {
    if (!stores) return [];
    
    let sorted = [...stores];
    
    switch (sortBy) {
      case 'product':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
      case 'available':
        return sorted.sort((a, b) => {
          const aAvailable = a.mediaSpaces.filter(space => space.status === 'available').length;
          const bAvailable = b.mediaSpaces.filter(space => space.status === 'available').length;
          return bAvailable - aAvailable;
        });
      
      case 'inUse':
        return sorted.sort((a, b) => {
          // Fix: Count spaces with active leases instead of just non-available spaces
          const aInUse = a.mediaSpaces.filter(space => 
            space.leases?.some(lease => lease.status !== 'Completado')
          ).length;
          const bInUse = b.mediaSpaces.filter(space => 
            space.leases?.some(lease => lease.status !== 'Completado')
          ).length;
          return bInUse - aInUse;
        });
      
      default:
        return sorted;
    }
  }, [stores, sortBy]);

  if (loading) return <LoadingAnimation />;

  return (
    <RoleGuard allowedRoles={['ADMIN', 'ASSOCIATE']}>
      <div className="space-y-6">
        <QuickStats
          totalAdItems={quickStats.totalAdItems}
          availableSpaces={quickStats.availableSpaces}
          occupiedSpaces={quickStats.occupiedSpaces}
        />
        
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Tiendas</h1>
            <div className="flex gap-3 bg-white p-2 rounded-lg shadow-md">
              <Button 
                onClick={() => sortStores('Product')}
                className={`px-4 py-2 rounded-md transition-all ${
                  sortBy === 'Product' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Ordenar por Producto
              </Button>
              <Button 
                onClick={() => sortStores('Available')}
                className={`px-4 py-2 rounded-md transition-all ${
                  sortBy === 'Available' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Ordenar por Disponibilidad
              </Button>
              <Button 
                onClick={() => sortStores('In Use')}
                className={`px-4 py-2 rounded-md transition-all ${
                  sortBy === 'In Use' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Ordenar por Solicitudes
              </Button>
            </div>
          </div>

          <div className="flex gap-4 mb-6 items-center">
            <div className="flex-none">
              <DateRangeFilter onDateRangeChange={setDateRange} />
            </div>

            <div className="flex-1">
              <Input
                placeholder="Buscar tiendas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex gap-2 flex-none">
              <Select 
                value={selectedMediaItemTypeId} 
                onValueChange={setSelectedMediaItemTypeId}
              >
                <SelectTrigger className="w-[200px] bg-white">
                  <SelectValue placeholder="Todos los Tipos de Medios" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto bg-white">
                  <SelectItem value="all">Todos los Tipos</SelectItem>
                  {mediaItemTypes.map((type) => (
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

              <Select 
                value={selectedBrand} 
                onValueChange={setSelectedBrand}
              >
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Todas las Marcas" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">Todas las Marcas</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {storesWithDateFilteredStats.map((store) => (
              <Link href={`/dashboard/store/${store.id}`} key={store.id} className="block">
                <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 p-4">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">{store.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{store.location}</p>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">{store.stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Disponibles:</span>
                      <span className="font-medium">{store.stats.available}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-600">Ocupados:</span>
                      <span className="font-medium">{store.stats.inUse}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}