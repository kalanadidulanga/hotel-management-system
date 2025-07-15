export default function HomePage() {
  return (
    <section className="flex flex-col items-center justify-center h-full w-full text-center">
      <h1 className="text-3xl md:text-5xl font-bold mb-4">Welcome to the Hotel Management System</h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
        Use the sidebar to navigate through the system. This dashboard is fully responsive and ready for your hotel operations.
      </p>
    </section>
  );
}