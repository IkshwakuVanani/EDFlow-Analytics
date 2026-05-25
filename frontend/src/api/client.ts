const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type StateSummary = {
  state: string;
  measure_id: string;
  hospital_count: number;
  average_score: number | null;
  median_score: number | null;
  p75_score: number | null;
  missing_rate: number;
};

export type Overview = {
  national_median_ed_time: number | null;
  reporting_hospitals: number;
  average_lwbs_rate: number | null;
  best_state: StateSummary | null;
  worst_state: StateSummary | null;
  distribution: Array<{ bucket: string; count: number }>;
  state_summary: StateSummary[];
};

export type HospitalSummary = {
  provider_id: string;
  facility_name: string;
  city: string | null;
  state: string;
  overall_rating: number | null;
  ed_departure_minutes: number | null;
  left_without_seen_rate: number | null;
};

export type HospitalDetail = HospitalSummary & {
  address: string | null;
  zip_code: string | null;
  county: string | null;
  telephone: string | null;
  hospital_type: string | null;
  ownership: string | null;
  measures: Array<{
    measure_id: string;
    measure_name: string;
    score_raw: string | null;
    score_value: number | null;
    unit: string;
    start_date: string | null;
    end_date: string | null;
    data_status: string;
  }>;
};

export type HospitalList = {
  total: number;
  limit: number;
  offset: number;
  items: HospitalSummary[];
};

export type Outlier = {
  provider_id: string;
  facility_name: string;
  state: string;
  measure_id: string;
  score_value: number;
  z_score: number | null;
  iqr_score?: number | null;
  severity: string;
  reason: string;
};

export type DataQuality = {
  raw_row_count: number;
  clean_hospital_count: number;
  clean_fact_count: number;
  failed_checks: number;
  warning_checks: number;
  latest_ingestion_timestamp: string | null;
  checks: Array<{
    check_name: string;
    table_name: string;
    status: string;
    metric_value: number | null;
    threshold: number | null;
    details: string | null;
    checked_at: string | null;
  }>;
};

export type ClusterResponse = {
  items: Array<{
    provider_id: string;
    facility_name: string;
    state: string;
    cluster_id: number;
    cluster_label: string;
    features: Record<string, number | string | null>;
  }>;
  summary: Array<{ cluster_label: string; count: number; states: string[] }>;
};

export type HighRiskHospital = {
  provider_id: string;
  facility_name: string;
  state: string;
  risk_probability: number;
  risk_category: string;
  drivers: string[];
};

export type FeatureImportance = {
  feature_name: string;
  importance: number;
  model_name: string;
};

export type ModelSummary = {
  run_name: string | null;
  model_type: string | null;
  metrics: Record<string, number | string | null>;
  notes?: string;
  limitations: string[];
  warning: string;
};

const mockHospitals: HospitalSummary[] = [
  { provider_id: "120001", facility_name: "The Queen's Medical Center", city: "Honolulu", state: "HI", overall_rating: 4, ed_departure_minutes: 310, left_without_seen_rate: 6.2 },
  { provider_id: "110001", facility_name: "Grady Memorial Hospital", city: "Atlanta", state: "GA", overall_rating: 3, ed_departure_minutes: 278, left_without_seen_rate: 5.5 },
  { provider_id: "050001", facility_name: "UCSF Medical Center", city: "San Francisco", state: "CA", overall_rating: 5, ed_departure_minutes: 256, left_without_seen_rate: 4.7 },
  { provider_id: "250001", facility_name: "University of Mississippi Medical Center", city: "Jackson", state: "MS", overall_rating: 3, ed_departure_minutes: 246, left_without_seen_rate: 4.4 },
  { provider_id: "490001", facility_name: "Inova Fairfax Hospital", city: "Falls Church", state: "VA", overall_rating: 4, ed_departure_minutes: 165, left_without_seen_rate: 2.0 },
  { provider_id: "010005", facility_name: "Marshall Medical Centers", city: "Boaz", state: "AL", overall_rating: 4, ed_departure_minutes: 144, left_without_seen_rate: 1.8 },
];

const mockStateSummary: StateSummary[] = [
  { state: "HI", measure_id: "OP_18B", hospital_count: 1, average_score: 310, median_score: 310, p75_score: 310, missing_rate: 0 },
  { state: "GA", measure_id: "OP_18B", hospital_count: 1, average_score: 278, median_score: 278, p75_score: 278, missing_rate: 0 },
  { state: "CA", measure_id: "OP_18B", hospital_count: 2, average_score: 238, median_score: 238, p75_score: 247, missing_rate: 0 },
  { state: "MS", measure_id: "OP_18B", hospital_count: 1, average_score: 246, median_score: 246, p75_score: 246, missing_rate: 0 },
  { state: "AL", measure_id: "OP_18B", hospital_count: 2, average_score: 151, median_score: 151, p75_score: 154.5, missing_rate: 0 },
  { state: "VA", measure_id: "OP_18B", hospital_count: 1, average_score: 165, median_score: 165, p75_score: 165, missing_rate: 0 },
];

const mockOverview: Overview = {
  national_median_ed_time: 211,
  reporting_hospitals: 12,
  average_lwbs_rate: 3.6,
  best_state: mockStateSummary[4],
  worst_state: mockStateSummary[0],
  distribution: [
    { bucket: "<160", count: 2 },
    { bucket: "160-199", count: 3 },
    { bucket: "200-239", count: 3 },
    { bucket: "240-279", count: 3 },
    { bucket: "280+", count: 1 },
  ],
  state_summary: mockStateSummary,
};

const mockOutliers: Outlier[] = [
  { provider_id: "120001", facility_name: "The Queen's Medical Center", state: "HI", measure_id: "OP_18B", score_value: 310, z_score: 1.78, iqr_score: 64, severity: "high", reason: "ED departure time is above the national upper quartile." },
  { provider_id: "110001", facility_name: "Grady Memorial Hospital", state: "GA", measure_id: "OP_18B", score_value: 278, z_score: 1.24, iqr_score: 32, severity: "moderate", reason: "ED departure time is above the national upper quartile." },
];

const mockQuality: DataQuality = {
  raw_row_count: 0,
  clean_hospital_count: 12,
  clean_fact_count: 60,
  failed_checks: 0,
  warning_checks: 1,
  latest_ingestion_timestamp: null,
  checks: [
    { check_name: "raw_row_count", table_name: "raw_timely_effective_care", status: "warning", metric_value: 0, threshold: 1, details: "Run the CMS ingestion pipeline to replace seed data.", checked_at: null },
    { check_name: "clean_hospital_count", table_name: "dim_hospital", status: "pass", metric_value: 12, threshold: 1, details: "Local seed hospitals are available.", checked_at: null },
    { check_name: "invalid_numeric_fields", table_name: "fact_ed_quality_measure", status: "pass", metric_value: 0, threshold: 0, details: "Numeric ED measures parsed successfully.", checked_at: null },
  ],
};

const mockClusters: ClusterResponse = {
  items: mockHospitals.map((hospital, index) => ({
    provider_id: hospital.provider_id,
    facility_name: hospital.facility_name,
    state: hospital.state,
    cluster_id: index % 4,
    cluster_label: hospital.ed_departure_minutes && hospital.ed_departure_minutes > 245 ? "High-risk ED bottleneck hospitals" : "Average throughput hospitals",
    features: {
      ed_departure_minutes: hospital.ed_departure_minutes,
      left_without_being_seen_rate: hospital.left_without_seen_rate,
      overall_rating: hospital.overall_rating,
    },
  })),
  summary: [
    { cluster_label: "High-risk ED bottleneck hospitals", count: 3, states: ["CA", "GA", "HI"] },
    { cluster_label: "Average throughput hospitals", count: 3, states: ["AL", "MS", "VA"] },
  ],
};

const mockHighRisk: HighRiskHospital[] = mockHospitals
  .slice(0, 4)
  .map((hospital) => ({
    provider_id: hospital.provider_id,
    facility_name: hospital.facility_name,
    state: hospital.state,
    risk_probability: hospital.ed_departure_minutes ? Math.min(0.95, hospital.ed_departure_minutes / 340) : 0.2,
    risk_category: hospital.ed_departure_minutes && hospital.ed_departure_minutes > 245 ? "high" : "watch",
    drivers: ["High ED departure time", "Elevated left-without-being-seen rate"],
  }));

const mockFeatureImportance: FeatureImportance[] = [
  { feature_name: "OP_18B departure minutes", importance: 0.42, model_name: "high_ed_delay_logistic_baseline" },
  { feature_name: "OP_22 left without being seen rate", importance: 0.31, model_name: "high_ed_delay_logistic_baseline" },
  { feature_name: "OP_18C psychiatric ED time", importance: 0.15, model_name: "high_ed_delay_logistic_baseline" },
  { feature_name: "Overall hospital rating", importance: 0.08, model_name: "high_ed_delay_logistic_baseline" },
];

const mockModelSummary: ModelSummary = {
  run_name: "local_seed_model_run",
  model_type: "zscore_clustering_logistic_baseline",
  metrics: { baseline_accuracy: 0.75, model_accuracy: 0.83, precision: 0.8, recall: 0.67, f1: 0.73, roc_auc: 0.86 },
  limitations: [
    "Uses hospital-level public quality data, not patient-level clinical records.",
    "Seed results are illustrative until the CMS ingestion and modeling pipelines are run.",
    "Model outputs should guide analyst review, not operational decisions by themselves.",
  ],
  warning: "This model is for healthcare operations analysis only. It does not make clinical decisions or patient-level predictions.",
};

async function request<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export const api = {
  overview: () => request<Overview>("/ed/overview", mockOverview),
  stateSummary: () => request<StateSummary[]>("/ed/state-summary", mockStateSummary),
  hospitals: (search = "", state = "") => {
    const params = new URLSearchParams({ limit: "100" });
    if (search) params.set("search", search);
    if (state) params.set("state", state);
    const fallbackItems = mockHospitals.filter((hospital) => {
      const matchesSearch = search
        ? `${hospital.facility_name} ${hospital.provider_id} ${hospital.city}`.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesState = state ? hospital.state === state.toUpperCase() : true;
      return matchesSearch && matchesState;
    });
    return request<HospitalList>(`/hospitals?${params.toString()}`, {
      total: fallbackItems.length,
      limit: 100,
      offset: 0,
      items: fallbackItems,
    });
  },
  hospital: (providerId: string) =>
    request<HospitalDetail>(`/hospitals/${providerId}`, {
      ...(mockHospitals.find((hospital) => hospital.provider_id === providerId) ?? mockHospitals[0]),
      address: "Local development seed address",
      zip_code: "00000",
      county: null,
      telephone: null,
      hospital_type: "Acute Care Hospitals",
      ownership: "Voluntary nonprofit",
      measures: [
        { measure_id: "OP_18B", measure_name: "Median ED arrival to departure", score_raw: "256", score_value: 256, unit: "minutes", start_date: "01/01/2024", end_date: "12/31/2024", data_status: "reported" },
        { measure_id: "OP_22", measure_name: "Left without being seen", score_raw: "4.7", score_value: 4.7, unit: "percent", start_date: "01/01/2024", end_date: "12/31/2024", data_status: "reported" },
      ],
    }),
  outliers: () => request<Outlier[]>("/ed/outliers", mockOutliers),
  quality: () => request<DataQuality>("/data-quality", mockQuality),
  modelOutliers: () => request<Outlier[]>("/models/outliers", mockOutliers),
  clusters: () => request<ClusterResponse>("/models/clusters", mockClusters),
  highRisk: () => request<HighRiskHospital[]>("/models/high-risk-hospitals", mockHighRisk),
  featureImportance: () => request<FeatureImportance[]>("/models/feature-importance", mockFeatureImportance),
  modelSummary: () => request<ModelSummary>("/models/model-summary", mockModelSummary),
};
