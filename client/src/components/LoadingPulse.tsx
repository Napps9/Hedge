function LoadingPulse() {
  return (
    <div className="flex items-center gap-1.5 py-4">
      <div className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse-1" />
      <div className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse-2" />
      <div className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse-3" />
    </div>
  );
}

export default LoadingPulse;
