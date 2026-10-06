# Publication research and figure provenance

Checked October 6, 2026 against the six entries on [Google Scholar](https://scholar.google.com/citations?user=JJg7iTMAAAAJ&hl=en). Read the papers' methods, experiments, results, conclusions, and limitations, and inspected the arXiv LaTeX packages. Publisher PDFs take precedence over conflicting Scholar or publisher website metadata. The website summaries are paraphrases, rather than quotations of the abstracts.

## Arabic Safety Alignment as Selective Refusal

[arXiv 2608.29378](https://arxiv.org/abs/2608.29378), version 1, August 29, 2026. The [ArabicNLP accepted-paper list](https://arabicnlp2026.sigarab.org/accepted-papers) confirms acceptance. The PDF byline is Mohamad Zbib and Ammar Mohanna.

Five models and 130 runs are evaluated on the 12,077-prompt human-written AraSafe set. The two axes are benign refusal and harmful-prompt refusal; the latter is not harmful compliance. Refusal-only SFT loses selectivity; mixed SFT supplies useful candidate operating points. DPO and guard effects differ by model and training stage. Selected SFT transfers only partially to Arabizi. Main sweeps use one seed; selected configurations use three. Automatic judge error, uneven mixture coverage, and synthetic cross-form diagnostics bound the results. The paper explicitly lacks a public artifact URL, so no code release is invented.

Thumbnail: Figure 1, `figures/replotted/base_operating_points.pdf` from the arXiv source. Rendered to WebP without replacing plot data or labels.

## TAPS

[arXiv 2603.27027](https://arxiv.org/abs/2603.27027), version 1, March 27, 2026. [Author repository](https://github.com/Moe-Zbeeb/TAPS) and [AUB team page](https://aub-faf.com/) identify the SPIGM workshop at ICML 2026; the team page links the accepted poster record on [OpenReview](https://openreview.net/forum?id=b3M22Zalih). OpenReview required browser verification, so its review content was not inspected.

The PDF lists Mohamad Zbib, Mohamad Bazzi, Ammar Mohanna, Hasan Abed Al Kader Hammoud, and Bernard Ghanem, in that order. The last two are equal advising authors. HASS and EAGLE-2 drafts use a fixed Llama-3-8B-Instruct verifier. Task-matched training specializes; mixed training is not monotonic in mixture size across temperatures. Confidence routing and merged-tree verification outperform averaging specialists in weight space. Merged trees beat the other composition strategies, but not every trained checkpoint in every condition. The metric is acceptance length; the paper does not establish wall-clock latency gains. Appendix correctness arguments retain the lossless verifier distribution under standard acceptance.

Thumbnail: Figure 2b, `figures/routedTrees.png`. Public [models](https://huggingface.co/collections/zbeeb/taps) and [datasets](https://huggingface.co/datasets/zbeeb/TAPS-Datasets) verified.

## AraLingBench

[Published paper](https://aclanthology.org/2026.abjadnlp-1.45/), AbjadNLP workshop at EACL, March 28, 2026, pages 385–393. [arXiv 2511.14295](https://arxiv.org/abs/2511.14295), version 1, November 18, 2025.

The final PDF preserves eight authors: Mohamad Zbib, Hasan Abed Al Kader Hammoud, Sina Mukalled, Nadine Rizk, Fatima Karnib, Issam Lakkis, Ammar Mohanna, and Bernard Ghanem. The first two contributed equally. The Anthology webpage metadata differs from its PDF in names, order, and omission of Issam Lakkis; the PDF byline is used.

150 expert-authored multiple-choice questions cover five categories, with 30 per category, evaluated on 35 models. Syntax and morphology are persistent weaknesses relative to spelling and reading comprehension. Benchmark correlations do not establish memorization or a causal explanation of these weaknesses. Human difficulty labels are not monotonically predictive. The small diagnostic set and multiple-choice format limit coverage, statistical power, and claims about productive competence.

Thumbnail: Figure 1, `samples.pdf` from the source. [Code](https://github.com/hammoudhasan/AraLingBench) and [dataset](https://huggingface.co/datasets/hammh0a/AraLingBench) verified.

## Hala Technical Report

[Published paper](https://aclanthology.org/2026.abjadnlp-1.32/), AbjadNLP workshop at EACL, March 28, 2026, pages 236–244. [arXiv 2509.14008](https://arxiv.org/abs/2509.14008), version 1, September 17, 2025. Final PDF authors: Hasan Abed Al Kader Hammoud, Mohamad Zbib, Bernard Ghanem; the first two contributed equally.

An FP8 teacher bootstraps bilingual supervision for an LFM2-1.2B translator. Translation produces roughly 4.5 million instruction samples; tuning and SLERP merging create 350M, 700M, 1.2B, and 9B models. Six-benchmark average scores improve over the corresponding bases, but individual task scores do not all improve. Claims are bounded by these size buckets and evaluation sets. Larger model scales are outside the study.

Thumbnail: Figure 1, `figure/pipelineHF.png`. The [Hugging Face collection](https://huggingface.co/collections/hammh0a/hala) contains public models and data. The [GitHub repository](https://github.com/hammoudhasan/Hala) is a project overview, so its link is labeled “project,” rather than implying a complete code release.

## Reasoning Vectors

[arXiv 2509.01363](https://arxiv.org/abs/2509.01363), version 1, September 1, 2025. PDF authors: Mohammad Zbeeb, Hasan Abed Al Kader Hammoud, Bernard Ghanem. The first-author asterisk denotes an internship, not equal contribution. Presented as a preprint because an accepted venue was not verified.

The difference between GRPO and SFT donor checkpoints transfers to compatible Qwen2.5 instruction models. Donor/target compatibility requires matching architectures, tokenizers, and sufficiently aligned initialization. Tables distinguish vector-only effects from vector plus “Think step by step” effects. The headline GSM8K and HumanEval gains include prompting; not every vector-only result improves. Subtraction, scale, cross-domain, and perturbation ablations explore the direction's effects. Results are single-run and do not establish statistical significance or universal cross-family transfer.

Thumbnail: Figure 1, `image_mainDrawing.png`. The user's [model collection](https://huggingface.co/collections/zbeeb/reasoning-vectors) contains the 1.5B and 7B vector-enhanced models. No unverified code link is added.

## Specialized Data Synthesis

[arXiv 2411.01929](https://arxiv.org/abs/2411.01929), version 2, November 6, 2024. Journal reference: Journal of Data Analytics and Engineering Decision Making, 1(2), 01–14, 2024. PDF authors: Mohammad Zbeeb, Mohammad Ghorayeb, Mariam Salman.

Numeric network-traffic data is symbolically encoded for next-symbol generation using a WaveNet-inspired model, an RNN, and a Transformer decoder. A one-class SVM assesses generated inliers: 69.2%, 87.9%, and 84.9%, respectively. Inlier detection does not by itself prove distributional equivalence, downstream utility, or a privacy guarantee. The paper also surveys applications, privacy-enhancing techniques, and evaluation approaches. Privacy techniques discussed in the survey are not represented as demonstrated guarantees of the proposed generator.

Thumbnail: Figure 6a, `image1.png`, the learned-symbol latent space. [Author code repository](https://github.com/Moe-Zbeeb/Exploring-the-landscape-for-generative-models-for-specialized-data-generation) verified.

## Site presentation

All six papers are included, newest publication year first. Each uses a real source figure, title linking to its record, bold author identity, precise venue, verified paper/resources, and a native expandable summary. Topic filters follow the reference site's pill controls. The Arabic NLP interest label remains removed from the biography and interests; that earlier edit does not exclude the user's Arabic-related publications from this complete paper list.

Assets are local WebP exports in `assets/images/publications/`, totaling approximately 218 KiB. No generated scientific illustrations or altered scientific results are used.


Display update — October 6, 2026: At the user’s request, the website venue labels for Hala and AraLingBench are EACL 2026. The source provenance above retains the publisher’s exact proceedings information.
