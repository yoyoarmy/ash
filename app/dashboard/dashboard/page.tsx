'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QuickStats from '../../components/QuickStats';
import { Button } from '../../components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { DateRangeFilter } from '../../components/DateRangeFilter';
import { DateRange } from 'react-day-picker';
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
      mediaItemType: { name: string; id: number };
      id: number;
      type: string;
      dimensions: string;
      basePrice: number;
      leaseDuration: number;
    };
    leases: Array<{ startDate: string; endDate: string; status: string }>;
  }>;
  stats: { total: number; available: number; inUse: number };
};

type SortType = 'Product' | 'Available' | 'In Use' | 'None';

// Extract the content into a separate component
function DashboardContent() {
  const searchParams = useSearchParams(); // ✅ FIX: Now inside the Suspense-wrapped component
  const mediaTypeId = searchParams.get('mediaTypeId');

  const [stores, setStores] = useState<Store[]>([]);
  const [sortBy, setSortBy] = useState<SortType>('None');
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(new Date().getFullYear(), 11, 31),
  });
  const [selectedMediaItemTypeId, setSelectedMediaItemTypeId] = useState<string>(mediaTypeId || 'all');
  const [mediaItemTypes, setMediaItemTypes] = useState<Array<{ id: number; name: string }>>([]);
  const { addNotification } = useNotifications();

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
        if (!response.ok) throw new Error('Failed to fetch stores');
        const data = await response.json();
        if (data.error) throw new Error(data.error);
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
      .then((res) => res.json())
      .then((data) => setBrands(data))
      .catch((err) => console.error('Failed to fetch brands:', err));
  }, []);

  useEffect(() => {
    fetch('/api/media-item-types')
      .then((res) => res.json())
      .then((data) => {
        setMediaItemTypes(data);
      })
      .catch((err) => console.error('Failed to fetch media items:', err));
  }, []);

  if (loading) return <LoadingAnimation />;

  return (
    <div className="space-y-6">
      <QuickStats totalAdItems={0} availableSpaces={0} occupiedSpaces={0} />
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Tiendas</h1>
        </div>

        <div className="flex gap-4 mb-6 items-center">
          <DateRangeFilter onDateRangeChange={setDateRange} />
          <Input
            placeholder="Buscar tiendas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {stores.map((store) => (
            <Link href={`/dashboard/store/${store.id}`} key={store.id} className="block">
              <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 p-4">
                <h3 className="text-lg font-semibold text-gray-800 truncate">{store.name}</h3>
                <p className="text-sm text-gray-600 truncate">{store.location}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Wrap DashboardContent inside <Suspense>
export default function DashboardPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'ASSOCIATE']}>
      <Suspense fallback={<LoadingAnimation />}>
        <DashboardContent />
      </Suspense>
    </RoleGuard>
  );
}
