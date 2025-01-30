'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import QuickStats from '../components/QuickStats';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { DateRange } from 'react-day-picker';
import { Card, CardContent } from '../components/ui/card';
import { Package, Store } from 'lucide-react';
import { LoadingAnimation } from '../components/LoadingAnimation';
import { RoleGuard } from '../components/RoleGuard';

type MediaItemType = {
  id: number;
  name: string;
  mediaItems: Array<{
    id: number;
    type: string;
    mediaSpaces: Array<{
      id: number;
      status: string;
      leases: Array<{
        id: number;
        startDate: string;
        endDate: string;
        statusId: number;
      }>;
    }>;
  }>;
};

export default function Dashboard() {
  const [mediaItemTypes, setMediaItemTypes] = useState<MediaItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(new Date().getFullYear(), 11, 31)
  });

  useEffect(() => {
    const fetchMediaItemTypes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/media-item-types/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch media item types');
        }
        const data = await response.json();
        console.log('Fetched data:', data);
        setMediaItemTypes(data);
      } catch (error) {
        console.error('Error fetching media item types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMediaItemTypes();
  }, []);

  const filteredAndCalculatedTypes = useMemo(() => {
    return mediaItemTypes
      .filter(type => 
        type.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(type => {
        const allSpaces = type.mediaItems.flatMap(item => item.mediaSpaces);
        
        const stats = {
          total: allSpaces.length,
          inUse: allSpaces.filter(space => 
            space.leases?.some(lease => {
              if (!dateRange?.from || !dateRange?.to) return false;
              
              const leaseStart = new Date(lease.startDate);
              const leaseEnd = new Date(lease.endDate);
              
              // Use the same date range logic as dashboard/dashboard
              return lease.statusId !== 7 && 
                leaseStart <= dateRange.to &&
                leaseEnd >= dateRange.from;
            })
          ).length,
          available: 0
        };
        
        stats.available = stats.total - stats.inUse;

        return {
          ...type,
          stats
        };
      });
  }, [mediaItemTypes, searchQuery, dateRange]);

  const totalStats = useMemo(() => {
    return filteredAndCalculatedTypes.reduce((acc, type) => ({
      total: acc.total + type.stats.total,
      available: acc.available + type.stats.available,
      inUse: acc.inUse + type.stats.inUse
    }), { total: 0, available: 0, inUse: 0 });
  }, [filteredAndCalculatedTypes]);

  if (loading) return <LoadingAnimation />;

  return (
    <RoleGuard allowedRoles={['ADMIN', 'ASSOCIATE']}>
      <div className="space-y-6">
        <QuickStats
          totalAdItems={totalStats.total}
          availableSpaces={totalStats.available}
          occupiedSpaces={totalStats.inUse}
        />
        
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Tipos de Medios</h1>
          </div>

          <div className="flex gap-4 mb-6 items-center">
            <div className="flex-none">
              <DateRangeFilter onDateRangeChange={setDateRange} />
            </div>

            <div className="flex-1">
              <Input
                placeholder="Buscar tipos de medios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndCalculatedTypes.map((type) => (
              <Link href={`/dashboard/dashboard?mediaTypeId=${type.id}`} key={type.id} className="block">
                <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 p-4">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">{type.name}</h3>
                    <p className="text-sm text-gray-600 truncate">
                      {type.mediaItems.length} productos diferentes
                    </p>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">{type.stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Disponibles:</span>
                      <span className="font-medium">{type.stats.available}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-600"> Ocupados:</span>
                      <span className="font-medium">{type.stats.inUse}</span>
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