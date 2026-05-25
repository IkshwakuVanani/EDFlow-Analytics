from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd
from sklearn.cluster import KMeans
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from common import PROCESSED_DIR


def build(processed_dir: Path) -> dict:
    fact = pd.read_csv(processed_dir / "fact_ed_quality_measure.csv", dtype={"provider_id": str})
    hospitals = pd.read_csv(processed_dir / "dim_hospital.csv", dtype={"provider_id": str})
    numeric = fact.dropna(subset=["score_value"])
    pivot = numeric.pivot_table(index="provider_id", columns="measure_id", values="score_value", aggfunc="mean").reset_index()
    dataset = hospitals.merge(pivot, on="provider_id", how="inner")
    for column in ["OP_18B", "OP_18C", "OP_22", "OP_23"]:
        if column not in dataset:
            dataset[column] = dataset.get("OP_18B", pd.Series([0] * len(dataset)))
        dataset[column] = dataset[column].fillna(dataset[column].median())

    features = ["OP_18B", "OP_18C", "OP_22", "OP_23"]
    scaler = StandardScaler()
    feature_matrix = scaler.fit_transform(dataset[features])

    cluster_count = min(4, max(1, len(dataset) // 3))
    if cluster_count >= 2 and len(dataset) >= cluster_count:
        dataset["cluster_id"] = KMeans(n_clusters=cluster_count, random_state=42, n_init=10).fit_predict(feature_matrix)
    else:
        dataset["cluster_id"] = 0
    dataset["high_ed_delay"] = (dataset["OP_18B"] >= dataset["OP_18B"].quantile(0.75)).astype(int)
    op18b_std = dataset["OP_18B"].std(ddof=0)
    if pd.isna(op18b_std) or op18b_std == 0:
        dataset["outlier_z_score"] = 0.0
    else:
        dataset["outlier_z_score"] = ((dataset["OP_18B"] - dataset["OP_18B"].mean()) / op18b_std).round(3)

    metrics: dict[str, float | int | None]
    if dataset["high_ed_delay"].nunique() > 1 and len(dataset) >= 8:
        x_train, x_test, y_train, y_test = train_test_split(
            dataset[features],
            dataset["high_ed_delay"],
            test_size=0.3,
            random_state=42,
            stratify=dataset["high_ed_delay"],
        )
        model = LogisticRegression(max_iter=1000)
        model.fit(x_train, y_train)
        predictions = model.predict(x_test)
        probabilities = model.predict_proba(x_test)[:, 1]
        metrics = {
            "accuracy": round(float(accuracy_score(y_test, predictions)), 3),
            "precision": round(float(precision_score(y_test, predictions, zero_division=0)), 3),
            "recall": round(float(recall_score(y_test, predictions, zero_division=0)), 3),
            "f1": round(float(f1_score(y_test, predictions, zero_division=0)), 3),
            "roc_auc": round(float(roc_auc_score(y_test, probabilities)), 3) if len(set(y_test)) > 1 else None,
            "sample_size": int(len(dataset)),
        }
        feature_importance = dict(zip(features, [round(float(value), 4) for value in model.coef_[0]]))
    else:
        metrics = {"sample_size": int(len(dataset)), "accuracy": None, "f1": None, "roc_auc": None}
        feature_importance = {feature: None for feature in features}

    return {
        "dataset": dataset,
        "outputs": {
            "metrics": metrics,
            "feature_importance": feature_importance,
            "top_outliers": dataset.sort_values("outlier_z_score", ascending=False)
            .head(25)[["provider_id", "facility_name", "state", "OP_18B", "OP_22", "outlier_z_score"]]
            .to_dict(orient="records"),
            "cluster_summary": dataset.groupby("cluster_id").size().reset_index(name="hospital_count").to_dict(orient="records"),
            "warning": "Hospital-level operations model only; no clinical decisions or patient-level predictions.",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build hospital-level ED modeling dataset and outputs.")
    parser.add_argument("--processed-dir", default=str(PROCESSED_DIR))
    parser.add_argument("--dataset-output", default=str(PROCESSED_DIR / "modeling_dataset.csv"))
    parser.add_argument("--results-output", default=str(PROCESSED_DIR / "modeling_results.json"))
    args = parser.parse_args()

    result = build(Path(args.processed_dir))
    Path(args.dataset_output).parent.mkdir(parents=True, exist_ok=True)
    result["dataset"].to_csv(args.dataset_output, index=False)
    Path(args.results_output).write_text(json.dumps(result["outputs"], indent=2), encoding="utf-8")
    print(json.dumps(result["outputs"], indent=2))


if __name__ == "__main__":
    main()
