import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  return NextResponse.json(session.user);
} 