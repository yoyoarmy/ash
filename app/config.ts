export const config = {
  database: {
    url: process.env.DATABASE_URL,
  },
  email: {
    apiKey: process.env.RESEND_API_KEY,
  },
  auth: {
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL,
  }
}; 