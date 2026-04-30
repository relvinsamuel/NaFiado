import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Si Supabase refresca la sesión, debemos propagar esas cookies
          // a la respuesta nativa de Next para que vuelvan al navegador.
          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Usamos getUser() en lugar de getSession() porque valida la sesión
  // contra el servidor de Supabase y no se limita a leer la cookie local.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isAuthenticated = !error && !!user;
  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === '/login';
  const isProtectedRoute = pathname !== '/login';

  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isLoginRoute && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml|woff|woff2|ttf)$).*)',
  ],
};