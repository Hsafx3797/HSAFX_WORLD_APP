import { Metadata } from 'next';
import { SettingsClient } from '@/components/settings-client';

export const metadata: Metadata = {
  title: 'Settings - HSAFX World',
  description: 'Manage your account settings and preferences',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
