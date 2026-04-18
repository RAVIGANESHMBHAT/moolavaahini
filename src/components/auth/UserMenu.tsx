'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { signOut } from '@/actions/auth.actions'
import { Link, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import type { UserRole } from '@/types'

const COMMUNITIES = [
  { name: 'Havyaka', slug: 'havyaka' },
  { name: 'General Kannada', slug: 'general-kannada' },
]

interface UserMenuProps {
  profile: {
    display_name: string | null
    avatar_url: string | null
    role: UserRole
  }
}

export function UserMenu({ profile }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const [communityOpen, setCommunityOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('nav')
  const pathname = usePathname()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
        setCommunityOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = profile.display_name?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-gray-200 hover:border-saffron-400"
        aria-label="User menu"
      >
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt={profile.display_name ?? 'User'} width={36} height={36} className="object-cover" />
        ) : (
          <span className="bg-saffron-100 text-saffron-700 flex h-full w-full items-center justify-center text-xs font-semibold">
            {initials}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 min-w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          <div className="border-b border-gray-100 px-4 py-2.5">
            <p className="text-sm font-medium text-gray-900">{profile.display_name ?? 'User'}</p>
            <p className="text-xs capitalize text-gray-500">{profile.role}</p>
          </div>

          <div className="py-1">
            {/* Community submenu */}
            <div className="relative">
              <button
                onClick={() => setCommunityOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {t('community')}
                <svg
                  className={`h-3.5 w-3.5 text-gray-400 transition-transform ${communityOpen ? 'rotate-90' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {communityOpen && (
                <div className="mt-0.5 border-t border-gray-100 bg-gray-50 py-1">
                  {COMMUNITIES.map((c) => {
                    const isActive = pathname === `/${c.slug}` || pathname.startsWith(`/${c.slug}/`)
                    return (
                      <Link
                        key={c.slug}
                        href={`/${c.slug}`}
                        className={`flex items-center justify-between px-6 py-2 text-sm hover:bg-gray-100 ${isActive ? 'font-semibold text-saffron-700' : 'text-gray-700'}`}
                        onClick={() => { setOpen(false); setCommunityOpen(false) }}
                      >
                        {c.name}
                        {isActive && (
                          <svg className="h-3.5 w-3.5 text-saffron-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            <Link
              href="/dashboard"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              {t('myPosts')}
            </Link>
            <Link
              href="/posts/new"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              {t('write')}
            </Link>
            {(profile.role === 'admin' || profile.role === 'contributor') && (
              <Link
                href="/admin"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                {t('admin')}
              </Link>
            )}
          </div>

          <div className="border-t border-gray-100 py-1">
            <form action={signOut}>
              <button
                type="submit"
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                {t('signOut')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
