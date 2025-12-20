/**
 * Unified Icon Component
 *
 * Handles both Lucide and Iconify icons seamlessly with a single API.
 *
 * Usage:
 *
 * // Lucide icons (UI elements) - use camelCase name
 * <Icon name="Menu" className="h-5 w-5" />
 * <Icon name="ChevronDown" className="h-4 w-4" />
 *
 * // Iconify icons (brands, specialty) - use "collection:name" format
 * <Icon name="logos:facebook" className="h-6 w-6" />
 * <Icon name="logos:stripe" className="h-8 w-8" />
 * <Icon name="cryptocurrency:btc" className="h-10 w-10" />
 *
 * Search icons:
 * - Lucide: https://lucide.dev
 * - Iconify: https://icon-sets.iconify.design
 */

import React from 'react'
import { Icon as IconifyIcon } from '@iconify/react'
import * as LucideIcons from 'lucide-react'
import { LucideProps } from 'lucide-react'

interface IconProps extends Omit<LucideProps, 'ref'> {
  /**
   * Icon name.
   *
   * For Lucide icons: Use camelCase name (e.g., "Menu", "ChevronDown", "Facebook")
   * For Iconify icons: Use "collection:name" format (e.g., "logos:facebook", "cryptocurrency:btc")
   *
   * If name contains ":", automatically uses Iconify
   * Otherwise, tries Lucide first, falls back to Iconify if not found
   */
  name: string
}

/**
 * Unified icon component that handles both Lucide and Iconify icons.
 *
 * Automatically detects which library to use based on icon name format:
 * - Names with ":" (e.g., "logos:facebook") → Iconify
 * - Names without ":" (e.g., "Menu") → Lucide, then Iconify fallback
 */
export function Icon({ name, className, size, color, strokeWidth, ...props }: IconProps) {
  // If name contains ":", it's definitely an Iconify icon
  if (name.includes(':')) {
    return (
      <IconifyIcon
        icon={name}
        className={className}
        width={size}
        height={size}
        style={{ color }}
        {...(props as any)}
      />
    )
  }

  // Try to find the icon in Lucide
  const LucideIcon = (LucideIcons as any)[name]

  if (LucideIcon) {
    // Render Lucide icon
    return (
      <LucideIcon
        className={className}
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        {...props}
      />
    )
  }

  // If not found in Lucide, try Iconify with common prefixes
  // This provides a fallback for brand icons that might be requested by name
  const iconifyFallbacks = [
    `logos:${name.toLowerCase()}`,
    `simple-icons:${name.toLowerCase()}`,
    `bi:${name.toLowerCase()}`,
    `mdi:${name.toLowerCase()}`,
  ]

  // Try first fallback (logos is most common for brands)
  return (
    <IconifyIcon
      icon={iconifyFallbacks[0]}
      className={className}
      width={size}
      height={size}
      style={{ color }}
      {...(props as any)}
    />
  )
}

/**
 * Helper hook to check if an icon exists in Lucide
 * Useful for conditional rendering or validation
 */
export function useIconExists(name: string): { exists: boolean; library: 'lucide' | 'iconify' | 'unknown' } {
  if (name.includes(':')) {
    return { exists: true, library: 'iconify' }
  }

  const LucideIcon = (LucideIcons as any)[name]
  if (LucideIcon) {
    return { exists: true, library: 'lucide' }
  }

  return { exists: false, library: 'unknown' }
}

export default Icon
