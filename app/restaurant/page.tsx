export default function RestaurantPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Restaurant Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">POS Invoice</h2>
          <p className="text-gray-600">Manage point of sale invoices and transactions.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Order Management</h2>
          <p className="text-gray-600">Track and manage restaurant orders.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Table Management</h2>
          <p className="text-gray-600">Organize restaurant tables and seating.</p>
        </div>
      </div>
    </div>
  );
}
