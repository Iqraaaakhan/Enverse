
function EnergySummarySection({
  devices,
}: {
  devices: Record<string, number>
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h3 className="text-lg font-semibold">
        Energy Summary (Device-wise)
      </h3>

      {/* Desktop */}
      <div className="hidden md:block">
        <table className="w-full text-left">
          <tbody>
            {Object.entries(devices).map(([d, e]) => (
              <tr key={d} className="border-b last:border-none">
                <td className="py-2 font-medium">{d}</td>
                <td className="py-2 text-right">
                  {e.toFixed(3)} kWh
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        {Object.entries(devices).map(([d, e]) => (
          <div
            key={d}
            className="flex justify-between border rounded-lg px-4 py-3"
          >
            <span className="font-medium">{d}</span>
            <span>{e.toFixed(3)} kWh</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EnergySummarySection
