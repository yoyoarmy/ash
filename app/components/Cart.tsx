'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

type CartItem = {
  id: number;
  mediaSpaceId: number;
  storeName: string;
  mediaType: string;
  startDate: string;
  endDate: string;
  amount: number;
};

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Load cart items from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  const removeFromCart = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems));
  };

  const proceedToCheckout = () => {
    if (items.length > 0) {
      router.push('/leasing/checkout');
    }
  };

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  if (items.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        El carrito está vacío
      </div>
    );
  }

  return (
    <div className="p-4">
      {items.map((item, index) => (
        <div key={index} className="border-b border-gray-200 py-4">
          <div className="flex justify-between">
            <div>
              <h3 className="font-medium">{item.storeName}</h3>
              <p className="text-sm text-gray-600">{item.mediaType}</p>
              <p className="text-sm text-gray-600">
                {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">${item.amount}</p>
              <button
                onClick={() => removeFromCart(index)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="mt-4 border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total:</span>
          <span className="font-medium">${total}</span>
        </div>
        <Button
          onClick={proceedToCheckout}
          className="w-full mt-4"
        >
          Proceder al Pago
        </Button>
      </div>
    </div>
  );
} 