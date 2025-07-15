export default function TableListPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Table List</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Restaurant Tables</h2>
        <p className="text-gray-600">View and manage all restaurant tables.</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border p-4 rounded-lg">
            <h3 className="font-semibold">Table 1</h3>
            <p className="text-sm text-gray-600">4 seats - Available</p>
          </div>
          <div className="border p-4 rounded-lg">
            <h3 className="font-semibold">Table 2</h3>
            <p className="text-sm text-gray-600">6 seats - Occupied</p>
          </div>
          <div className="border p-4 rounded-lg">
            <h3 className="font-semibold">Table 3</h3>
            <p className="text-sm text-gray-600">2 seats - Available</p>
          </div>
        </div>
      </div>
    </div>
  );
}
