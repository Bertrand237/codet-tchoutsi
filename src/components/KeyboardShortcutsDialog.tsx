'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface ShortcutEntry {
  keys: string[];
  description: string;
}

const SECTIONS: { title: string; shortcuts: ShortcutEntry[] }[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['⌘/Ctrl', 'K'], description: 'Ouvrir la palette de commandes' },
      { keys: ['Alt', '1'], description: 'Tableau de bord' },
      { keys: ['Alt', '2'], description: 'Projets' },
      { keys: ['Alt', '3'], description: 'Membres' },
      { keys: ['Alt', '4'], description: 'Budget' },
      { keys: ['Alt', '5'], description: 'Calendrier' },
    ],
  },
  {
    title: 'Interface',
    shortcuts: [
      { keys: ['Ctrl', '/'], description: 'Ouvrir / fermer la barre latérale' },
      { keys: ['?'], description: 'Afficher cette aide' },
      { keys: ['Échap'], description: 'Fermer la boîte de dialogue ou la palette' },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded border bg-muted px-2 py-0.5 text-xs font-mono">
      {children}
    </kbd>
  );
}

export default function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleShowShortcuts() {
      setOpen(true);
    }
    document.addEventListener('show-shortcuts', handleShowShortcuts);
    return () => document.removeEventListener('show-shortcuts', handleShowShortcuts);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Raccourcis clavier
          </DialogTitle>
          <DialogDescription>
            Utilisez ces raccourcis pour naviguer plus rapidement dans l&apos;application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {section.title}
              </h3>
              <div className="space-y-1.5">
                {section.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between gap-4 py-1"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <Kbd>{key}</Kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
