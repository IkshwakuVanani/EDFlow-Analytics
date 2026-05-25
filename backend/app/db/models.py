from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text, func

from app.db.database import Base


class RawTimelyEffectiveCare(Base):
    __tablename__ = "raw_timely_effective_care"

    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(String(32), index=True)
    facility_name = Column(String(255), index=True)
    address = Column(String(255))
    citytown = Column(String(120))
    state = Column(String(2), index=True)
    zip_code = Column(String(20))
    countyparish = Column(String(120))
    telephone_number = Column(String(40))
    condition = Column(String(160), index=True)
    measure_id = Column(String(80), index=True)
    measure_name = Column(String(255))
    score = Column(String(120))
    sample = Column(String(120))
    footnote = Column(String(255))
    start_date = Column(String(20))
    end_date = Column(String(20))
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())


class DimHospital(Base):
    __tablename__ = "dim_hospital"

    provider_id = Column(String(32), primary_key=True, index=True)
    facility_name = Column(String(255), nullable=False, index=True)
    address = Column(String(255))
    city = Column(String(120))
    state = Column(String(2), nullable=False, index=True)
    zip_code = Column(String(20))
    county = Column(String(120))
    telephone = Column(String(40))
    hospital_type = Column(String(120))
    ownership = Column(String(160))
    emergency_services = Column(Boolean, default=True)
    overall_rating = Column(Float)


class DimLocation(Base):
    __tablename__ = "dim_location"

    id = Column(Integer, primary_key=True)
    state = Column(String(2), nullable=False, unique=True, index=True)
    region = Column(String(80), nullable=False)


class DimMeasure(Base):
    __tablename__ = "dim_measure"

    measure_id = Column(String(80), primary_key=True, index=True)
    measure_name = Column(String(255), nullable=False)
    measure_group = Column(String(120), nullable=False)
    unit = Column(String(80), nullable=False)
    higher_is_worse = Column(Boolean, default=True)


class FactEDQualityMeasure(Base):
    __tablename__ = "fact_ed_quality_measure"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(String(32), ForeignKey("dim_hospital.provider_id"), index=True)
    measure_id = Column(String(80), ForeignKey("dim_measure.measure_id"), index=True)
    score_raw = Column(String(120))
    score_value = Column(Float, index=True)
    sample_raw = Column(String(120))
    footnote = Column(String(255))
    start_date = Column(String(20))
    end_date = Column(String(20))
    reporting_period = Column(String(40), index=True)
    data_status = Column(String(40), default="reported")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FactStateEDSummary(Base):
    __tablename__ = "fact_state_ed_summary"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String(2), nullable=False, index=True)
    measure_id = Column(String(80), nullable=False, index=True)
    hospital_count = Column(Integer, nullable=False)
    average_score = Column(Float)
    median_score = Column(Float)
    p75_score = Column(Float)
    missing_rate = Column(Float, default=0.0)
    start_date = Column(String(20))
    end_date = Column(String(20))
    updated_at = Column(DateTime(timezone=True), server_default=func.now())


class DataQualityCheck(Base):
    __tablename__ = "data_quality_checks"

    id = Column(Integer, primary_key=True, index=True)
    check_name = Column(String(160), nullable=False)
    table_name = Column(String(120), nullable=False)
    status = Column(String(40), nullable=False)
    metric_value = Column(Float)
    threshold = Column(Float)
    details = Column(Text)
    checked_at = Column(DateTime(timezone=True), server_default=func.now())


class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_name = Column(String(160), nullable=False)
    model_type = Column(String(80), nullable=False)
    metrics_json = Column(JSON, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ModelOutlier(Base):
    __tablename__ = "model_outliers"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(String(32), index=True)
    facility_name = Column(String(255), nullable=False)
    state = Column(String(2), nullable=False, index=True)
    measure_id = Column(String(80), nullable=False, index=True)
    score_value = Column(Float, nullable=False)
    z_score = Column(Float)
    iqr_score = Column(Float)
    severity = Column(String(40), nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ModelCluster(Base):
    __tablename__ = "model_clusters"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(String(32), nullable=False, index=True)
    facility_name = Column(String(255), nullable=False)
    state = Column(String(2), nullable=False, index=True)
    cluster_id = Column(Integer, nullable=False, index=True)
    cluster_label = Column(String(120), nullable=False)
    features_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class HighRiskHospital(Base):
    __tablename__ = "high_risk_hospitals"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(String(32), nullable=False, index=True)
    facility_name = Column(String(255), nullable=False)
    state = Column(String(2), nullable=False, index=True)
    risk_probability = Column(Float, nullable=False)
    risk_category = Column(String(80), nullable=False)
    drivers_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FeatureImportance(Base):
    __tablename__ = "feature_importance"

    id = Column(Integer, primary_key=True, index=True)
    feature_name = Column(String(160), nullable=False)
    importance = Column(Float, nullable=False)
    model_name = Column(String(160), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
