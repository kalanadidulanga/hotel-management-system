hotel-management-system/
│
├── public/                           # Static assets (images, SVGs, etc.)
│   ├── logo.svg
│   ├── avatars/
│   └── ...
│
├── src/                              # (Optional, but recommended for large projects)
│   ├── app/                          # Next.js App Router (all routes, layouts, pages)
│   │   ├── layout.tsx                # Root layout (sidebar, header, etc.)
│   │   ├── page.tsx                  # Home page
│   │   ├── dashboard/                # Dashboard (all roles)
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (admin)/                  # Route group: admin-only pages (not in URL)
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── account/
│   │   │   │   └── page.tsx
│   │   │   └── ...
│   │   ├── customer/                 # Customer pages (all roles)
│   │   │   └── page.tsx
│   │   ├── payment-setting/          # Payment settings (admin/manager)
│   │   │   └── page.tsx
│   │   ├── room-facilities/
│   │   │   └── page.tsx
│   │   ├── room-reservation/
│   │   │   └── page.tsx
│   │   ├── room-setting/
│   │   │   └── page.tsx
│   │   ├── restuarent/               # Addon: Restaurant (role-based)
│   │   │   ├── page.tsx              # Main restaurant page
│   │   │   ├── pos-invoice/
│   │   │   │   └── page.tsx
│   │   │   ├── order-list/
│   │   │   │   └── page.tsx
│   │   │   ├── manage-table/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── table-list/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── table-setting/
│   │   │   │       └── page.tsx
│   │   │   └── ... (other subpages)
│   │   ├── house-keeping/            # Addon: House Keeping (role-based)
│   │   │   └── page.tsx
│   │   ├── duty-roster/              # Addon: Duty Roster (role-based)
│   │   │   └── page.tsx
│   │   ├── pool-booking/             # Addon: Pool Booking (role-based)
│   │   │   └── page.tsx
│   │   ├── transport-facility/       # Addon: Transport Facility (role-based)
│   │   │   └── page.tsx
│   │   ├── whatsapp/                 # Addon: Whatsapp (role-based)
│   │   │   └── page.tsx
│   │   ├── hall-room/                # Addon: Hall Room (role-based)
│   │   │   └── page.tsx
│   │   ├── settings/                 # User/system settings
│   │   │   └── page.tsx
│   │   ├── profile/                  # User profile
│   │   │   └── page.tsx
│   │   ├── api/                      # API routes (if needed)
│   │   └── (auth)/                   # Route group: authentication pages
│   │       ├── login/
│   │       │   └── page.tsx
│   │       └── register/
│   │           └── page.tsx
│   │
│   ├── components/                   # Reusable components
│   │   ├── layout/                   # Layout components (Sidebar, Header, Footer)
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SidebarUser.tsx
│   │   │   ├── SidebarItem.tsx
│   │   │   └── ...
│   │   ├── sidebar/                  # Sidebar navigation logic/components
│   │   │   ├── SidebarConfig.ts      # Sidebar config/data (role-based)
│   │   │   └── ...
│   │   ├── ui/                       # UI primitives (Button, Card, etc.)
│   │   ├── forms/                    # Reusable form components
│   │   └── ...                       # Other shared components
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useRole.ts
│   │   ├── useSidebarState.ts
│   │   └── ...
│   │
│   ├── lib/                          # Utility functions, helpers
│   │   ├── auth.ts                   # Auth helpers (get user, role, etc.)
│   │   ├── utils.ts
│   │   └── ...
│   │
│   ├── config/                       # Centralized config (sidebar, roles, etc.)
│   │   ├── sidebar.config.ts
│   │   ├── roles.config.ts
│   │   └── ...
│   │
│   ├── styles/                       # (Optional) Additional global or module styles
│   │   └── tailwind.css
│   │
│   └── types/                        # (Optional) Global TypeScript types/interfaces
│       └── index.d.ts
│
├── .env.local                        # Environment variables
├── next.config.ts                    # Next.js config
├── tsconfig.json                     # TypeScript config
├── package.json
├── README.md