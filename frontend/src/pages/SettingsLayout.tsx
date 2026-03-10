import { Outlet, NavLink } from 'react-router-dom';
import { User, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const settingsNav = [
  { title: 'Account', href: '/settings/account', icon: User },
  { title: 'Preferences', href: '/settings/preferences', icon: Sliders },
];

export default function SettingsLayout() {
  return (
    <div className="p-6 lg:p-8">
      <motion.div className="mb-8" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </motion.div>

      <motion.div className="flex flex-col lg:flex-row gap-8" variants={fadeUp} initial="hidden" animate="visible" custom={0.1}>
        {/* Sidebar Nav */}
        <nav className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-2">
            {settingsNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-3xl">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
