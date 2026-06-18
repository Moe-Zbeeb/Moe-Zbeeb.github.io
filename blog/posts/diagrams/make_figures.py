"""Generate cozy, warm-toned figures for the info-theory blog post."""
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch
from matplotlib import font_manager

# ---- Cozy palette --------------------------------------------------------
CREAM      = "#fffff8"   # Tufte page / figure background
PAPER      = "#fffff8"   # plot area matches the page
INK        = "#3a3631"   # warm near-black for text/axes
GRID       = "#e6e1cf"   # soft tan gridlines
TERRACOTTA = "#D9774B"   # primary warm accent
SAGE       = "#7C9473"   # muted green secondary
GOLD       = "#E0A458"   # warm gold
PLUM       = "#9E6B7B"   # dusty rose/plum
TEAL       = "#5E8B8B"   # soft teal

plt.rcParams.update({
    "figure.facecolor": CREAM,
    "axes.facecolor": PAPER,
    "savefig.facecolor": CREAM,
    "font.family": "serif",
    "font.serif": ["Georgia", "DejaVu Serif", "Times New Roman"],
    "font.size": 13,
    "text.color": INK,
    "axes.edgecolor": INK,
    "axes.labelcolor": INK,
    "xtick.color": INK,
    "ytick.color": INK,
    "axes.linewidth": 1.1,
    "grid.color": GRID,
    "grid.linewidth": 0.9,
    "legend.frameon": True,
    "legend.facecolor": PAPER,
    "legend.edgecolor": GRID,
})


def style(ax):
    ax.grid(True, alpha=0.7)
    ax.set_axisbelow(True)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    for s in ("left", "bottom"):
        ax.spines[s].set_color(INK)


# ---- 1. Information content  I(p) = -log(p) ------------------------------
def fig_information():
    p = np.linspace(0.001, 1, 500)
    fig, ax = plt.subplots(figsize=(7.2, 5.2))
    style(ax)
    ax.plot(p, -np.log2(p), color=TERRACOTTA, lw=3, solid_capstyle="round")
    ax.fill_between(p, -np.log2(p), color=TERRACOTTA, alpha=0.10)

    ax.scatter([1], [0], s=70, color=SAGE, zorder=5, edgecolor=PAPER, lw=1.5)
    ax.annotate("certain event\ncarries no surprise",
                xy=(1, 0), xytext=(0.62, 1.6),
                ha="center", color=INK, fontsize=11.5,
                arrowprops=dict(arrowstyle="->", color=SAGE, lw=1.6,
                                connectionstyle="arc3,rad=-0.25"))
    ax.annotate("rare events\nsurprise us most",
                xy=(0.06, -np.log2(0.06)), xytext=(0.40, 3.7),
                ha="center", color=INK, fontsize=11.5,
                arrowprops=dict(arrowstyle="->", color=TERRACOTTA, lw=1.6,
                                connectionstyle="arc3,rad=0.25"))

    ax.set_xlim(0, 1.02)
    ax.set_ylim(0, 5)
    ax.set_xlabel("probability of the event  $p$")
    ax.set_ylabel("information content  $-\\log_2 p$  (bits)")
    ax.set_title("How much surprise does an outcome carry?",
                 fontsize=15, color=INK, pad=12, weight="bold")
    fig.tight_layout()
    fig.savefig("graph1.png", dpi=160)
    plt.close(fig)


# ---- 2. Binary entropy  H(p) ---------------------------------------------
def fig_entropy():
    p = np.linspace(1e-6, 1 - 1e-6, 600)
    H = -p * np.log2(p) - (1 - p) * np.log2(1 - p)
    fig, ax = plt.subplots(figsize=(7.2, 5.2))
    style(ax)
    ax.plot(p, H, color=SAGE, lw=3, solid_capstyle="round")
    ax.fill_between(p, H, color=SAGE, alpha=0.12)

    ax.axvline(0.5, color=GOLD, ls="--", lw=1.6, alpha=0.9)
    ax.scatter([0.5], [1.0], s=70, color=GOLD, zorder=5, edgecolor=PAPER, lw=1.5)
    ax.annotate("max uncertainty\n(1 full bit)",
                xy=(0.5, 1.0), xytext=(0.5, 0.55),
                ha="center", color=INK, fontsize=11.5,
                arrowprops=dict(arrowstyle="->", color=GOLD, lw=1.6))
    ax.annotate("near-certain:\nlittle to encode",
                xy=(0.04, -0.04*np.log2(0.04)-(0.96)*np.log2(0.96)),
                xytext=(0.20, 0.78), ha="center", color=INK, fontsize=11,
                arrowprops=dict(arrowstyle="->", color=TERRACOTTA, lw=1.5,
                                connectionstyle="arc3,rad=0.2"))

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1.08)
    ax.set_xlabel("probability of outcome  $p$")
    ax.set_ylabel("entropy  $H(p)$  (bits)")
    ax.set_title("Entropy of a coin: flattest when most uncertain",
                 fontsize=15, color=INK, pad=12, weight="bold")
    fig.tight_layout()
    fig.savefig("entropy.png", dpi=160)
    plt.close(fig)


# ---- 3. Optimal coding scheme (bit lengths) ------------------------------
def fig_coding():
    labels = ["Full-timer", "Part-timer", "Contractor"]
    probs = np.array([0.70, 0.22, 0.08])
    bits = -np.log2(probs)
    colors = [TERRACOTTA, GOLD, PLUM]

    fig, ax = plt.subplots(figsize=(7.2, 5.0))
    style(ax)
    bars = ax.bar(labels, bits, color=colors, width=0.6,
                  edgecolor=PAPER, linewidth=2, zorder=3)
    for b, p, bit in zip(bars, probs, bits):
        ax.text(b.get_x() + b.get_width()/2, bit + 0.12,
                f"{bit:.1f} bits", ha="center", va="bottom",
                fontsize=12, color=INK, weight="bold")
        ax.text(b.get_x() + b.get_width()/2, 0.18,
                f"p = {p:.2f}", ha="center", va="bottom",
                fontsize=11, color=PAPER, weight="bold")

    ax.set_ylim(0, max(bits) + 0.9)
    ax.set_ylabel("optimal code length  $-\\log_2 p$  (bits)")
    ax.set_title("Common outcomes deserve shorter codes",
                 fontsize=15, color=INK, pad=12, weight="bold")
    ax.grid(axis="x", visible=False)
    fig.tight_layout()
    fig.savefig("coding.png", dpi=160)
    plt.close(fig)


# ---- 4. Cross-entropy & KL: true vs believed distribution ----------------
def fig_kl():
    cats = ["A", "B", "C", "D"]
    y = np.array([0.50, 0.25, 0.15, 0.10])      # true
    yp = np.array([0.25, 0.25, 0.25, 0.25])     # belief (uniform)
    H = -np.sum(y * np.log2(y))
    Hcross = -np.sum(y * np.log2(yp))
    kl = Hcross - H

    x = np.arange(len(cats))
    w = 0.38
    fig, ax = plt.subplots(figsize=(7.2, 5.0))
    style(ax)
    ax.bar(x - w/2, y, w, label="true  $y$", color=TERRACOTTA,
           edgecolor=PAPER, linewidth=1.8, zorder=3)
    ax.bar(x + w/2, yp, w, label="belief  $y'$", color=TEAL,
           edgecolor=PAPER, linewidth=1.8, zorder=3)

    ax.set_xticks(x)
    ax.set_xticklabels(cats)
    ax.set_ylim(0, 0.62)
    ax.set_xlabel("outcome")
    ax.set_ylabel("probability")
    ax.legend(loc="upper right")
    ax.set_title("KL divergence = the extra bits of a wrong belief",
                 fontsize=15, color=INK, pad=12, weight="bold")

    txt = (f"$H(y)$ = {H:.2f} bits\n"
           f"$H(y,y')$ = {Hcross:.2f} bits\n"
           f"$D_{{KL}}$ = {kl:.2f} bits")
    ax.text(0.30, 0.97, txt, transform=ax.transAxes, va="top", ha="left",
            fontsize=11.5, color=INK,
            bbox=dict(boxstyle="round,pad=0.5", facecolor=PAPER,
                      edgecolor=GOLD, linewidth=1.4))
    ax.grid(axis="x", visible=False)
    fig.tight_layout()
    fig.savefig("cross-entropy-kl.png", dpi=160)
    plt.close(fig)


# ---- 5. Mutual information Venn diagram ----------------------------------
def fig_mutual():
    fig, ax = plt.subplots(figsize=(7.2, 4.8))
    ax.set_facecolor(CREAM)
    fig.patch.set_facecolor(CREAM)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis("off")

    cx_l, cx_r, cy, r = 3.9, 6.1, 3.0, 2.05
    cL = Circle((cx_l, cy), r, facecolor=TERRACOTTA, alpha=0.45,
                edgecolor=TERRACOTTA, lw=2)
    cR = Circle((cx_r, cy), r, facecolor=TEAL, alpha=0.45,
                edgecolor=TEAL, lw=2)
    ax.add_patch(cL)
    ax.add_patch(cR)

    ax.text(2.7, cy, "$H(X\\mid Y)$", ha="center", va="center",
            fontsize=13, color=INK)
    ax.text(7.3, cy, "$H(Y\\mid X)$", ha="center", va="center",
            fontsize=13, color=INK)
    ax.text(5.0, cy, "$I(X;Y)$", ha="center", va="center",
            fontsize=14, color=INK, weight="bold")

    ax.text(cx_l, cy + r + 0.35, "$H(X)$", ha="center", color=TERRACOTTA,
            fontsize=14, weight="bold")
    ax.text(cx_r, cy + r + 0.35, "$H(Y)$", ha="center", color=TEAL,
            fontsize=14, weight="bold")

    ax.text(5.0, 0.55, "shared information shrinks to zero when $X$ and $Y$ are independent",
            ha="center", color=INK, fontsize=11, style="italic")
    ax.set_title("Mutual information: what two variables share",
                 fontsize=15, color=INK, pad=4, weight="bold")
    fig.tight_layout()
    fig.savefig("mutual-info.png", dpi=160)
    plt.close(fig)


if __name__ == "__main__":
    fig_information()
    fig_entropy()
    fig_coding()
    fig_kl()
    fig_mutual()
    print("done")
