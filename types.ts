export interface NavItem {
  label: string;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'About APRO', path: '/about' },
  // { label: 'Resources', path: '/resources' },
  { label: 'Events', path: '/events' },
  { label: 'Feedback', path: '/feedback' },
  { label: 'Contact', path: '/contact' },
  { label: 'Membership', path: '/membership' },
  { label: 'Legal', path: '/legal' },
];
