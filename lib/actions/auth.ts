'use server';

import { auth, signIn, signOut } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import ActivityLog from '@/models/ActivityLog';
import bcrypt from 'bcryptjs';
import { loginSchema, registerSchema, changePasswordSchema } from '@/lib/schemas/auth';
import { revalidatePath } from 'next/cache';

export async function login(formData: FormData) {
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const result = await signIn('credentials', {
    email: validatedFields.data.email,
    password: validatedFields.data.password,
    redirect: false,
  });

  if (result?.error) {
    return { error: 'Invalid credentials' };
  }

  revalidatePath('/adminzenfix');
  return { success: true };
}

export async function register(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const validatedFields = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    phone: formData.get('phone'),
    role: formData.get('role'),
    department: formData.get('department'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  await connectDB();

  const existingUser = await User.findOne({ email: validatedFields.data.email });
  if (existingUser) {
    return { error: 'User already exists' };
  }

  const hashedPassword = await bcrypt.hash(validatedFields.data.password, 12);

  const user = await User.create({
    ...validatedFields.data,
    password: hashedPassword,
  });

  // Log activity
  await ActivityLog.create({
    user: (session.user as any).id,
    action: 'user_created',
    entity: 'user',
    entityId: user._id,
    details: { email: user.email, role: user.role },
  });

  revalidatePath('/adminzenfix/users');
  return { success: true };
}

export async function logout() {
  await signOut({ redirect: false });
  revalidatePath('/adminzenfix');
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  await connectDB();

  const user = await User.findById((session.user as any).id).select('+password');
  if (!user) {
    return { error: 'User not found' };
  }

  const isPasswordValid = await bcrypt.compare(
    validatedFields.data.currentPassword,
    user.password
  );

  if (!isPasswordValid) {
    return { error: 'Current password is incorrect' };
  }

  const hashedPassword = await bcrypt.hash(validatedFields.data.newPassword, 12);
  user.password = hashedPassword;
  await user.save();

  // Log activity
  await ActivityLog.create({
    user: user._id,
    action: 'password_change',
    entity: 'user',
    entityId: user._id,
  });

  return { success: true };
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session) {
    return null;
  }

  await connectDB();
  const user = await User.findById((session.user as any).id);
  return user;
}
