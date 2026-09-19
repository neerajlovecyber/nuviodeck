import { useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { ArrowRight, X, Sparkles } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { ThemeToggle } from './theme-toggle'

export interface Hero11NavItem {
  label: string
  href: string
  isRoute?: boolean
}

export interface Hero11Props {
  brandName?: string
  navItems?: Hero11NavItem[]
  ctaText?: string
  ctaHref?: string
  title?: string
  description?: string
  primaryText?: string
  primaryHref?: string
  backgroundImage?: string
}

const defaultNavItems: Hero11NavItem[] = [
  { label: 'Catalogs', href: '#features' },
  { label: 'Debrid Engine', href: '#features' },
  { label: 'Manifests', href: '#features' },
]

const defaultBackground = 'https://assets.watermelon.sh/hero-11-bg.avif'

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -16, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.68, bounce: 0 },
  },
}

const contentContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.1,
    },
  },
}

const contentItem: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.72, bounce: 0 },
  },
}

const backgroundVariants: Variants = {
  hidden: { opacity: 0, scale: 1.035, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 1.15, bounce: 0 },
  },
}

function MenuIcon() {
  return (
    <span
      className="h-3.5 w-4 bg-[linear-gradient(to_bottom,currentColor_0_2px,transparent_2px_6px,currentColor_6px_8px,transparent_8px_12px,currentColor_12px_14px)]"
      aria-hidden="true"
    />
  )
}

export function Hero11({
  brandName = 'Nuviodeck',
  navItems = defaultNavItems,
  ctaText = 'Open App',
  ctaHref = '/dashboard',
  title = 'Timeless Cinema,\nThoughtfully Curated.',
  description = 'Personalized media catalog engine and Debrid manifest manager. Curate custom profiles, merge timed subtitles, and stream directly to Stremio & Kodi.',
  primaryText = 'Launch Workspace',
  primaryHref = '/dashboard',
  backgroundImage = defaultBackground,
}: Hero11Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <section className="relative isolate w-full overflow-hidden bg-stone-100 font-sans text-teal-950 antialiased min-h-screen dark:bg-[#0c0f12] dark:text-stone-100">
      {/* Background Image with Art Texture */}
      <motion.div
        variants={backgroundVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        className="absolute inset-0 will-change-transform"
        aria-hidden="true"
      >
        <img
          src={backgroundImage}
          alt="Artistic landscape"
          className="h-full w-full object-cover object-center outline-1 outline-black/10 dark:opacity-60"
        />
      </motion.div>

      {/* Atmospheric Gradients */}
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,246,236,0.95)_0%,rgba(250,246,236,0.80)_36%,rgba(250,246,236,0.25)_68%,rgba(250,246,236,0.05)_100%)] dark:bg-[linear-gradient(90deg,rgba(12,15,18,0.96)_0%,rgba(12,15,18,0.84)_36%,rgba(12,15,18,0.35)_68%,rgba(12,15,18,0.15)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,246,236,0.75)_0%,rgba(250,246,236,0.06)_42%,rgba(250,246,236,0.18)_100%)] dark:bg-[linear-gradient(180deg,rgba(12,15,18,0.75)_0%,rgba(12,15,18,0.10)_42%,rgba(12,15,18,0.35)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-[690px] w-full max-w-[1440px] flex-col px-6 py-5 sm:min-h-screen sm:px-10 lg:px-[72px]">
        {/* Navigation Header */}
        <motion.header
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.8 }}
          className="flex h-12 items-center justify-between"
        >
          <Link
            to="/"
            className="inline-flex min-h-10 items-center gap-2.5 text-[22px] leading-none font-semibold tracking-tight text-teal-950 dark:text-stone-100 transition-[opacity,transform] duration-200 ease-out hover:opacity-85 active:scale-[0.96]"
          >
            <div className="size-8 rounded-full bg-teal-950 dark:bg-stone-100 flex items-center justify-center text-stone-100 dark:text-teal-950 font-bold text-base shadow-xs">
              N
            </div>
            <span>{brandName}</span>
          </Link>

          <nav className="hidden items-center gap-[44px] lg:flex">
            {navItems.map((item) =>
              item.isRoute ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className="inline-flex min-h-10 items-center text-sm leading-none font-medium text-teal-950/85 dark:text-stone-200/85 transition-colors duration-200 ease-out hover:text-teal-800 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="inline-flex min-h-10 items-center text-sm leading-none font-medium text-teal-950/85 dark:text-stone-200/85 transition-colors duration-200 ease-out hover:text-teal-800 dark:hover:text-white"
                >
                  {item.label}
                </a>
              )
            )}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to={ctaHref}
              className="hidden min-h-10 items-center justify-center rounded-full bg-teal-950 px-6 text-sm leading-none font-medium text-stone-100 shadow-[0_1px_2px_rgba(15,23,42,0.14)] transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-teal-900 hover:shadow-[0_2px_7px_rgba(15,23,42,0.18)] active:scale-[0.97] dark:bg-stone-100 dark:text-teal-950 dark:hover:bg-stone-200 sm:inline-flex"
            >
              {ctaText}
            </Link>

            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-full bg-teal-950 text-stone-100 shadow-[0_1px_2px_rgba(15,23,42,0.14)] transition-[background-color,transform] duration-200 ease-out hover:bg-teal-900 active:scale-[0.96] dark:bg-stone-100 dark:text-teal-950 lg:hidden"
            >
              <MenuIcon />
            </button>
          </div>
        </motion.header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence initial={false}>
          {mobileOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(5px)' }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              className="fixed inset-x-4 top-4 z-50 rounded-2xl bg-stone-50/95 dark:bg-stone-900/95 p-5 text-teal-950 dark:text-stone-100 shadow-[0_24px_80px_rgba(15,23,42,0.22)] outline outline-1 outline-white/70 dark:outline-white/10 backdrop-blur-xl lg:hidden"
            >
              <div className="flex items-center justify-between pl-2">
                <span className="text-xl font-semibold tracking-tight">
                  {brandName}
                </span>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex size-10 items-center justify-center rounded-full text-teal-950 dark:text-stone-100 transition-[background-color] duration-200 ease-out hover:bg-teal-950/5 dark:hover:bg-white/10 active:scale-[0.96]"
                >
                  <X className="size-4" />
                </button>
              </div>

              <nav className="mt-5 grid gap-1">
                {navItems.map((item) =>
                  item.isRoute ? (
                    <Link
                      key={item.label}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-teal-950 dark:text-stone-100 transition-colors duration-200 ease-out hover:bg-teal-950/5 dark:hover:bg-white/10 rounded-full"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-teal-950 dark:text-stone-100 transition-colors duration-200 ease-out hover:bg-teal-950/5 dark:hover:bg-white/10 rounded-full"
                    >
                      {item.label}
                    </a>
                  )
                )}
              </nav>

              <Link
                to={ctaHref}
                onClick={() => setMobileOpen(false)}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-teal-950 px-5 text-sm font-semibold text-stone-100 dark:bg-stone-100 dark:text-teal-950 transition-[background-color,transform] duration-200 ease-out hover:bg-teal-900 active:scale-[0.97]"
              >
                {ctaText}
              </Link>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Hero Content */}
        <motion.div
          variants={contentContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.42 }}
          className="flex flex-1 items-start pt-[68px] sm:pt-[96px] lg:pt-[84px]"
        >
          <div className="max-w-[580px]">
            {/* Heritage Badge */}
            <motion.div
              variants={contentItem}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-950/15 bg-white/40 dark:bg-black/30 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md"
            >
              <Sparkles className="size-3.5 text-teal-800 dark:text-amber-400" />
              <span>Visual Catalog Builder • Zero JSON Config</span>
            </motion.div>

            <motion.h1
              variants={contentItem}
              className="text-[clamp(2.75rem,4.85vw,5.15rem)] leading-[1.04] font-serif font-normal tracking-[-0.035em] text-balance whitespace-pre-line text-teal-950 dark:text-stone-100"
            >
              {title}
            </motion.h1>

            <motion.p
              variants={contentItem}
              className="mt-6 max-w-[440px] text-[clamp(1rem,1.15vw,1.15rem)] leading-[1.5] font-normal text-pretty text-teal-950/80 dark:text-stone-300/85"
            >
              {description}
            </motion.p>

            <motion.div variants={contentItem} className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={primaryHref}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-teal-950 px-7 text-sm leading-none font-semibold text-stone-100 shadow-[0_1px_2px_rgba(15,23,42,0.16)] transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-teal-900 hover:shadow-[0_4px_12px_rgba(15,23,42,0.2)] active:scale-[0.97] dark:bg-stone-100 dark:text-teal-950 dark:hover:bg-stone-200"
              >
                <span>{primaryText}</span>
                <ArrowRight className="size-4" />
              </Link>
            </motion.div>

            {/* Feature Highlights Pills */}
            <motion.div
              variants={contentItem}
              className="mt-12 flex flex-wrap items-center gap-6 pt-6 border-t border-teal-950/10 dark:border-white/10 text-xs font-medium text-teal-950/70 dark:text-stone-400"
            >
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-teal-800 dark:bg-amber-400" />
                <span>Signed Manifest URLs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-teal-800 dark:bg-amber-400" />
                <span>Real-Debrid & AllDebrid</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-teal-800 dark:bg-amber-400" />
                <span>Stremio & Kodi Ready</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
