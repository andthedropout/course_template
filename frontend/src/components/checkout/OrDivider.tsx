export function OrDivider() {
  return (
    <div className="relative my-8">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white dark:bg-background px-4 text-muted-foreground font-medium">
          Or
        </span>
      </div>
    </div>
  );
}
