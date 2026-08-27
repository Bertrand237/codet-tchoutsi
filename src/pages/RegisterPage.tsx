'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, UserPlus, Eye, EyeOff, User, Mail, Lock, Phone } from 'lucide-react';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess?: () => void;
}

export default function RegisterPage({ onSwitchToLogin, onRegisterSuccess }: RegisterPageProps) {
  const { signUp, loading } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'monsieur' as const,
    phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    try {
      await signUp(formData);
      toast({ title: 'Succès', description: 'Compte créé avec succès !' });
      onRegisterSuccess?.();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-background">
      <Card className="w-full max-w-md bg-white/80 dark:bg-card/80 backdrop-blur-xl border-emerald-200/60 shadow-xl">
        <CardContent className="pt-8">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden mb-4 ring-2 ring-emerald-200">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">Inscription</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nom complet</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Civilité</Label>
                <Select value={formData.gender} onValueChange={val => setFormData({ ...formData, gender: val as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monsieur">Monsieur</SelectItem>
                    <SelectItem value="madame">Madame</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Téléphone</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'S\'inscrire'}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="w-full" onClick={onSwitchToLogin}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la connexion
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
