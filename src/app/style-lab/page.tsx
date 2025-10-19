"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type CardPreset =
  | "Surface Background"
  | "Primary Card (.card-depth)"
  | "Control Card (.card-control)"
  | "Board Card (.card-board)"
  | "Subtle Card (.card-depth-subtle)"
  | "Alt Card (.card-alt)"
  | "Modal Card (.card-modal)"

const CARD_PRESETS: Array<{ name: CardPreset; description: string }> = [
  {
    name: "Surface Background",
    description: "Wrapper background – replicates dashboard blue gradient/container fill.",
  },
  {
    name: "Primary Card (.card-depth)",
    description: "Default dashboard card."
  },
  {
    name: "Control Card (.card-control)",
    description: "The lighter control pill used for toggles, filters, etc."
  },
  {
    name: "Board Card (.card-board)",
    description: "Heavier analytics/workboard surfaces."
  },
  {
    name: "Subtle Card (.card-depth-subtle)",
    description: "Low-emphasis container (nested sections)."
  },
  {
    name: "Alt Card (.card-alt)",
    description: "Alternative dark-surface card (e.g., map overlays)."
  },
  {
    name: "Modal Card (.card-modal)",
    description: "Prominent modal/dialog surface."
  }
]

const DEFAULT_COLORS: Record<CardPreset, string> = {
  "Surface Background": "var(--page-bg)",
  "Primary Card (.card-depth)": "var(--dashboard-card-bg)",
  "Control Card (.card-control)": "var(--dashboard-card-bg)",
  "Board Card (.card-board)": "var(--dashboard-card-bg)",
  "Subtle Card (.card-depth-subtle)": "var(--alt-card-bg)",
  "Alt Card (.card-alt)": "var(--alt-card-bg)",
  "Modal Card (.card-modal)": "var(--modal-card-bg)",
}

const DEFAULT_SHADOWS: Record<CardPreset, string> = {
  "Surface Background": "none",
  "Primary Card (.card-depth)": "var(--shadow-level-1)",
  "Control Card (.card-control)": "var(--shadow-level-1)",
  "Board Card (.card-board)": "var(--shadow-level-2)",
  "Subtle Card (.card-depth-subtle)": "var(--shadow-level-1)",
  "Alt Card (.card-alt)": "var(--shadow-level-1)",
  "Modal Card (.card-modal)": "var(--shadow-level-3)",
}

const LABEL_CLASS = "text-xs font-semibold uppercase tracking-wide text-slate-500"

export default function StyleLabPage() {
  const [colors, setColors] = useState<Record<CardPreset, string>>(DEFAULT_COLORS)
  const [shadows, setShadows] = useState<Record<CardPreset, string>>(DEFAULT_SHADOWS)
  const [surfaceGradient, setSurfaceGradient] = useState("linear-gradient(180deg,#DBEAFE 0%,#BFDBFE 100%)")
  const [textColor, setTextColor] = useState("#111827")

  const previewWrapperStyle = useMemo(() => {
    return {
      background: surfaceGradient,
      color: textColor,
    } as React.CSSProperties
  }, [surfaceGradient, textColor])

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-6 py-12 md:flex-row">
        <aside className="w-full space-y-6 rounded-2xl bg-white p-6 shadow-sm md:w-80">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Style Playground</h2>
            <p className="text-sm text-slate-500">
              Adjust colours and shadows to audition new theming before touching globals.
            </p>
          </div>

          <section className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Surface Gradient</label>
              <textarea
                value={surfaceGradient}
                onChange={(event) => setSurfaceGradient(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={3}
              />
              <p className="mt-1 text-xs text-slate-400">
                Any valid CSS gradient or colour (e.g. <code>linear-gradient(...)</code> or <code>#DBEAFE</code>).
              </p>
            </div>

            <div>
              <label className={LABEL_CLASS}>Base Text Colour</label>
              <input
                type="color"
                value={textColor}
                onChange={(event) => setTextColor(event.target.value)}
                className="mt-2 h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white"
              />
              <p className="mt-1 text-xs text-slate-400">Used for labels inside the preview wrapper.</p>
            </div>
          </section>

          <section className="space-y-6">
            {CARD_PRESETS.map(({ name }) => (
              <div key={name} className="space-y-3 border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{name}</h3>
                  <p className="text-xs text-slate-500">Colour + shadow overrides for this preset.</p>
                </div>

                <div>
                  <label className="text-xs text-slate-500">Background</label>
                  <input
                    type="color"
                    value={colors[name]}
                    onChange={(event) =>
                      setColors((prev) => ({ ...prev, [name]: event.target.value }))
                    }
                    className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">Shadow</label>
                  <textarea
                    value={shadows[name]}
                    onChange={(event) =>
                      setShadows((prev) => ({ ...prev, [name]: event.target.value }))
                    }
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            ))}
          </section>
        </aside>

        <main className="flex-1 space-y-12">
          <section
            className="relative overflow-hidden rounded-3xl border border-slate-200 shadow-lg"
            style={previewWrapperStyle}
          >
            <div className="absolute inset-0 opacity-10" />
            <div className="relative flex flex-col gap-8 p-8">
              <header>
                <h2 className="text-2xl font-bold">Dashboard Surface Preview</h2>
                <p className="text-sm opacity-80">
                  Snapshot of key card types stacked as they usually appear. Tweak values on the left to
                  visualise new colour/shadow combos.
                </p>
              </header>

              {/* Top metrics row */}
              <div className="grid gap-4 md:grid-cols-3">
                {renderCard("Primary Card (.card-depth)", "Total Incidents", "42", colors, shadows)}
                {renderCard("Primary Card (.card-depth)", "Open Incidents", "11", colors, shadows)}
                {renderCard("Primary Card (.card-depth)", "Average Response", "08m 14s", colors, shadows)}
              </div>

              {/* Control bar */}
              <div className="flex flex-wrap items-center gap-3 rounded-2xl p-4"
                   style={{ background: colors["Control Card (.card-control)"], boxShadow: shadows["Control Card (.card-control)"] }}>
                <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Controls (.card-control)</span>
                <button className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-sm">
                  Active Filter
                </button>
                <button className="rounded-lg border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
                  Reset
                </button>
              </div>

              {/* Content columns */}
              <div className="grid gap-8 lg:grid-cols-2">
                <Card
                  className="h-full"
                  style={{
                    background: colors["Board Card (.card-board)"],
                    boxShadow: shadows["Board Card (.card-board)"],
                  }}
                >
                  <CardHeader>
                    <CardTitle>Incident Overview (.card-board)</CardTitle>
                    <CardDescription>Higher depth board card example.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MetricRow label="High Priority" value="5" />
                    <MetricRow label="Medium Priority" value="18" />
                    <MetricRow label="Low Priority" value="19" />
                  </CardContent>
                </Card>

                <Card
                  className="h-full"
                  style={{
                    background: colors["Subtle Card (.card-depth-subtle)"],
                    boxShadow: shadows["Subtle Card (.card-depth-subtle)"],
                  }}
                >
                  <CardHeader>
                    <CardTitle>Subsection (.card-depth-subtle)</CardTitle>
                    <CardDescription>Low emphasis container for nested data.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-xl border border-dashed border-slate-300 p-3 text-xs opacity-70">
                      This is where charts or supplementary widgets often sit.
                    </div>
                    <div
                      className="rounded-xl p-3 text-xs"
                      style={{
                        background: colors["Alt Card (.card-alt)"],
                        boxShadow: shadows["Alt Card (.card-alt)"],
                      }}
                    >
                      Alt Card (.card-alt) preview inside subtle container.
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Modal preview */}
              <div className="grid gap-4 rounded-3xl border border-white/60 bg-white/30 p-6 backdrop-blur">
                <span className="text-xs font-semibold uppercase tracking-wide opacity-60">Modal Preview (.card-modal)</span>
                <Card
                  style={{
                    background: colors["Modal Card (.card-modal)"],
                    boxShadow: shadows["Modal Card (.card-modal)"],
                  }}
                >
                  <CardHeader>
                    <CardTitle>Broadcast Alert</CardTitle>
                    <CardDescription>
                      Example of the higher-elevation modal surface.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm opacity-80">
                    <p>Personnel required at Gate A due to surge above safe threshold.</p>
                    <p className="text-xs uppercase tracking-widest opacity-60">Escalation Path: Duty Manager → Security Chief</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">How to use this page</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
              <li>Modify colours/shadows on the left until you like the appearance.</li>
              <li>Copy the resulting values into <code>globals.css</code> (card classes) or the Tailwind config.</li>
              <li>Use browser dev tools to inspect each card for precise CSS while testing.</li>
            </ol>
          </section>
        </main>
      </div>
    </div>
  )
}

function renderCard(
  preset: CardPreset,
  title: string,
  value: string,
  colors: Record<CardPreset, string>,
  shadows: Record<CardPreset, string>
) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/60 p-4 shadow-sm transition",
        "text-sm"
      )}
      style={{
        background: colors[preset],
        boxShadow: shadows[preset],
      }}
    >
      <span className="text-xs font-semibold uppercase tracking-wide opacity-60">{preset}</span>
      <h4 className="mt-3 text-base font-semibold">{title}</h4>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/40 px-3 py-2 text-sm shadow-inner shadow-white/30 backdrop-blur">
      <span className="font-medium">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
