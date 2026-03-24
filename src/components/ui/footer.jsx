export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t border-gray-200 bg-gray-50 py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
        <span className="font-medium">GKIN RWDH Dienst Dashboard</span>
        <span>© {year} — All rights reserved</span>
      </div>
    </footer>
  );
}
