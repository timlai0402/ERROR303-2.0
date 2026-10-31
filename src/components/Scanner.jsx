import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CameraOff, Keyboard } from 'lucide-react';
import { Modal } from './ui.jsx';
import { useStore } from '../lib/store.jsx';

/** Camera QR / barcode scanner with manual-entry fallback. Calls onResult(code). */
export default function Scanner({ onResult, onClose, title = 'Scan QR or barcode' }) {
  const { products } = useStore();
  const [error, setError] = useState(null);
  const [manual, setManual] = useState('');
  const scannerRef = useRef(null);
  const doneRef = useRef(false);
  const cbRef = useRef(onResult);
  cbRef.current = onResult;

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode('qr-reader', { verbose: false });
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: (w, h) => { const s = Math.min(w, h) * 0.7; return { width: s, height: s * 0.75 }; } },
        (text) => {
          if (doneRef.current) return;
          doneRef.current = true;
          if (navigator.vibrate) navigator.vibrate(60);
          cbRef.current(text.trim());
        },
        () => {}
      )
      .catch((e) => {
        if (!cancelled) setError(String(e?.message || e || 'Camera not available'));
      });
    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s && s.isScanning) s.stop().then(() => s.clear()).catch(() => {});
    };
  }, []);

  const demoCodes = products.slice(0, 4);

  return (
    <Modal title={title} onClose={onClose}>
      {error ? (
        <div className="empty" style={{ background: 'var(--surface-2)', borderRadius: 12 }}>
          <CameraOff size={28} />
          <div style={{ fontWeight: 600, color: 'var(--text-2)' }}>Camera not available</div>
          <div className="small">Allow camera access, or type the code below.</div>
        </div>
      ) : (
        <div id="qr-reader" />
      )}
      <form
        className="mt-16"
        onSubmit={(e) => { e.preventDefault(); if (manual.trim()) onResult(manual.trim()); }}
      >
        <div className="field" style={{ marginBottom: 8 }}>
          <label><Keyboard size={13} style={{ verticalAlign: -2 }} /> Or enter code manually</label>
          <div className="input-row">
            <input className="input" placeholder="e.g. SW-1001" value={manual} onChange={(e) => setManual(e.target.value)} autoFocus={!!error} />
            <button className="btn primary" type="submit">Use code</button>
          </div>
        </div>
      </form>
      <div className="small muted">Demo codes:</div>
      <div className="flex gap-8 wrap mt-8">
        {demoCodes.map((p) => (
          <button key={p.id} className="btn sm" onClick={() => onResult(p.code)}>{p.code}</button>
        ))}
      </div>
    </Modal>
  );
}
