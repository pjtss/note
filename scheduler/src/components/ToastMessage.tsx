type Props = { message: string | null };

export function ToastMessage({ message }: Props) {
  if (!message) return null;
  return (
    <div className="position-fixed bottom-4 start-50 translate-middle-x px-4 py-3 rounded-pill shadow-lg d-flex align-items-center gap-2 border text-white animate-fade-in" style={{ zIndex: 10000, backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.15)', fontSize: '0.9rem', bottom: '30px' }}>
      <i className="bi bi-check-circle-fill text-success fs-5"></i>
      <span className="fw-medium">{message}</span>
    </div>
  );
}
