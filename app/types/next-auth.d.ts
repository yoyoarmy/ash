import 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: string;
    // add other custom properties here
  }

  interface Session {
    user: User & {
      role?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
} 