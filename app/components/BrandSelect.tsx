'use client';

import { useState, useEffect } from 'react';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { ChevronDown } from 'lucide-react';

type Brand = {
  id: number;
  name: string;
};

interface BrandSelectProps {
  value: number;
  onChange: (brandId: number) => void;
}

export function BrandSelect({ value, onChange }: BrandSelectProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    console.log('BrandSelect: Starting fetch...');
    fetch('/api/brands')
      .then(async res => {
        console.log('BrandSelect: Response status:', res.status);
        const data = await res.json();
        console.log('BrandSelect: Received data:', data);
        if (Array.isArray(data) && data.length > 0) {
          console.log('BrandSelect: Setting brands:', data);
          setBrands(data);
        } else {
          console.warn('BrandSelect: No brands found in response');
          setBrands([]);
        }
      })
      .catch(err => {
        console.error('BrandSelect: Failed to fetch brands:', err);
        setBrands([]);
      });
  }, []);

  console.log('BrandSelect: Current brands:', brands);
  console.log('BrandSelect: Selected value:', value);
  const selectedBrand = brands.find(b => b.id === value);
  console.log('BrandSelect: Selected brand:', selectedBrand);

  return (
    <div className="space-y-2">
      <Label htmlFor="brand">Marca</Label>
      <div className="relative">
        <Button
          type="button"
          className="w-full justify-between bg-white border border-gray-300 hover:bg-gray-50"
          onClick={() => {
            console.log('BrandSelect: Toggle dropdown, current brands:', brands);
            setIsOpen(!isOpen);
          }}
        >
          {selectedBrand ? selectedBrand.name : 'Selecciona una marca'}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
            {brands.length > 0 ? (
              brands.map(brand => (
                <button
                  key={brand.id}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-gray-100"
                  onClick={() => {
                    console.log('BrandSelect: Selected brand:', brand);
                    onChange(brand.id);
                    setIsOpen(false);
                  }}
                >
                  {brand.name}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500">No brands available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 