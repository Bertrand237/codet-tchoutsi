'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginPage({ onSwitchToRegister, onLoginSuccess }: LoginPageProps) {
  const { signIn, loading } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrName, setEmailOrName] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOrName || !password) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs.', variant: 'destructive' });
      return;
    }
    try {
      await signIn(emailOrName, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (error: any) {
      toast({ title: 'Erreur de connexion', description: error?.message || 'Identifiants incorrects.', variant: 'destructive' });
    }
  }

  function handleForgotPassword() {
    toast({
      title: 'Mot de passe oublié',
      description: 'Contactez un administrateur pour réinitialiser votre mot de passe.',
    });
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/20 p-4 overflow-hidden">
      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] dark:opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #059669 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Floating geometric shapes */}
      <div
        className="absolute top-[12%] left-[8%] w-16 h-16 rounded-full bg-emerald-300/20 dark:bg-emerald-500/10"
        style={{ animation: 'float-1 6s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-[18%] right-[10%] w-12 h-12 rounded-xl bg-teal-300/20 dark:bg-teal-500/10"
        style={{ animation: 'float-2 7s ease-in-out infinite' }}
      />
      <div
        className="absolute top-[35%] right-[15%] w-8 h-8 rounded-full bg-emerald-400/15 dark:bg-emerald-600/10"
        style={{ animation: 'float-3 8s ease-in-out infinite' }}
      />

      {/* Card with gradient border wrapper */}
      <motion.div
        className="w-full max-w-md p-[1px] bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-2xl"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Card className="w-full bg-white dark:bg-card/95 backdrop-blur-xl border-0 rounded-[10px] shadow-none">
          <CardContent className="pt-8 pb-6 px-6">
            {/* Header */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-emerald-300 dark:ring-emerald-700/40 shadow-md">
                <img src="/logo.png" alt="CODET" className="h-full w-full object-contain" />
              </div>
              <p className="text-xs text-muted-foreground mt-3 tracking-wide uppercase">Bienvenue</p>
              <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">CODET</h1>
              {/* Decorative emerald line */}
              <div className="w-10 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full mt-2" />
              <p className="text-sm text-muted-foreground mt-2">Comité de Développement Tchoutsi</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email ou nom d&#39;utilisateur</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="login-email"
                    type="text"
                    placeholder="email@exemple.com ou votre nom"
                    value={emailOrName}
                    onChange={(e) => setEmailOrName(e.target.value)}
                    required
                    className="h-12 bg-white/60 dark:bg-background/40 border-emerald-200/60 dark:border-emerald-800/30 focus-visible:ring-emerald-400/40 text-sm pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-white/60 dark:bg-background/40 border-emerald-200/60 dark:border-emerald-800/30 focus-visible:ring-emerald-400/40 text-sm pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-emerald-600"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Afficher le mot de passe"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Se souvenir de moi */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <Label
                  htmlFor="remember-me"
                  className="text-sm text-muted-foreground cursor-pointer select-none"
                >
                  Se souvenir de moi
                </Label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="relative w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors overflow-hidden"
              >
                {loading && (
                  <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                )}
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>

            {/* Bottom section */}
            <div className="flex items-center justify-center gap-2 pt-4">
              <span className="text-sm text-muted-foreground">Pas encore de compte ?</span>
              <Button variant="ghost" onClick={onSwitchToRegister} className="text-sm text-emerald-600 hover:text-emerald-700">
                S&#39;inscrire
              </Button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Forgot password */}
            <div className="flex justify-center">
              <Button
                variant="link"
                onClick={handleForgotPassword}
                className="text-sm text-muted-foreground hover:text-emerald-600 h-auto p-0"
              >
                Mot de passe oublié ?
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
