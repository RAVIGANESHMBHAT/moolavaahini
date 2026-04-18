import Link from 'next/link'

export const metadata = { title: 'Page Not Found' }

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="mb-4 text-6xl font-bold text-saffron-600">404</p>
      <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">
        ಮೂಲವಾಹಿನಿ
      </h1>
      <p className="mb-2 text-lg font-medium text-gray-700">
        Page not found
      </p>
      <p className="mb-10 text-sm text-gray-500">
        The page you are looking for may have been moved, deleted, or never existed.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-saffron-600 px-6 py-3 text-sm font-semibold text-white hover:bg-saffron-700"
        >
          Go Home
        </Link>
        <Link
          href="/search"
          className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Browse All
        </Link>
      </div>
    </div>
  )
}
