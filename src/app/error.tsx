'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
        <p className="mt-2 text-slate-500 text-sm">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
