export default function PoolBookingPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Pool Booking Management</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Pool Reservations</h2>
        <p className="text-gray-600">Manage pool bookings and availability.</p>
        <div className="mt-4 inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
          Addon Feature
        </div>
      </div>
    </div>
  );
}
