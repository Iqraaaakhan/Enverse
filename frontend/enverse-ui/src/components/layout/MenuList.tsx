type MenuListProps = {
  active: string
  onChange: (value: string) => void
  mobile?: boolean
}

function MenuList({ active, onChange, mobile = false }: MenuListProps) {
  const base =
    "block w-full text-left px-3 py-2 rounded-lg font-medium transition"

  const activeStyle = "bg-blue-600 text-white"
  const inactiveStyle = "text-gray-700 hover:bg-gray-100"

  const item = (label: string) =>
    `${base} ${active === label ? activeStyle : inactiveStyle}`

  return (
    <ul className={mobile ? "space-y-4" : "space-y-2"}>
      <li>
        <button className={item("dashboard")} onClick={() => onChange("dashboard")}>
          Dashboard
        </button>
      </li>
      <li>
        <button className={item("summary")} onClick={() => onChange("summary")}>
          Energy Summary
        </button>
      </li>
      <li>
        <button className={item("anomalies")} onClick={() => onChange("anomalies")}>
          Anomalies
        </button>
      </li>
      <li>
        <button className={item("prediction")} onClick={() => onChange("prediction")}>
          Prediction
        </button>
      </li>
    </ul>
  )
}

export default MenuList
