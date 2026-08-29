import os
import time
import argparse
import logging
import torch
import pandas as pd
import numpy as np
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    get_linear_schedule_with_warmup
)
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from ml.config import PROCESSED_DATA_DIR, MODELS_DIR, ml_config
from ml.preprocess import clean_text

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("SentixTrainer")

class SentimentDataset(Dataset):
    """
    PyTorch Dataset for Transformer Sequence Classification.
    """
    def __init__(self, texts, labels, tokenizer, max_length=ml_config.max_length):
        self.texts = [clean_text(str(t)) for t in texts]
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]

        encoding = self.tokenizer(
            text,
            padding="max_length",
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt"
        )

        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "labels": torch.tensor(label, dtype=torch.long)
        }

def map_labels(label_series: pd.Series) -> Tuple_Labels:
    """
    Converts string sentiments ('Positive', 'Neutral', 'Negative') to integer class indices.
    """
    label_to_id = {"Negative": 0, "Neutral": 1, "Positive": 2}
    return [label_to_id.get(str(l).capitalize(), 1) for l in label_series]

def train_model(
    model_name: str = "distilbert-base-uncased",
    train_csv: str = str(PROCESSED_DATA_DIR / "train.csv"),
    val_csv: str = str(PROCESSED_DATA_DIR / "val.csv"),
    epochs: int = 3,
    batch_size: int = 8,
    learning_rate: float = 2e-5,
    output_dir: str = str(MODELS_DIR / "custom_sentiment_model")
):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Starting model fine-tuning on {device} for {model_name}...")

    # Load datasets
    train_df = pd.read_csv(train_csv)
    val_df = pd.read_csv(val_csv)

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name,
        num_labels=3,
        id2label={0: "Negative", 1: "Neutral", 2: "Positive"},
        label2id={"Negative": 0, "Neutral": 1, "Positive": 2}
    )
    model.to(device)

    train_labels = map_labels(train_df["label"])
    val_labels = map_labels(val_df["label"])

    train_dataset = SentimentDataset(train_df["text"].tolist(), train_labels, tokenizer)
    val_dataset = SentimentDataset(val_df["text"].tolist(), val_labels, tokenizer)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    optimizer = AdamW(model.parameters(), lr=learning_rate, weight_decay=0.01)
    total_steps = len(train_loader) * epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=int(total_steps * 0.1),
        num_training_steps=total_steps
    )

    best_val_accuracy = 0.0

    for epoch in range(1, epochs + 1):
        model.train()
        total_train_loss = 0.0
        start_time = time.time()

        for step, batch in enumerate(train_loader):
            optimizer.zero_grad()
            
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
            loss = outputs.loss
            loss.backward()

            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            scheduler.step()

            total_train_loss += loss.item()

        avg_train_loss = total_train_loss / len(train_loader)

        # Validation
        model.eval()
        val_preds, val_targets = [], []
        total_val_loss = 0.0

        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["labels"].to(device)

                outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
                total_val_loss += outputs.loss.item()

                logits = outputs.logits
                preds = torch.argmax(logits, dim=-1).cpu().numpy()
                val_preds.extend(preds)
                val_targets.extend(labels.cpu().numpy())

        avg_val_loss = total_val_loss / max(1, len(val_loader))
        val_acc = accuracy_score(val_targets, val_preds)
        epoch_time = time.time() - start_time

        logger.info(
            f"Epoch {epoch}/{epochs} ({epoch_time:.1f}s) | "
            f"Train Loss: {avg_train_loss:.4f} | "
            f"Val Loss: {avg_val_loss:.4f} | "
            f"Val Accuracy: {val_acc:.4f}"
        )

        if val_acc >= best_val_accuracy:
            best_val_accuracy = val_acc
            os.makedirs(output_dir, exist_ok=True)
            model.save_pretrained(output_dir)
            tokenizer.save_pretrained(output_dir)
            logger.info(f"Saved best model checkpoint to {output_dir}")

    logger.info(f"Training completed successfully! Best Validation Accuracy: {best_val_accuracy:.4f}")
    return output_dir

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune Transformer Sentiment Model")
    parser.add_argument("--model_name", type=str, default="distilbert-base-uncased", help="Base model checkpoint")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=8, help="Batch size")
    parser.add_argument("--lr", type=float, default=2e-5, help="Learning rate")
    args = parser.parse_args()

    train_model(
        model_name=args.model_name,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr
    )
