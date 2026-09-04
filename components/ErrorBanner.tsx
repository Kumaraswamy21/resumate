type ErrorBannerProps = {
  message: string;
  onDismiss: () => void;
};

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start justify-between gap-3 rounded-lg border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger"
    >
      <p className="flex-1 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded px-2 py-1 text-danger underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
        aria-label="Dismiss error"
      >
        Dismiss
      </button>
    </div>
  );
}
