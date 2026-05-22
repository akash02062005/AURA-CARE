import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, RefreshCcw, Activity, TrendingUp } from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { Line, Bar } from "react-chartjs-2";
import jsPDF from "jspdf";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

type Stats = {
  totalUsers: number;
  activeUsers: number;
  totalAssessments: number;
  avgPhqScore: number;
  avgGadScore: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
  totalBookings: number;
  completedBookings: number;
  mostCommonSeverity: string;
  crisisEscalations: number;
};

type Trends = {
  labels: string[];
  usageSeries: number[];
  moodSeriesPHQ: number[];
  moodSeriesGAD: number[];
};

type Predictions = {
  labels: string[];
  predicted: number[];
  model?: { slope: number; intercept: number };
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ✅ Safe gradient helper
const barGradient = (
  ctx: CanvasRenderingContext2D,
  area?: { top: number; bottom: number }
) => {
  if (!area) {
    return "rgba(59,130,246,0.6)"; // fallback solid color
  }
  const gradient = ctx.createLinearGradient(0, area.bottom, 0, area.top);
  gradient.addColorStop(0, "rgba(59,130,246,0.15)");
  gradient.addColorStop(1, "rgba(59,130,246,0.6)");
  return gradient;
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const { data: stats } = useQuery<Stats>({
    queryKey: ["admin", "stats"],
    queryFn: () => fetcher("/api/admin/stats"),
  });

  const { data: trends, refetch: refetchTrends } = useQuery<Trends>({
    queryKey: ["admin", "trends", range],
    queryFn: () => fetcher(`/api/admin/trends?range=${range}`),
  });

  const { data: preds } = useQuery<Predictions>({
    queryKey: ["admin", "predictions"],
    queryFn: () => fetcher(`/api/admin/predictions?horizon=7`),
  });

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: { display: true },
        title: { display: false },
        zoom: {
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" as const },
          pan: { enabled: true, mode: "x" as const },
          limits: { x: { minRange: 2 } },
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: "rgba(148,163,184,0.15)" } },
      },
    }),
    []
  );

  const usageData = useMemo(() => {
    if (!trends) return undefined;
    return {
      labels: trends.labels,
      datasets: [
        {
          type: "bar" as const,
          label: "Usage (msgs + bookings)",
          data: trends.usageSeries,
          backgroundColor: (ctx: any) =>
            barGradient(ctx.chart.ctx, ctx.chart.chartArea),
          borderRadius: 8,
        },
      ],
    };
  }, [trends]);

  const moodData = useMemo(() => {
    if (!trends) return undefined;
    return {
      labels: trends.labels,
      datasets: [
        {
          label: "Avg PHQ-9",
          data: trends.moodSeriesPHQ,
          borderWidth: 2,
          fill: true,
          tension: 0.3,
        },
        {
          label: "Avg GAD-7",
          data: trends.moodSeriesGAD,
          borderWidth: 2,
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [trends]);

  const predData = useMemo(() => {
    if (!preds) return undefined;
    return {
      labels: preds.labels,
      datasets: [
        {
          label: "Predicted GAD-7 (next 7 days)",
          data: preds.predicted,
          borderWidth: 2,
          fill: false,
          pointRadius: 3,
          tension: 0.2,
        },
      ],
    };
  }, [preds]);

  const resetZoomAll = () => {
    const canvases = Array.from(document.querySelectorAll("canvas"));
    canvases.forEach((c: any) => c?.chart?.resetZoom?.());
  };

  const downloadCSV = async () => {
    try {
      setExporting("csv");
      const payload = { stats, trends };
      const rows: string[] = [];
      rows.push("section,key,value");
      if (stats) {
        Object.entries(stats).forEach(([k, v]) =>
          rows.push(`stats,${k},${v}`)
        );
      }
      if (trends) {
        trends.labels.forEach((label, i) => {
          rows.push(`trends,usage_${label},${trends.usageSeries[i]}`);
          rows.push(`trends,phq_${label},${trends.moodSeriesPHQ[i]}`);
          rows.push(`trends,gad_${label},${trends.moodSeriesGAD[i]}`);
        });
      }
      const csv = rows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `admin-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: "Export complete", description: "CSV downloaded." });
    } catch (e: any) {
      toast({
        title: "CSV export failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const downloadPDF = async () => {
    try {
      setExporting("pdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      doc.setFontSize(18);
      doc.text("Admin Analytics Report", 40, 40);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);

      let y = 90;
      if (stats) {
        doc.setFontSize(14);
        doc.text("Overview", 40, y);
        y += 16;
        doc.setFontSize(12);
        for (const [k, v] of Object.entries(stats)) {
          doc.text(`${k}: ${v}`, 50, y);
          y += 14;
          if (y > 760) {
            doc.addPage();
            y = 40;
          }
        }
      }

      doc.addPage();
      doc.setFontSize(14);
      doc.text("Trends (last period)", 40, 40);

      const canvases = Array.from(
        document.querySelectorAll("canvas")
      ) as HTMLCanvasElement[];
      let yImg = 60;
      for (const canvas of canvases.slice(0, 3)) {
        const img = canvas.toDataURL("image/png", 0.92);
        const w = 515;
        const h = (canvas.height / canvas.width) * w;
        doc.addImage(img, "PNG", 40, yImg, w, h);
        yImg += h + 20;
        if (yImg > 760) {
          doc.addPage();
          yImg = 40;
        }
      }

      doc.save(`admin-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "Export complete", description: "PDF downloaded." });
    } catch (e: any) {
      toast({
        title: "PDF export failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            View anonymized analytics, usage and mood trends.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => {
              setRange(e.target.value as any);
              refetchTrends();
            }}
            className="px-3 py-2 border rounded-lg bg-background"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button onClick={resetZoomAll} variant="secondary" className="gap-2">
            <RefreshCcw className="w-4 h-4" /> Reset Zoom
          </Button>
          <Button onClick={downloadCSV} disabled={!!exporting} className="gap-2">
            {exporting === "csv" ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export CSV
          </Button>
          <Button onClick={downloadPDF} disabled={!!exporting} className="gap-2">
            {exporting === "pdf" ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Users</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {stats?.totalUsers ?? "—"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {stats?.activeUsers ?? "—"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Assessments</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {stats?.totalAssessments ?? "—"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Avg PHQ-9</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {stats?.avgPhqScore?.toFixed?.(2) ?? "—"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Avg GAD-7</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {stats?.avgGadScore?.toFixed?.(2) ?? "—"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Crisis Flags</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">
                  {stats?.crisisEscalations ?? 0}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" /> Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usageData && <Bar data={usageData} options={chartOptions} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Mood (PHQ-9 & GAD-7)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {moodData && <Line data={moodData} options={chartOptions} />}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>Anxiety Spike Prediction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">
                Next 7 days forecast based on recent GAD-7 averages.
              </p>
              {predData && <Line data={predData} options={chartOptions} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
