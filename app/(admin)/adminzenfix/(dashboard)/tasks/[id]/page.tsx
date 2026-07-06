'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import {
  ArrowLeft, Clock, User, Calendar,
  Play, CheckCircle2, XCircle, MessageSquare,
  Loader2, AlertTriangle, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  startTask, completeTask, markNotCompleted,
  approveTask, rejectTask, addComment,
} from '@/lib/actions/task';
