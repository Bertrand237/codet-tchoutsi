'use client';

import { LayoutDashboard, Users, FolderOpen, MessageCircle, Camera } from 'lucide-react';

// ==================== Types ====================

interface MobileBottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  hasDot?: boolean;
}

// ==================== Navigation Items ====================

const navItems: NavItem[] = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Membres', href: '/members', icon: Users },
  { label: 'Projets', href: '/projects', icon: FolderOpen },
  { label: 'Messagerie', href: '/chat', icon: MessageCircle, hasDot: true },
  { label: 'Souvenirs', href: '/gallery', icon: Camera },
];

// ==================== Component ====================

export default function MobileBottomNav({ currentPage, onNavigate }: MobileBottomNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t"
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="flex justify-around items-end pt-1.5 pb-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = currentPage === item.href;
          const Icon = item.icon;

          return (
            <button
              key={item.href}
              type="button"
              onClick={() => onNavigate(item.href)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex flex-col items-center gap-0.5 min-w-[56px] py-0.5 px-1 transition-colors duration-200 cursor-pointer relative',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400',
              ].join(' ')}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute -top-0.5 h-1 w-1 rounded-full bg-emerald-500" />
              )}

              {/* Icon with optional notification dot */}
              <span className="relative">
                <Icon className="h-5 w-5 transition-all duration-200" />
                {item.hasDot && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                )}
              </span>

              {/* Label */}
              <span className="text-[10px] leading-tight font-medium transition-colors duration-200">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
