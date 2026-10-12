"use client";
// ===== الإعدادات =====
import { useState } from "react";
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  User,
  Gauge,
  MapPin,
  Trash2,
  ShieldCheck,
  Info,
  DownloadCloud,
  CloudCheck,
  WifiOff,
} from "lucide-react";
import { PageHeader, Modal, Card } from "@/components/ui";
import { RECITERS } from "@/lib/data/audio";
import { CITIES, CALC_METHODS } from "@/lib/services/prayer";
import { usePrefs } from "@/lib/services/prefsStore";
import {
  useDownloads,
  formatBytes,
} from "@/lib/services/offlineAudio";
import { toast } from "@/lib/services/toastStore";
import { arDigits, cn } from "@/lib/utils";
import { SURAHS } from "@/lib/data/surahs";
import { getReciter } from "@/lib/data/audio";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-5 border-b border-[var(--line)] last:border-0">
      <div className="flex-1">
        <p className="font-bold">{label}</p>
        {hint && <p className="text-sm text-[var(--muted)] mt-0.5">{hint}</p>}
      </div>
      <div className="w-full sm:w-72">{children}</div>
    </div>
  );
}

const selectCls =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--bg-2)] px-4 py-3 font-bold outline-none focus:border-[var(--ring)]";

function DownloadsManager() {
  const records = useDownloads((s) => s.records);
  const remove = useDownloads((s) => s.remove);
  const clearAll = useDownloads((s) => s.clearAll);
  const autoCache = usePrefs((s) => s.autoCacheAudio);
  const setAutoCache = usePrefs((s) => s.setAutoCacheAudio);

  const done = Object.values(records)
    .filter((r) => r.status === "done")
    .sort((a, b) => a.surah - b.surah || b.downloadedAt - a.downloadedAt);
  const busy = Object.values(records).filter((r) => r.status === "downloading");
  const totalSize = done.reduce((s, r) => s + r.size, 0);

  return (
    <Card className="p-6 mb-6">
      <h3 className="flex items-center gap-2 font-black text-lg mb-1">
        <DownloadCloud size={19} className="text-[var(--emerald)]" />
        الاستماع دون إنترنت
      </h3>
      <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
        السور المحفوظة (بالقارئ المحدد لكلٍّ منها) تُشغَّل فوراً حتى بلا اتصال.
      </p>

      {/* مفتاح التخزين التلقائي */}
      <button
        onClick={() => setAutoCache(!autoCache)}
        className="w-full flex items-center gap-4 rounded-2xl border border-[var(--line)] px-4 py-3.5 mb-5 text-start hover:border-[var(--line-strong)] transition-colors"
        aria-pressed={autoCache}
      >
        <span
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors shrink-0",
            autoCache ? "bg-[var(--emerald)]" : "bg-[color-mix(in_srgb,var(--muted)_35%,transparent)]"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
              autoCache ? "start-[22px]" : "start-0.5"
            )}
          />
        </span>
        <span className="flex-1">
          <span className="block font-bold">حفظ تلقائي أثناء الاستماع</span>
          <span className="block text-xs text-[var(--muted)] mt-0.5">
            أي سورة تسمعها تُحفَّظ في الخلفية لتسمعها لاحقاً دون إنترنت
          </span>
        </span>
      </button>

      {busy.length > 0 && (
        <div className="mb-4 space-y-2">
          {busy.map((r) => (
            <div key={r.key} className="rounded-2xl border border-[var(--line)] p-3.5">
              <div className="flex justify-between text-sm font-bold">
                <span>سورة {SURAHS[r.surah - 1]?.name}</span>
                <span className="text-[var(--gold)]">{arDigits(Math.round(r.progress * 100))}٪</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-[color-mix(in_srgb,var(--muted)_18%,transparent)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-[var(--gold)] to-[var(--emerald)] transition-all duration-300"
                  style={{ width: `${r.progress * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {done.length === 0 && busy.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-[var(--muted)] bg-[var(--surface-2)] rounded-2xl p-4">
          <WifiOff size={16} />
          لا توجد تلاوات محفوظة بعد — نزّلها من صفحة السور أو المشغّل.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="font-bold">
              {arDigits(done.length)} سورة محفوظة — {formatBytes(totalSize)}
            </span>
            {done.length > 0 && (
              <button
                onClick={() => {
                  void clearAll().then(() => toast("تم مسح كل التنزيلات", "ok"));
                }}
                className="text-xs font-bold text-[var(--danger)]"
              >
                مسح الكل
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pe-1">
            {done.map((r) => {
              const surah = SURAHS[r.surah - 1];
              return (
                <div
                  key={r.key}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-3"
                >
                  <CloudCheck size={18} className="text-[var(--ok)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">سورة {surah?.name ?? r.surah}</p>
                    <p className="text-xs text-[var(--muted)] truncate">
                      {getReciter(r.reciterId).name} • {formatBytes(r.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => void remove(r.surah, r.reciterId)}
                    className="icon-btn !w-9 !h-9 !text-[var(--danger)]"
                    aria-label={`حذف تنزيل سورة ${surah?.name ?? ""}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

export default function SettingsPage() {
  const prefs = usePrefs();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="max-w-3xl">
      <PageHeader title="الإعدادات" subtitle="خصّص تجربتك كما يناسبك" icon={<SettingsIcon size={26} />} />

      <Card className="px-6 mb-6">
        <Row label="المظهر" hint="ليلي عميق أو نهاري عاجي">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => prefs.setTheme("dark")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border py-3 font-bold transition-all",
                prefs.theme === "dark"
                  ? "border-[var(--gold)] text-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_10%,transparent)]"
                  : "border-[var(--line)] text-[var(--muted)]"
              )}
            >
              <Moon size={17} /> ليلي
            </button>
            <button
              onClick={() => prefs.setTheme("light")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border py-3 font-bold transition-all",
                prefs.theme === "light"
                  ? "border-[var(--gold)] text-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_10%,transparent)]"
                  : "border-[var(--line)] text-[var(--muted)]"
              )}
            >
              <Sun size={17} /> نهاري
            </button>
          </div>
        </Row>

        <Row label="حجم خط المصحف" hint={`المقياس الحالي: ${arDigits(Math.round(prefs.fontScale * 100))}٪`}>
          <input
            type="range"
            min={85}
            max={140}
            step={5}
            value={Math.round(prefs.fontScale * 100)}
            onChange={(e) => prefs.setFontScale(Number(e.target.value) / 100)}
            className="w-full"
            aria-label="حجم خط المصحف"
          />
        </Row>

        <Row label="القارئ المفضل" hint="يُستخدم في كل التلاوات">
          <div className="relative">
            <User size={16} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-[var(--muted)]" />
            <select
              value={prefs.reciterId}
              onChange={(e) => prefs.setReciter(e.target.value)}
              className={cn(selectCls, "ps-10")}
              aria-label="اختيار القارئ"
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </Row>

        <Row label="سرعة التلاوة الافتراضية" hint=" تُطبق على أي تشغيل جديد">
          <div className="relative">
            <Gauge size={16} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-[var(--muted)]" />
            <select
              value={prefs.playbackRate}
              onChange={(e) => prefs.setPlaybackRate(Number(e.target.value))}
              className={cn(selectCls, "ps-10")}
              aria-label="سرعة التشغيل"
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {arDigits(s)}×
                </option>
              ))}
            </select>
          </div>
        </Row>

        <Row label="مدينتك" hint="لحساب مواقيت الصلاة والقبلة">
          <div className="relative">
            <MapPin size={16} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-[var(--muted)]" />
            <select
              value={prefs.cityId}
              onChange={(e) => prefs.setCity(e.target.value)}
              className={cn(selectCls, "ps-10")}
              aria-label="اختيار المدينة"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.country}
                </option>
              ))}
            </select>
          </div>
        </Row>

        <Row label="طريقة حساب المواقيت" hint="الهيئة الفلكية المعتمدة">
          <select
            value={prefs.calcMethod}
            onChange={(e) => prefs.setCalcMethod(e.target.value)}
            className={selectCls}
            aria-label="طريقة حساب المواقيت"
          >
            {CALC_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Row>
      </Card>

      {/* التنزيلات دون اتصال */}
      <DownloadsManager />

      {/* مصادر المحتوى */}
      <Card className="p-6 mb-6">
        <h3 className="flex items-center gap-2 font-black text-lg mb-4">
          <ShieldCheck size={19} className="text-[var(--ok)]" />
          مصادر المحتوى والتوثيق
        </h3>
        <ul className="space-y-3 text-sm text-[var(--muted)] leading-relaxed">
          <li>
            <b className="text-[var(--ink)]">نص القرآن:</b> AlQuran Cloud — رواية حفص بالرسم العثماني، يُحفظ محلياً للقراءة دون اتصال بعد أول عرض.
          </li>
          <li>
            <b className="text-[var(--ink)]">الصوت:</b> شبكة Islamic Network CDN مع مصادر احتياطية موثقة (MP3Quran) — تم التحقق من كل الروابط.
          </li>
          <li>
            <b className="text-[var(--ink)]">الأحاديث:</b> ١٠٠ حديث منقولة عن الكتب المطبوعة المعتمدة (صحيح البخاري ومسلم، الترمذي، أبو داود، الأربعون النووية) بمخارجها، مع ملاحظة أن الترقيم قد يختلف يسيراً بين الطبعات.
          </li>
          <li>
            <b className="text-[var(--ink)]">الأذكار:</b> حصن المسلم وكتب الأذكار الموثقة، والأدعية القرآنية من نص المصحف.
          </li>
          <li>
            <b className="text-[var(--ink)]">المواقيت والقبلة:</b> حساب فلكي محلي كامل (مكتبة adhan) — لا بيانات عشوائية.
          </li>
          <li>
            <b className="text-[var(--ink)]">الإذاعة:</b> محطات بث موثقة من شبكة Qurango عبر HTTPS.
          </li>
        </ul>
      </Card>

      {/* البيانات */}
      <Card className="p-6">
        <h3 className="flex items-center gap-2 font-black text-lg mb-2">
          <Info size={19} className="text-[var(--gold)]" />
          بياناتك
        </h3>
        <p className="text-sm text-[var(--muted)] leading-relaxed mb-5">
          كل شيء (المواضع، المفضلات، العدّادات) يُحفظ على جهازك فقط — لا حسابات،
          لا تتبّع، لا خوادم خارجية لبياناتك.
        </p>
        <button onClick={() => setConfirmReset(true)} className="btn btn-ghost !border-[color-mix(in_srgb,var(--danger)_45%,transparent)] !text-[var(--danger)]">
          <Trash2 size={17} />
          مسح كل البيانات المحلية
        </button>
      </Card>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="تأكيد المسح">
        <p className="text-[var(--muted)] leading-relaxed">
          سيتم حذف جميع التفضيلات والمفضلات ومواضع القراءة وعدّادات الأذكار نهائياً.
          لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              prefs.resetAll();
              setConfirmReset(false);
              toast("تم مسح البيانات المحلية", "ok");
            }}
            className="btn flex-1 !bg-[var(--danger)] text-white py-3 rounded-xl font-bold"
          >
            نعم، امسح الكل
          </button>
          <button onClick={() => setConfirmReset(false)} className="btn btn-ghost flex-1">
            إلغاء
          </button>
        </div>
      </Modal>
    </div>
  );
}
