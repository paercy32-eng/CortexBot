export const StatCard = ({ value, label }: { value: string | number, label: string }) => {
  return (
    <div className="stat-card" style={{ background: '#121c2d', border: '1px solid rgba(0,191,255,0.2)', borderRadius: '12px', overflow: 'hidden', textAlign: 'center' }}>
      <div className="value" style={{ padding: '20px 10px', fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'Playfair Display, serif' }}>{value}</div>
      <div className="label" style={{ background: '#00bfff', color: '#000', padding: '8px', fontSize: '0.8rem', fontWeight: '600' }}>{label}</div>
    </div>
  );
};
