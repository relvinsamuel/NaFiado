'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export type AuthActionState = {
  error?: string;
  success?: boolean | string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export async function loginAction(formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('ERROR REAL DE SUPABASE:', error.message);
    return { error: error.message };
  }

  return { success: true };
}

export async function signupAction(formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signupTenantAction(
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const companyName = String(formData.get('companyName') ?? '').trim();

  if (!EMAIL_REGEX.test(email)) {
    return { error: 'El correo no tiene un formato valido.' };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `La contrasena debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }

  if (!companyName) {
    return { error: 'El nombre de la empresa es obligatorio.' };
  }

  const headerStore = await headers();
  const requestOrigin = headerStore.get('origin');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? requestOrigin ?? 'http://localhost:3000';

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        empresa: companyName,
        rol: 'admin_tenant',
      },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return {
      success:
        'Cuenta creada. Revisa tu bandeja de entrada para confirmar tu correo antes de continuar.',
    };
  }

  redirect('/');
}

export async function registerTenantAdminAction(
  formData: FormData
): Promise<AuthActionState> {
  return signupTenantAction(formData);
}

export async function logoutAction() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect('/login');
}