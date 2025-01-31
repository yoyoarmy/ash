'use client';

import { createContext, useContext, useState } from 'react';

interface CartItem {
  spaceId: number;
  storeName: string;
  mediaType: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  extraInformation: {
    customerName?: string;
    providerInfo?: string;
    productDetails?: string;
    campaignRedirect?: string;
    marketingGoals?: string;
    disclaimer?: string;
    productUrl?: string;
    targetAudience?: string;
    brandGraphics?: string;
    providerContact?: string;
    billingType?: string[];
    giftCampaignDetails?: string;
    planAlaMedida?: string;
    planAlaMedidaAmount?: number;
  };
}

type LeaseFormData = {
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
  billingType: string[];
  giftCampaignDetails: string;
  planAlaMedida?: string;
  planAlaMedidaAmount?: number;
};

export const CartContext = createContext<{
  items: CartItem[];
  itemCount: number;
  addItem: (item: CartItem) => void;
  removeItem: (spaceId: number) => void;
  clearCart: () => void;
  formData: LeaseFormData | null;
  setFormData: (data: LeaseFormData) => void;
}>({
  items: [],
  itemCount: 0,
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  formData: null,
  setFormData: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState<LeaseFormData | null>(null);

  const addItem = (item: CartItem) => {
    console.log('Adding item to cart with planAlaMedida:', {
      planAlaMedida: item.extraInformation.planAlaMedida,
      planAlaMedidaAmount: item.extraInformation.planAlaMedidaAmount
    });

    const newItem = {
      ...item,
      extraInformation: {
        ...item.extraInformation,
        planAlaMedida: item.extraInformation.planAlaMedida ?? null,
        planAlaMedidaAmount: item.extraInformation.planAlaMedidaAmount ?? null
      }
    };

    console.log('Processed cart item:', newItem);

    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (spaceId: number) => {
    setItems(current => current.filter(item => item.spaceId !== spaceId));
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{ 
      items, 
      formData,
      addItem, 
      removeItem, 
      clearCart,
      setFormData,
      itemCount: items.length 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 