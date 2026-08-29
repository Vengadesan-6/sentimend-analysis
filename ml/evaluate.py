import time
import datetime
import argparse
import logging
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
import pymongo
from ml.config import PROCESSED_DATA_DIR, ml_config
from ml.models.sentiment_model import SentimentTransformerEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("SentixEvaluator")

def evaluate_and_persist_metrics(
    model_names=None,
    test_csv: str = str(PROCESSED_DATA_DIR / "test.csv"),
    mongodb_url: str = ml_config.mongodb_url,
    database_name: str = ml_config.database_name
):
    """
    Runs actual evaluation on benchmark test set across models,
    computes real performance metrics, and stores the results in MongoDB `model_metrics`.
    """
    if model_names is None:
        model_names = [
            ml_config.sentiment_model_name,
            ml_config.distilbert_model_name,
            ml_config.bert_model_name
        ]

    logger.info(f"Loading evaluation dataset from {test_csv}...")
    test_df = pd.read_csv(test_csv)
    if "text" not in test_df.columns or "label" not in test_df.columns:
        raise ValueError("Evaluation test CSV must contain 'text' and 'label' columns.")

    texts = test_df["text"].tolist()
    ground_truth = test_df["label"].astype(str).str.capitalize().tolist()

    client = pymongo.MongoClient(mongodb_url, serverSelectionTimeoutMS=3000)
    db = client[database_name]
    metrics_collection = db["model_metrics"]

    evaluation_summary = []

    for m_name in model_names:
        logger.info(f"Evaluating model: {m_name} on {len(texts)} test samples...")
        try:
            engine = SentimentTransformerEngine.get_instance(m_name)
        except Exception as e:
            logger.warning(f"Could not load {m_name}, skipping: {e}")
            continue

        # Measure real inference latency and predictions
        start_time = time.perf_counter()
        predictions_output = engine.predict_batch(texts)
        total_time_s = time.perf_counter() - start_time
        avg_latency_ms = round((total_time_s / len(texts)) * 1000.0, 2)

        predicted_labels = [p["sentiment"] for p in predictions_output]

        # Calculate real metrics
        acc = float(accuracy_score(ground_truth, predicted_labels))
        p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(
            ground_truth, predicted_labels, average="macro", zero_division=0
        )
        p_weighted, r_weighted, f1_weighted, _ = precision_recall_fscore_support(
            ground_truth, predicted_labels, average="weighted", zero_division=0
        )

        labels_list = ["Positive", "Neutral", "Negative"]
        cm = confusion_matrix(ground_truth, predicted_labels, labels=labels_list).tolist()

        doc = {
            "model_name": m_name,
            "display_name": m_name.split("/")[-1],
            "accuracy": round(acc, 4),
            "precision": round(float(p_weighted), 4),
            "recall": round(float(r_weighted), 4),
            "f1_score": round(float(f1_weighted), 4),
            "macro_f1": round(float(f1_macro), 4),
            "inference_time_ms": avg_latency_ms,
            "test_sample_count": len(texts),
            "confusion_matrix": {
                "labels": labels_list,
                "matrix": cm
            },
            "evaluated_at": datetime.datetime.utcnow().isoformat()
        }

        # Upsert into MongoDB model_metrics
        metrics_collection.update_one(
            {"model_name": m_name},
            {"$set": doc},
            upsert=True
        )

        evaluation_summary.append(doc)
        logger.info(
            f"Model: {doc['display_name']} -> Accuracy: {acc:.4f} | F1: {f1_weighted:.4f} | Latency: {avg_latency_ms}ms"
        )

    logger.info("Evaluation and MongoDB persistence completed successfully.")
    return evaluation_summary

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate Transformer Models & Save Metrics to Mongo")
    parser.add_argument("--test_csv", type=str, default=str(PROCESSED_DATA_DIR / "test.csv"))
    args = parser.parse_args()

    evaluate_and_persist_metrics(test_csv=args.test_csv)
