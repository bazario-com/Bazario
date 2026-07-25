import { VendorProductForm } from '@/components/VendorProductForm';

export default function NewVendorProductPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Add a Product</h1>
      <VendorProductForm mode="create" />
    </div>
  );
}
