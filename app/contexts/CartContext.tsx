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

export interface LeaseFormData {
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
  giftCampaignDetails?: string;
  planAlaMedida?: string;
  planAlaMedidaAmount?: number;
}

// Define the context type
interface CartContextType {
  items: CartItem[];
  itemCount: number;
  addItem: (item: CartItem) => void;
  removeItem: (spaceId: number) => void;
  clearCart: () => void;
  formData: LeaseFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeaseFormData>>;
}

// Create Context
export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  
  // Ensure formData always has default values
  const [formData, setFormData] = useState<LeaseFormData>({
    customerName: '',
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

  // Function to add an item to the cart
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

  // Function to remove an item from the cart
  const removeItem = (spaceId: number) => {
    setItems(current => current.filter(item => item.spaceId !== spaceId));
  };

  // Function to clear the entire cart
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

// Custom Hook to Use Cart
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
