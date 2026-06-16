export default function Header({ streak, dateKey }: { streak: number; dateKey: string }) {
  return (
    <header className="appbar">
      <div className="appbar__brand">
        <span className="appbar__logo">🧠</span>
        <div>
          <h1>MLordle</h1>
          <p className="appbar__sub">The daily ML-lifecycle puzzle</p>
        </div>
      </div>
      <div className="appbar__meta">
        <span className="appbar__date">{dateKey}</span>
        <span className="appbar__streak">🔥 {streak}</span>
      </div>
    </header>
  );
}
