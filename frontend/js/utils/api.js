export async function callBackend(endpoint, data = {}) {
  try {
    const response = await fetch(`http://localhost:8000/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Backend error:", error);
    return { error: "Could not connect to backend" };
  }
}
