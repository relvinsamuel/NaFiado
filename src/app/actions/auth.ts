'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export type AuthActionState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Credenciales incorrectas. Verifica tu correo y contraseña.' };
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

export async function logoutAction() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect('/login');
}