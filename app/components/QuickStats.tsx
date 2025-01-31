'use client';

import { useEffect, useState } from 'react';

interface QuickStatsProps {
  totalAdItems: number;
  availableSpaces: number;
  occupiedSpaces: number;
}

export default function QuickStats({ 
  totalAdItems, 
  availableSpaces, 
  occupiedSpaces 
}: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800">Total Espacios</h3>
        <p className="text-3xl font-bold text-blue-600">{totalAdItems}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800">Disponibles</h3>
        <p className="text-3xl font-bold text-green-600">{availableSpaces}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800">Ocupados</h3>
        <p className="text-3xl font-bold text-amber-600">{occupiedSpaces}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800">Utilización</h3>
        <p className="text-3xl font-bold text-purple-600">
          {totalAdItems ? Math.round((occupiedSpaces / totalAdItems) * 100) : 0}%
        </p>
      </div>
    </div>
  );
}

