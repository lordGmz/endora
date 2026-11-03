// Icônes de l'interface : tracés simples, couleur héritée du texte (`currentColor`).

import type { ReactNode } from 'react'

function Icon({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  )
}

export const GearIcon = ({ size }: SizedIcon) => (
  <Icon size={size}>
    <path d="M18.77 9.56 L21.39 10.02 L21.39 13.98 L18.77 14.44 L18.51 15.07 L20.04 17.25 L17.25 20.04 L15.07 18.51 L14.44 18.77 L13.98 21.39 L10.02 21.39 L9.56 18.77 L8.93 18.51 L6.75 20.04 L3.96 17.25 L5.49 15.07 L5.23 14.44 L2.61 13.98 L2.61 10.02 L5.23 9.56 L5.49 8.93 L3.96 6.75 L6.75 3.96 L8.93 5.49 L9.56 5.23 L10.02 2.61 L13.98 2.61 L14.44 5.23 L15.07 5.49 L17.25 3.96 L20.04 6.75 L18.51 8.93 Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

export const BellIcon = () => (
  <Icon>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Icon>
)

export const ServicesIcon = ({ size }: SizedIcon) => (
  <Icon size={size}>
    <rect x="3" y="4" width="18" height="6" rx="1.5" />
    <rect x="3" y="14" width="18" height="6" rx="1.5" />
    <path d="M7 7h.01M7 17h.01M11 7h6M11 17h6" />
  </Icon>
)

type SizedIcon = { size?: number }

export const CollectionsIcon = ({ size }: SizedIcon) => (
  <Icon size={size}>
    <path d="M3 7.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18V9.5A1.5 1.5 0 0 0 19.5 8h-7l-2-2.5h-6A1.5 1.5 0 0 0 3 7Z" />
  </Icon>
)

export const EnvironmentsIcon = ({ size }: SizedIcon) => (
  <Icon size={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
  </Icon>
)

export const HistoryIcon = ({ size }: SizedIcon) => (
  <Icon size={size}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5" />
    <path d="M3.5 4v4.5H8M12 7.5V12l3 2" />
  </Icon>
)

export const EyeIcon = () => (
  <Icon>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Icon>
)

export const SidebarIcon = () => (
  <Icon>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </Icon>
)

export const TerminalIcon = () => (
  <Icon>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="m7 9 3 3-3 3M12.5 15H17" />
  </Icon>
)

export const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.4-4.4" />
  </Icon>
)
