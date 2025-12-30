type MobileHeaderProps = {
  onMenu: () => void
}

function MobileHeader({ onMenu }: MobileHeaderProps) {
  return (
    <header className="md:hidden bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-20">
      <h1 className="font-semibold text-lg">Enverse</h1>

      <button
        onClick={onMenu}
        className="text-sm font-medium text-blue-600"
      >
        Menu
      </button>
    </header>
  )
}

export default MobileHeader
