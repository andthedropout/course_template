interface CheckoutLayoutProps {
  children: React.ReactNode;
}

export function CheckoutLayout({ children }: CheckoutLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <main>
        {children}
      </main>
    </div>
  );
}
