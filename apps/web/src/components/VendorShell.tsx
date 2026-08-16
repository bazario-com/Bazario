import { VendorSidebar } from './VendorSidebar';

export function VendorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:gap-8">
      <VendorSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
