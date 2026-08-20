export function Field({ id, icon: Icon, label, error, right, children }) {
  return (
    <div>
      <label htmlFor={id} style={{ display: "block", fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {Icon && <Icon size={17} style={{ position: "absolute", left: 14, color: error ? "var(--red)" : "var(--text2)", pointerEvents: "none" }} />}
        {children}
        {right}
      </div>
      {error && <p style={{ fontSize: 12, color: "var(--red)", marginTop: 5 }}>{error}</p>}
    </div>
  );
}

export const inputStyle = (hasIcon, error) => ({
  width: "100%", height: 52, padding: `0 14px 0 ${hasIcon ? 42 : 14}px`, borderRadius: 9,
  background: "var(--surface2)", border: `1px solid ${error ? "var(--red)" : "var(--border)"}`,
  color: "var(--text)", fontSize: 14, outline: "none", transition: "border-color .15s, box-shadow .15s",
  boxSizing: "border-box",
});
