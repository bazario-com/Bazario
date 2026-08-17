import { VendorProductForm } from '@/components/VendorProductForm';

export default function NewVendorProductPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Add a Product</h1>
      <VendorProductForm mode="create" />
    </div>
  );
}
