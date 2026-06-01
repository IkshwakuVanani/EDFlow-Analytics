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

export type CapacityKpi = {
  id: string;
  label: string;
  value: string;
  severity: "low" | "moderate" | "high";
  trend: string;
  detail: string;
};

export type CapacityTimelinePoint = {
  time: string;
  time_label: string;
  boarders: number;
  predicted_boarders: number;
  available_beds: number;
  unlockable_beds: number;
  risk_window: boolean;
  action_marker: string | null;
};

export type CapacityFlowNode = {
  id: string;
  label: string;
  value: number;
  severity: "low" | "moderate" | "high";
  category: string;
};

export type CapacityFlowEdge = {
  source: string;
  target: string;
  label: string;
  count: number;
  severity: "low" | "moderate" | "high";
};

export type CapacityBlocker = {
  id: string;
  rank: number;
  blocker_type: string;
  title: string;
  owner_role: string;
  unit: string;
  dependency: string;
  status: "at_risk" | "monitor" | "resolved";
  severity: "low" | "moderate" | "high";
  sla_minutes_remaining: number;
  estimated_beds_unlocked: number;
  estimated_bed_hour_impact: number;
  confidence: number;
  trend: string;
  reason: string;
};

export type CapacityAction = {
  id: string;
  priority: number;
  title: string;
  action_type: string;
  owner: string;
  owner_role: string;
  unit: string;
  status: "queued" | "assigned" | "in_progress" | "escalated" | "done";
  severity: "low" | "moderate" | "high";
  escalation_state: "none" | "monitor" | "at_risk" | "escalated" | "resolved";
  sla_deadline: string;
  minutes_to_deadline: number;
  dependency_ids: string[];
  dependency_label: string;
  expected_beds_unlocked: number;
  expected_bed_hours_saved: number;
  reason: string;
  patients_impacted: number;
  last_updated: string;
};

export type CapacityCommandCenter = {
  product_name: string;
  hospital_name: string;
  unit_name: string;
  shift: string;
  current_time: string;
  horizon_minutes: number;
  risk_window: string;
  service_health: Array<{ label: string; status: string }>;
  kpis: CapacityKpi[];
  timeline: CapacityTimelinePoint[];
  flow_nodes: CapacityFlowNode[];
  flow_edges: CapacityFlowEdge[];
  blockers: CapacityBlocker[];
  actions: CapacityAction[];
  selected_action_id: string;
};

export type CapacityActionUpdate = {
  status?: CapacityAction["status"];
  owner?: string;
  escalation_state?: CapacityAction["escalation_state"];
  note?: string;
};

export type SimulationScenario = {
  extra_staffed_beds: number;
  evs_rooms_prioritized: number;
  transporters_added: number;
  accelerated_discharges: number;
  observation_overflow: number;
};

export type SimulationResult = {
  scenario: SimulationScenario;
  projected_boarding_hours: number;
  baseline_boarding_hours: number;
  boarding_hours_reduced: number;
  beds_unlocked: number;
  risk_window_after: string;
  recommended_actions: string[];
  explanation: string;
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

const mockCapacityKpis: CapacityKpi[] = [
  { id: "ed_boarders", label: "ED boarders", value: "42", severity: "high", trend: "+6 vs 1h ago", detail: "Admitted patients awaiting placement" },
  { id: "boarding_hours", label: "Predicted boarding hours", value: "312", severity: "high", trend: "+48 vs 1h ago", detail: "Forecast exposure over six hours" },
  { id: "unlockable_beds", label: "Beds unlockable", value: "18", severity: "moderate", trend: "+5 vs 1h ago", detail: "Likely beds if blockers clear" },
  { id: "sla_tasks", label: "At-risk SLA tasks", value: "27", severity: "high", trend: "+9 vs 1h ago", detail: "Tasks likely to miss deadline" },
];

const mockCapacityTimeline: CapacityTimelinePoint[] = [
  { time: "08:00", time_label: "8 AM", boarders: 34, predicted_boarders: 34, available_beds: 14, unlockable_beds: 10, risk_window: false, action_marker: null },
  { time: "09:00", time_label: "9 AM", boarders: 46, predicted_boarders: 45, available_beds: 17, unlockable_beds: 12, risk_window: false, action_marker: "Transport pull-forward" },
  { time: "10:00", time_label: "10 AM", boarders: 47, predicted_boarders: 48, available_beds: 19, unlockable_beds: 14, risk_window: false, action_marker: null },
  { time: "11:00", time_label: "11 AM", boarders: 50, predicted_boarders: 54, available_beds: 20, unlockable_beds: 15, risk_window: false, action_marker: null },
  { time: "12:00", time_label: "12 PM", boarders: 54, predicted_boarders: 61, available_beds: 20, unlockable_beds: 16, risk_window: false, action_marker: "EVS priority batch" },
  { time: "13:00", time_label: "1 PM", boarders: 56, predicted_boarders: 68, available_beds: 22, unlockable_beds: 17, risk_window: false, action_marker: null },
  { time: "14:00", time_label: "2 PM", boarders: 47, predicted_boarders: 73, available_beds: 22, unlockable_beds: 18, risk_window: true, action_marker: "Discharge meds expedite" },
  { time: "15:00", time_label: "3 PM", boarders: 48, predicted_boarders: 79, available_beds: 22, unlockable_beds: 18, risk_window: true, action_marker: null },
  { time: "16:00", time_label: "4 PM", boarders: 48, predicted_boarders: 84, available_beds: 22, unlockable_beds: 18, risk_window: true, action_marker: null },
  { time: "17:00", time_label: "5 PM", boarders: 52, predicted_boarders: 87, available_beds: 26, unlockable_beds: 19, risk_window: true, action_marker: null },
  { time: "18:00", time_label: "6 PM", boarders: 48, predicted_boarders: 87, available_beds: 24, unlockable_beds: 18, risk_window: true, action_marker: null },
  { time: "19:00", time_label: "7 PM", boarders: 47, predicted_boarders: 86, available_beds: 24, unlockable_beds: 16, risk_window: false, action_marker: null },
  { time: "20:00", time_label: "8 PM", boarders: 34, predicted_boarders: 84, available_beds: 17, unlockable_beds: 13, risk_window: false, action_marker: null },
];

const mockCapacityFlowNodes: CapacityFlowNode[] = [
  { id: "ed_boarders", label: "ED Boarders", value: 42, severity: "high", category: "demand" },
  { id: "pending_discharges", label: "Pending Discharges", value: 76, severity: "moderate", category: "capacity" },
  { id: "evs_clean", label: "Room Clean", value: 22, severity: "moderate", category: "task" },
  { id: "transport", label: "Transport Queue", value: 14, severity: "high", category: "task" },
  { id: "placement", label: "Placement Mismatch", value: 11, severity: "moderate", category: "task" },
  { id: "ready_beds", label: "Ready Beds", value: 18, severity: "moderate", category: "capacity" },
];

const mockCapacityFlowEdges: CapacityFlowEdge[] = [
  { source: "ed_boarders", target: "pending_discharges", label: "needs bed path", count: 42, severity: "high" },
  { source: "pending_discharges", target: "evs_clean", label: "rooms to turn", count: 22, severity: "moderate" },
  { source: "pending_discharges", target: "transport", label: "patients to move", count: 14, severity: "high" },
  { source: "pending_discharges", target: "placement", label: "bed class mismatch", count: 11, severity: "moderate" },
  { source: "evs_clean", target: "ready_beds", label: "clean complete", count: 18, severity: "moderate" },
  { source: "transport", target: "ready_beds", label: "arrival pending", count: 10, severity: "high" },
  { source: "placement", target: "ready_beds", label: "assignment review", count: 8, severity: "moderate" },
];

const mockCapacityBlockers: CapacityBlocker[] = [
  { id: "blk-discharge-meds", rank: 1, blocker_type: "Discharge meds", title: "Discharge meds pending", owner_role: "Pharmacy", unit: "3W Med-Surg", dependency: "Medication reconciliation", status: "at_risk", severity: "high", sla_minutes_remaining: 36, estimated_beds_unlocked: 6, estimated_bed_hour_impact: 12, confidence: 0.86, trend: "up", reason: "Twelve discharge-ready patients are waiting on meds before room release." },
  { id: "blk-evs-turnover", rank: 2, blocker_type: "EVS turnover", title: "EVS turnover delay", owner_role: "Environmental Services", unit: "5B / 4N", dependency: "Dirty rooms batched", status: "at_risk", severity: "high", sla_minutes_remaining: 51, estimated_beds_unlocked: 5, estimated_bed_hour_impact: 9, confidence: 0.81, trend: "up", reason: "Eight dirty rooms map directly to med-surg boarders awaiting assignment." },
  { id: "blk-transport", rank: 3, blocker_type: "Transport", title: "Transport queue backlog", owner_role: "Transport", unit: "ED to 3W", dependency: "Pickup queue depth", status: "at_risk", severity: "high", sla_minutes_remaining: 46, estimated_beds_unlocked: 4, estimated_bed_hour_impact: 7, confidence: 0.74, trend: "up", reason: "Ready beds are not usable until boarders physically leave the ED." },
  { id: "blk-staffing", rank: 4, blocker_type: "Staffing", title: "Staffing confirmation", owner_role: "Nursing Admin", unit: "3W Med-Surg", dependency: "RN coverage for 11 AM cohort", status: "monitor", severity: "moderate", sla_minutes_remaining: 96, estimated_beds_unlocked: 3, estimated_bed_hour_impact: 6, confidence: 0.69, trend: "flat", reason: "Beds can open only if staffed before the afternoon risk window." },
  { id: "blk-placement", rank: 5, blocker_type: "Placement", title: "Placement mismatch", owner_role: "Case Management", unit: "ED / Med-Surg", dependency: "Telemetry downgrade review", status: "monitor", severity: "moderate", sla_minutes_remaining: 126, estimated_beds_unlocked: 2, estimated_bed_hour_impact: 5, confidence: 0.63, trend: "flat", reason: "Several boarders need a med-surg alternative to a higher-acuity bed request." },
];

const mockCapacityActions: CapacityAction[] = [
  { id: "act-discharge-meds", priority: 1, title: "Expedite discharge meds for 12 patients", action_type: "Discharge meds", owner: "Pharmacy Team A", owner_role: "Pharmacy", unit: "3W Med-Surg", status: "assigned", severity: "high", escalation_state: "at_risk", sla_deadline: "09:00 AM", minutes_to_deadline: 36, dependency_ids: ["blk-discharge-meds"], dependency_label: "Has dependency", expected_beds_unlocked: 6, expected_bed_hours_saved: 18, reason: "This clears the highest-impact discharge blocker and converts discharge-ready rooms into staffed beds before the risk window.", patients_impacted: 12, last_updated: "08:24 AM" },
  { id: "act-evs-priority", priority: 2, title: "Prioritize EVS for 8 dirty rooms", action_type: "EVS turnover", owner: "EVS Team B", owner_role: "Environmental Services", unit: "5B / 4N", status: "queued", severity: "high", escalation_state: "at_risk", sla_deadline: "09:15 AM", minutes_to_deadline: 51, dependency_ids: ["blk-evs-turnover"], dependency_label: "Has dependency", expected_beds_unlocked: 5, expected_bed_hours_saved: 13.5, reason: "EVS turnover is the next bottleneck after pending discharge orders are released.", patients_impacted: 8, last_updated: "08:24 AM" },
  { id: "act-transport-pull", priority: 3, title: "Move 5 patients in transport queue", action_type: "Transport", owner: "Transport Lead", owner_role: "Transport", unit: "ED to 3W", status: "queued", severity: "high", escalation_state: "at_risk", sla_deadline: "09:10 AM", minutes_to_deadline: 46, dependency_ids: ["blk-transport"], dependency_label: "Has dependency", expected_beds_unlocked: 4, expected_bed_hours_saved: 10, reason: "Ready beds remain latent capacity until boarders are physically moved out of the ED.", patients_impacted: 5, last_updated: "08:24 AM" },
  { id: "act-staffing-confirm", priority: 4, title: "Confirm RN staffing on 3W for 11 AM", action_type: "Staffing", owner: "Nursing Admin", owner_role: "Nursing Admin", unit: "3W Med-Surg", status: "queued", severity: "moderate", escalation_state: "monitor", sla_deadline: "10:00 AM", minutes_to_deadline: 96, dependency_ids: ["blk-staffing"], dependency_label: "Has dependency", expected_beds_unlocked: 3, expected_bed_hours_saved: 7.5, reason: "Staffing confirmation protects the beds expected to unlock during the risk window.", patients_impacted: 6, last_updated: "08:24 AM" },
  { id: "act-placement-review", priority: 5, title: "Resolve placement mismatch for 11 patients", action_type: "Placement", owner: "Case Mgmt Team C", owner_role: "Case Management", unit: "ED / Med-Surg", status: "queued", severity: "moderate", escalation_state: "monitor", sla_deadline: "10:30 AM", minutes_to_deadline: 126, dependency_ids: ["blk-placement"], dependency_label: "Has dependency", expected_beds_unlocked: 2, expected_bed_hours_saved: 5, reason: "Downgrade review can redirect boarders to med-surg beds without waiting on telemetry capacity.", patients_impacted: 11, last_updated: "08:24 AM" },
];

const mockCapacityCommandCenter: CapacityCommandCenter = {
  product_name: "EDFlow Orchestrator",
  hospital_name: "Cityview Medical Center",
  unit_name: "Med-Surg Capacity",
  shift: "Day shift",
  current_time: "08:24 AM",
  horizon_minutes: 360,
  risk_window: "1:30 PM - 6:00 PM",
  service_health: [
    { label: "EHR", status: "online" },
    { label: "ADT", status: "online" },
    { label: "Capacity", status: "online" },
    { label: "RTLS", status: "online" },
    { label: "EVS", status: "watch" },
  ],
  kpis: mockCapacityKpis,
  timeline: mockCapacityTimeline,
  flow_nodes: mockCapacityFlowNodes,
  flow_edges: mockCapacityFlowEdges,
  blockers: mockCapacityBlockers,
  actions: mockCapacityActions,
  selected_action_id: "act-discharge-meds",
};

const defaultScenario: SimulationScenario = {
  extra_staffed_beds: 2,
  evs_rooms_prioritized: 4,
  transporters_added: 1,
  accelerated_discharges: 3,
  observation_overflow: 0,
};

function buildMockSimulation(scenario: SimulationScenario): SimulationResult {
  const bedsUnlocked =
    scenario.extra_staffed_beds +
    scenario.evs_rooms_prioritized +
    scenario.transporters_added * 2 +
    scenario.accelerated_discharges +
    Math.min(scenario.observation_overflow, 10);
  const baseline = 312;
  const reduced = Math.min(166, bedsUnlocked * 4.6 + scenario.accelerated_discharges * 1.2);
  return {
    scenario,
    projected_boarding_hours: Math.round((baseline - reduced) * 10) / 10,
    baseline_boarding_hours: baseline,
    boarding_hours_reduced: Math.round(reduced * 10) / 10,
    beds_unlocked: bedsUnlocked,
    risk_window_after: reduced > 80 ? "Compressed by about 90 minutes" : "Still active from 1:30 PM - 6:00 PM",
    recommended_actions: ["Run discharge-med expedite", "Batch EVS turnover by bed class", "Pull transport capacity forward"],
    explanation: "Synthetic what-if estimate for converting latent capacity into usable med-surg beds.",
  };
}

async function request<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      },
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export const api = {
  commandCenter: (windowMinutes = 360) =>
    request<CapacityCommandCenter>(`/capacity/command-center?window_minutes=${windowMinutes}`, {
      ...mockCapacityCommandCenter,
      horizon_minutes: windowMinutes,
    }),
  capacityBlockers: () => request<CapacityBlocker[]>("/capacity/blockers", mockCapacityBlockers),
  capacityActions: () => request<CapacityAction[]>("/capacity/actions", mockCapacityActions),
  updateCapacityAction: (actionId: string, update: CapacityActionUpdate) => {
    const action = mockCapacityActions.find((item) => item.id === actionId) ?? mockCapacityActions[0];
    const fallback: CapacityAction = {
      ...action,
      status: update.status ?? action.status,
      owner: update.owner ?? action.owner,
      escalation_state: update.status === "done" ? "resolved" : update.escalation_state ?? action.escalation_state,
      severity: update.status === "done" ? "low" : action.severity,
      last_updated: "08:31 AM",
    };
    return request<CapacityAction>(`/capacity/actions/${actionId}`, fallback, {
      method: "PATCH",
      body: JSON.stringify(update),
    });
  },
  simulateCapacity: (scenario: SimulationScenario = defaultScenario) =>
    request<SimulationResult>("/capacity/simulate", buildMockSimulation(scenario), {
      method: "POST",
      body: JSON.stringify(scenario),
    }),
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
