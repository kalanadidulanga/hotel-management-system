export default function TableSettingPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Table Setting</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Table Configuration</h2>
        <p className="text-gray-600">Configure table settings and layout.</p>
        <div className="mt-4 space-y-4">
          <div className="border p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Table Layout</h3>
            <p className="text-sm text-gray-600">Adjust table positioning and room layout</p>
          </div>
          <div className="border p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Seating Configuration</h3>
            <p className="text-sm text-gray-600">Set default seating capacity for new tables</p>
          </div>
          <div className="border p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Table Categories</h3>
            <p className="text-sm text-gray-600">Define table types and categories</p>
          </div>
        </div>
      </div>
    </div>
  );
}
