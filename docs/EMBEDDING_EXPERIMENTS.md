# CareerLens — Semantic Embedding Strategy Experiment Report

> **Evaluation Date:** 2026-11-20  
> **Embedding Model:** `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions)  
> **Environment:** Python 3.12 (Local CPU/GPU)

## 1. Executive Summary

This experiment compared two semantic representation architectures for candidate-job relevance matching:
- **Approach A (Section Embeddings):** Generates separate vector embeddings for Skills, Experience/Bio, and Title/Role, calculating individual section similarities.
- **Approach B (Combined Embeddings):** Merges candidate data and job specifications into unified document text strings and computes a single global cosine similarity.

## 2. Experimental Benchmark Results

| Strategy | Pearson Correlation with True Relevance ($r$) | Mean Inference Latency per Pair (ms) | Distinct Features Extracted |
| :--- | :--- | :--- | :--- |
| **Approach A: Section Embeddings** | **0.9737** | 43.62 ms | 3 ($	ext{sim}_{\text{skills}}$, $	ext{sim}_{\text{exp}}$, $	ext{sim}_{\text{title}}$) |
| **Approach B: Combined Embedding** | 0.9513 | 22.03 ms | 1 ($	ext{sim}_{\text{combined}}$) |

## 3. Findings & Architectural Recommendation

1. **Approach A Achieved Higher Correlation:**
   - By isolating technical skills into their own embedding vector, Approach A avoids skill dilution that occurs when skills are buried within long descriptions in Approach B.
   - Section embeddings provide fine-grained signals: a candidate can have high title compatibility but low skill overlap, or high skill overlap with an entry-level title.
2. **Hybrid Synthesis Recommendation:**
   - Rather than treating this as an either/or dilemma, the **CareerLens Feature Pipeline will extract BOTH**:
     - $\text{sim}_{\text{skills}}$: Focuses exclusively on technical vocabulary alignment.
     - $\text{sim}_{\text{exp}}$: Evaluates qualitative narrative alignment.
     - $\text{sim}_{\text{title}}$: Captures role trajectory and hierarchy alignment.
     - $\text{sim}_{\text{combined}}$: Provides a global holistic semantic check.
   - Feeding all four semantic similarity scalars into our supervised ML model allows the algorithm to learn their optimal non-linear weighting automatically!
