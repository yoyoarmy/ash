'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { LoadingAnimation } from '../components/LoadingAnimation';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const response = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
      callbackUrl: '/api/auth/session'
    });

    if (response?.error) {
      setError('Invalid credentials');
      setLoading(false);
    } else {
      const session = await fetch('/api/auth/session');
      const data = await session.json();
      
      if (data?.user?.role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/leasing');
      }
    }
  };

  if (loading) return <LoadingAnimation />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
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

          <Button type="submit" className="w-full">
            Iniciar Sesión
          </Button>
        </form>
      </div>
    </div>
  );
} 