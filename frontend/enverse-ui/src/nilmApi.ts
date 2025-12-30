export async function fetchNilmExplanation() {
  const res = await fetch("http://127.0.0.1:8000/energy/explain")

  if (!res.ok) {
    throw new Error("Failed to fetch NILM explanation")
  }

  return res.json()
}
