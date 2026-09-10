export function AuthBrandPanel() {
  return (
    <div className="brand-panel relative hidden lg:flex lg:w-[42%] flex-col justify-between p-12 text-white overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full brand-lattice"
        viewBox="0 0 500 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <line x1="60" y1="120" x2="180" y2="70" />
        <line x1="180" y1="70" x2="290" y2="140" />
        <line x1="290" y1="140" x2="260" y2="260" />
        <line x1="260" y1="260" x2="130" y2="270" />
        <line x1="130" y1="270" x2="60" y2="120" />
        <line x1="290" y1="140" x2="420" y2="90" />
        <line x1="130" y1="270" x2="90" y2="400" />
        <line x1="260" y1="260" x2="330" y2="380" />
        <line x1="330" y1="380" x2="300" y2="500" />
        <line x1="90" y1="400" x2="160" y2="510" />
        <line x1="160" y1="510" x2="300" y2="500" />
        <line x1="160" y1="510" x2="130" y2="640" />
        <line x1="300" y1="500" x2="380" y2="610" />
        <line x1="130" y1="640" x2="240" y2="720" />
        <line x1="380" y1="610" x2="240" y2="720" />
        {[
          [60, 120], [180, 70], [290, 140], [260, 260], [130, 270],
          [420, 90], [90, 400], [330, 380], [300, 500], [160, 510],
          [130, 640], [380, 610], [240, 720]
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 5 : 3} />
        ))}
      </svg>

      <div className="relative">
        <p className="font-mono text-xs tracking-wide text-white/70">QbD Preformulation</p>
        <p className="font-display text-2xl mt-1 leading-tight">Research<br />Assistant</p>
      </div>

      <div className="relative space-y-4 max-w-sm">
        <p className="font-display text-3xl leading-snug">
          Dari struktur molekul hingga risk assessment, dalam satu alur kerja.
        </p>
        <p className="text-sm text-white/75 leading-relaxed">
          Susun profil fisikokimia, telusuri literatur lintas sumber, dan bangun
          QTPP–CQA–CMA yang tertelusuri ke bukti ilmiahnya — sebelum Anda masuk ke
          tahap formulasi.
        </p>
      </div>
    </div>
  );
}
