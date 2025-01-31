'use client';

import { useState } from 'react';
import { useRouter, redirect } from 'next/navigation';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { LoadingAnimation } from '../components/LoadingAnimation';
import { useSession } from 'next-auth/react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';

type UserRole = 'ASSOCIATE' | 'ADVERTISER';

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ASSOCIATE');

  if (status === 'loading') {
    return <LoadingAnimation />;
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: selectedRole,
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      router.push('/login?registered=true');
    } catch (error) {
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingAnimation />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Crear Cuenta de Usuario</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol del Usuario
            </label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="ASSOCIATE">
                  <div className="flex flex-col">
                    <span>Asociado</span>
                    <span className="text-xs text-gray-500">Puede gestionar tiendas y inventario</span>
                  </div>
                </SelectItem>
                <SelectItem value="ADVERTISER">
                  <div className="flex flex-col">
                    <span>Cliente</span>
                    <span className="text-xs text-gray-500">Puede reservar espacios de publicidad</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            Crear Cuenta
          </Button>
        </form>
      </div>
    </div>
  );
} 