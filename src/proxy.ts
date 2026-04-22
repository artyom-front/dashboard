
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Пока просто пропускаем всё
  return NextResponse.next();
}

// Конфигурация осталась прежней
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};