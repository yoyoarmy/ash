'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Filter, PlusCircle, RefreshCcw } from 'lucide-react';

interface MediaDashboardProps {
  storeId: string;
}

export const MediaDashboard = ({ storeId }: MediaDashboardProps) => {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMediaItems = async () => {
      try {
        const response = await fetch(`/api/stores/${storeId}/media`);
        if (!response.ok) throw new Error('Failed to fetch media items');
        const data = await response.json();
        setMediaItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMediaItems();
  }, [storeId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      reserved: 'bg-yellow-100 text-yellow-800',
      sold: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Media Management Dashboard</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <PlusCircle className="w-4 h-4" />
            Add Media
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaItems.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </CardTitle>
              <Badge className={getStatusColor(item.status)}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{item.location}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                  </span>
                </div>
                {item.client && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Client:</span> {item.client}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}; 