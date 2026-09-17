import { api, extractApiErrorMessage } from '@/lib/api';

export async function changePassword(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!currentPassword || !newPassword) {
    return { error: 'Current and new passwords are required' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Passwords do not match' };
  }

  if (newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters long.' };
  }

  const res = await api.post('/users/change_password/', {
    old_password: currentPassword,
    new_password: newPassword,
  });

  if (res.error) {
    return { error: extractApiErrorMessage(res) };
  }

  return { success: true };
}