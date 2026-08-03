import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, Award, Calendar, User, ExternalLink, Download, ChevronRight } from "lucide-react";
import { supabase } from "../src/lib/supabase";
import { PageScaffold, SurfacePanel } from "../components/PageScaffold";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type CertificationTemplate = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  logo_url: string;
  remarks: string;
  invert_logo?: boolean;
};

type Certification = {
  id: string;
  certification_id: string;
  template_id: string;
  person_name: string;
  issued_at: string;
  template: CertificationTemplate;
};

const Certifications: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchMode, setSearchMode] = useState<'id' | 'name'>('id');
  const [certId, setCertId] = useState(searchParams.get('id') || '');
  const [nameQuery, setNameQuery] = useState('');
  const [cert, setCert] = useState<Certification | null>(null);
  const [results, setResults] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [logoFinalUrl, setLogoFinalUrl] = useState<string | null>(null);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cert?.template?.logo_url) { setLogoFinalUrl(null); return; }
    if (!cert.template.invert_logo) { setLogoFinalUrl(cert.template.logo_url); return; }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < d.data.length; i += 4) {
        d.data[i] = 255 - d.data[i];
        d.data[i + 1] = 255 - d.data[i + 1];
        d.data[i + 2] = 255 - d.data[i + 2];
      }
      ctx.putImageData(d, 0, 0);
      if (!cancelled) setLogoFinalUrl(c.toDataURL('image/png'));
    };
    img.onerror = () => { if (!cancelled) setLogoFinalUrl(cert.template.logo_url); };
    img.src = cert.template.logo_url;
    return () => { cancelled = true; };
  }, [cert?.template?.logo_url, cert?.template?.invert_logo]);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setCertId(id);
      setSearchMode('id');
      searchCert(id);
    }
  }, []);

  const searchCert = async (id: string) => {
    if (!id.trim() || id.length !== 8) { setError('Please enter a valid 8-digit certification ID.'); setCert(null); return; }
    setLoading(true);
    setError('');
    setCert(null);
    setResults([]);
    try {
      const { data, error: err } = await supabase
        .from('certifications')
        .select('id, certification_id, template_id, person_name, issued_at, template:template_id(*)')
        .eq('certification_id', id)
        .maybeSingle();
      if (err || !data) { setError('No certification found with that ID.'); return; }
      setCert(data as unknown as Certification);
      setSearchParams({ id }, { replace: true });
    } catch { setError('Search failed. Please try again.'); } finally { setLoading(false); }
  };

  const searchByName = async (query: string) => {
    const q = query.trim();
    if (!q) { setError('Enter a name to search.'); setCert(null); setResults([]); return; }
    setLoading(true);
    setError('');
    setCert(null);
    setResults([]);
    try {
      const { data, error: err } = await supabase
        .from('certifications')
        .select('id, certification_id, template_id, person_name, issued_at, template:template_id(*)')
        .ilike('person_name', `%${q}%`)
        .order('issued_at', { ascending: false })
        .limit(50);
      if (err || !data || data.length === 0) { setError('No certifications found with that name.'); return; }
      setResults(data as unknown as Certification[]);
      setSearchParams({}, { replace: true });
    } catch { setError('Search failed. Please try again.'); } finally { setLoading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMode === 'id') searchCert(certId);
    else searchByName(nameQuery);
  };

  const clearAll = () => {
    setCertId('');
    setNameQuery('');
    setCert(null);
    setResults([]);
    setError('');
    setSearchParams({}, { replace: true });
  };

  const generatePDF = async () => {
    if (!certRef.current || !cert) return;
    setPdfGenerating(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 4,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = 297;
      const pdfHeight = 210;
      const imgWidth = pdfWidth - 10;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;
      const yOffset = (pdfHeight - imgHeight) / 2;
      pdf.addImage(imgData, 'JPEG', 5, yOffset, imgWidth, imgHeight);
      pdf.save(`APRO-Certification-${cert.certification_id}.pdf`);
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <PageScaffold>
      <div className="mx-auto w-full max-w-[1880px] px-5 py-12 md:px-8 xl:px-12">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 mb-4">
            <Award size={28} className="text-violet-300" />
          </div>
          <h1 className="text-[clamp(2.4rem,4vw,4.4rem)] font-bold leading-[0.94] tracking-[-0.06em] text-white">
            Certification Lookup
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-300/76 max-w-xl mx-auto">
            Search by 8-digit certification ID to verify, or by name to find issued certifications.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="mx-auto max-w-lg mb-12">
          <div className="mb-5 flex justify-center">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
              <button type="button" onClick={() => { setSearchMode('id'); setError(''); }}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition ${searchMode === 'id' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                Certification ID
              </button>
              <button type="button" onClick={() => { setSearchMode('name'); setError(''); }}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition ${searchMode === 'name' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                Name
              </button>
            </div>
          </div>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            {searchMode === 'id' ? (
              <input
                value={certId}
                onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 8); setCertId(v); }}
                placeholder="Enter 8-digit certification ID"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-4 pl-12 pr-12 text-base text-white placeholder:text-slate-500 outline-none transition focus:border-violet-500/30"
                maxLength={8}
                inputMode="numeric"
              />
            ) : (
              <input
                value={nameQuery}
                onChange={e => setNameQuery(e.target.value)}
                placeholder="Enter person's name (e.g. John Doe)"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-4 pl-12 pr-12 text-base text-white placeholder:text-slate-500 outline-none transition focus:border-violet-500/30"
                maxLength={80}
              />
            )}
            {(searchMode === 'id' ? certId : nameQuery) && <button type="button" onClick={clearAll} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={18} /></button>}
          </div>
          <div className="flex justify-center pt-4">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-8 py-3.5 text-sm font-semibold text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.3),0_20px_34px_rgba(61,28,120,0.42)] transition hover:-translate-y-0.5">
              <Search size={16} /> {searchMode === 'id' ? 'Verify Certification' : 'Search Certifications'}
            </button>
          </div>
        </form>

        {/* Results */}
        {loading && <div className="text-center text-slate-400">Searching...</div>}
        {error && <div className="mx-auto max-w-lg rounded-2xl border border-red-400/20 bg-red-400/10 px-6 py-4 text-sm text-red-200 text-center">{error}</div>}

        {results.length > 0 && (
          <SurfacePanel className="mx-auto max-w-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white">{results.length} certification{results.length === 1 ? '' : 's'} found</h3>
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Click to view</span>
            </div>
            <div className="space-y-3">
              {results.map(r => (
                <button key={r.id} onClick={() => { setCert(r); setResults([]); }}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left transition hover:bg-white/[0.06] hover:border-violet-500/20 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-white">{r.person_name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{r.template?.title || 'Certification'} · {r.certification_id}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Issued {new Date(r.issued_at).toLocaleDateString()}</span>
                    <ChevronRight size={16} className="text-violet-400" />
                  </div>
                </button>
              ))}
            </div>
          </SurfacePanel>
        )}

        {cert && (
          <>
            {/* Screen display */}
            <SurfacePanel className="mx-auto max-w-2xl p-8 md:p-10">
              <div className="flex flex-col items-center text-center">
                {cert.template?.logo_url && (
                  <div className="mb-6">
                    <img src={cert.template.logo_url} alt="" className="h-20 w-20 object-contain rounded-xl" />
                  </div>
                )}
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-1.5 text-xs font-bold text-violet-300 mb-6">
                  <Award size={14} /> APRO CERTIFICATION
                </div>
                {cert.template?.remarks && (
                  <p className="text-sm text-slate-400 italic mb-4 max-w-md">{cert.template.remarks}</p>
                )}
                <h2 className="text-2xl font-bold text-white">{cert.template?.title || 'Certification'}</h2>
                <div className="mt-6 flex items-center gap-2 text-lg text-slate-300">
                  <User size={18} className="text-violet-400" />
                  <span className="font-semibold">{cert.person_name}</span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                  <Calendar size={14} />
                  {cert.template?.end_date
                    ? `${new Date(cert.template.start_date).toLocaleDateString()} — ${new Date(cert.template.end_date).toLocaleDateString()}`
                    : new Date(cert.template?.start_date || cert.issued_at).toLocaleDateString()}
                </div>
                <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Certification ID</div>
                  <div className="mt-1 text-lg font-mono font-bold text-white tracking-widest">{cert.certification_id}</div>
                </div>
                <p className="mt-4 text-xs text-slate-500">Issued {new Date(cert.issued_at).toLocaleDateString()}</p>
                <button onClick={generatePDF} disabled={pdfGenerating}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-xs font-semibold text-slate-300 hover:bg-white/[0.06] transition">
                  <Download size={16} /> {pdfGenerating ? 'Generating PDF...' : 'Download PDF'}
                </button>
              </div>
              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 text-center mb-3">Share this certification</p>
                <div className="flex items-center gap-2 justify-center">
                  <input readOnly value={`${window.location.origin}/certifications?id=${cert.certification_id}`}
                    className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 text-center outline-none" />
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/certifications?id=${cert.certification_id}`); }}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] transition">
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </SurfacePanel>

            {/* Hidden certificate design for PDF capture */}
            <div className="fixed -left-[9999px] top-0">
              <div ref={certRef} style={{
                width: '1050px', padding: '50px 60px', background: '#ffffff',
                fontFamily: 'Georgia, "Palatino Linotype", "Book Antiqua", serif',
                position: 'relative', overflow: 'hidden', color: '#1e1b4b',
              }}>
                {/* Outer decorative border */}
                <div style={{
                  position: 'absolute', inset: '16px',
                  border: '3px solid #1e1b4b',
                  pointerEvents: 'none',
                }} />
                {/* Inner decorative border */}
                <div style={{
                  position: 'absolute', inset: '24px',
                  border: '1.5px solid #c7d2fe',
                  pointerEvents: 'none',
                }} />
                {/* Corner ornaments */}
                {[
                  { top: '24px', left: '24px', borderTop: '3px solid #6d28d9', borderLeft: '3px solid #6d28d9', width: '40px', height: '40px' },
                  { top: '24px', right: '24px', borderTop: '3px solid #6d28d9', borderRight: '3px solid #6d28d9', width: '40px', height: '40px' },
                  { bottom: '24px', left: '24px', borderBottom: '3px solid #6d28d9', borderLeft: '3px solid #6d28d9', width: '40px', height: '40px' },
                  { bottom: '24px', right: '24px', borderBottom: '3px solid #6d28d9', borderRight: '3px solid #6d28d9', width: '40px', height: '40px' },
                ].map((corner, i) => (
                  <div key={i} style={{ position: 'absolute', ...corner, pointerEvents: 'none' }} />
                ))}

                {/* Gold decorative line at top */}
                <div style={{
                  height: '3px', background: 'linear-gradient(90deg, transparent, #b8860b 20%, #b8860b 80%, transparent)',
                  margin: '0 0 40px 0',
                }} />

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  {cert.template?.logo_url ? (
                    <img src={logoFinalUrl || cert.template.logo_url} alt="" style={{ height: '110px', width: 'auto', objectFit: 'contain', display: 'inline-block' }} />
                  ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', background: '#1e1b4b', borderRadius: '50%' }}>
                      <span style={{ color: '#fff', fontSize: '40px', fontWeight: 'bold', fontFamily: 'Georgia, serif' }}>A</span>
                    </div>
                  )}
                </div>

                {/* APRO Header - elegant style */}
                <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '26px', letterSpacing: '10px', color: '#b8860b',
                    fontWeight: 700, fontFamily: 'Georgia, "Palatino Linotype", serif',
                  }}>APRO</span>
                </div>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <span style={{
                    fontSize: '10px', letterSpacing: '4px', color: '#64748b',
                    textTransform: 'uppercase',
                  }}>Aerospace · Propulsion · Rocketry · Operations</span>
                </div>

                {/* Subtle divider */}
                <div style={{
                  width: '200px', height: '1px', background: '#c7d2fe',
                  margin: '0 auto 36px auto',
                }} />

                {/* hereby certifies */}
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '15px', color: '#64748b', fontStyle: 'italic' }}>hereby certifies</span>
                </div>

                {/* Person Name */}
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '46px', fontWeight: 'bold', color: '#1e1b4b',
                    fontFamily: 'Georgia, "Palatino Linotype", serif',
                  }}>{cert.person_name}</span>
                </div>

                {/* Remarks (between name and title) */}
                {cert.template?.remarks && (
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#6d28d9', fontStyle: 'italic' }}>{cert.template.remarks}</span>
                  </div>
                )}

                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <span style={{
                    fontSize: '30px', fontWeight: 'bold', color: '#6d28d9',
                    fontFamily: 'Georgia, "Palatino Linotype", serif',
                  }}>{cert.template?.title || 'Certificate of Achievement'}</span>
                </div>

                {/* Date range */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                  <span style={{ fontSize: '13px', color: '#475569', fontStyle: 'italic' }}>
                    {cert.template?.end_date
                      ? `${new Date(cert.template.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} — ${new Date(cert.template.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                      : new Date(cert.template?.start_date || cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                {/* Bottom gold line */}
                <div style={{
                  height: '2px', background: 'linear-gradient(90deg, transparent, #c7d2fe 20%, #c7d2fe 80%, transparent)',
                  margin: '0 0 24px 0',
                }} />

                {/* Certification ID */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '8px', letterSpacing: '2px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Certification ID</div>
                  <div style={{ fontSize: '15px', fontFamily: 'monospace', color: '#1e1b4b', fontWeight: 'bold', letterSpacing: '3px' }}>{cert.certification_id}</div>
                </div>

                {/* Bottom decorative gold line */}
                <div style={{
                  height: '3px', background: 'linear-gradient(90deg, transparent, #b8860b 20%, #b8860b 80%, transparent)',
                  margin: '20px 0 0 0',
                }} />
              </div>
            </div>
          </>
        )}
      </div>
    </PageScaffold>
  );
};

export default Certifications;
