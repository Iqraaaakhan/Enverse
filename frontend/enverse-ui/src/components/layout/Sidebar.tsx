import MenuList from "./MenuList"

type SidebarProps = {
  active: string
  onChange: (value: string) => void
  menuOpen: boolean
  onClose: () => void
}

function Sidebar({ active, onChange, menuOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* ---------------- Mobile Overlay ---------------- */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          <aside className="relative w-52 lg:w-56 h-full bg-white p-6 shadow-lg">
            <h2 className="text-sm text-gray-400 mb-4">MENU</h2>
            <MenuList
              active={active}
              onChange={(v: string) => {
                onChange(v)
                onClose()
              }}
              mobile
            />
          </aside>
        </div>
      )}

      {/* ---------------- Desktop Sidebar ---------------- */}
      <aside className="hidden md:block w-52 lg:w-56 bg-white p-6 border-r min-h-screen">
        <h2 className="text-sm text-gray-400 mb-4">MENU</h2>
        <MenuList active={active} onChange={onChange} />
      </aside>
    </>
  )
}

export default Sidebar
