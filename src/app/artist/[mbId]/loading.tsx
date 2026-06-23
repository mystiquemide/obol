export default function Loading() {
  return (
    <div className="mobile-page" style={{ background: "#0F0F0F", minHeight: "100vh" }}>
      <section aria-busy="true" aria-label="Loading receipt" style={{ paddingTop: "160px", paddingBottom: "40px", paddingLeft: "120px", paddingRight: "120px" }}>
        <div className="skeleton" style={{ width: "120px", height: "11px" }} />
        <div className="skeleton" style={{ width: "46%", height: "44px", marginTop: "20px" }} />
        <div className="skeleton" style={{ width: "30%", height: "14px", marginTop: "16px" }} />

        <div style={{ marginTop: "56px", display: "flex", gap: "48px" }}>
          <div className="skeleton" style={{ width: "140px", height: "40px" }} />
          <div className="skeleton" style={{ width: "140px", height: "40px" }} />
        </div>

        <div style={{ marginTop: "48px", display: "flex", flexDirection: "column", gap: "1px", background: "rgba(225,221,214,0.08)" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "32px", background: "#0F0F0F", padding: "20px 0" }}>
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: "38%", height: "18px" }} />
                <div className="skeleton" style={{ width: "22%", height: "12px", marginTop: "8px" }} />
              </div>
              <div className="skeleton" style={{ width: "64px", height: "14px" }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
