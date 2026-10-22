import React, { useState } from "react";
import {
  Crown,
  Sparkles,
  Check,
  X,
  Zap,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Star,
  FileCheck2,
} from "lucide-react";
import { upgradeCandidatePlan } from "../../services/usageService";
import "./UpgradeModal.css";

export default function UpgradeModal({
  isOpen,
  onClose,
  onUpgraded,
  usageSummary,
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const isPremium = usageSummary?.plan_tier === "PREMIUM";

  const handleAction = async (action) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await upgradeCandidatePlan(action);
      setMessage(res.data?.message || "Plan updated successfully!");
      if (onUpgraded) {
        onUpgraded(res.data?.usage);
      }
      setTimeout(() => {
        setMessage("");
        onClose();
      }, 1500);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Action failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upgrade-modal-backdrop" onClick={onClose}>
      <div
        className="upgrade-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
      >
        <button
          className="upgrade-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="upgrade-modal-header">
          <div className="upgrade-badge">
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Plan & AI Quotas</span>
          </div>
          <h2 id="upgrade-title">
            {isPremium ? "You're on CareerLens Premium" : "Upgrade to CareerLens Premium"}
          </h2>
          <p className="upgrade-subtitle">
            {isPremium
              ? "You have full access to advanced AI CV improvements, ATS keyword scoring, and extended generation quotas."
              : "You've reached or are approaching your free AI quota. Supercharge your job search with powerful AI enhancements."}
          </p>
        </div>

        {message && (
          <div className="upgrade-alert">
            <Sparkles className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        <div className="upgrade-plans-grid">
          {/* Free Tier Card */}
          <div className={`plan-card ${!isPremium ? "plan-active" : ""}`}>
            <div className="plan-header">
              <span className="plan-type">STARTER</span>
              <h3 className="plan-name">Free Plan</h3>
              <div className="plan-price">
                <span className="price-amount">$0</span>
                <span className="price-period">/ forever</span>
              </div>
              <p className="plan-desc">For testing and basic single-CV enhancement.</p>
            </div>
            <ul className="plan-features">
              <li>
                <Check className="feature-icon feature-yes" />
                <span><strong>1</strong> Full AI Resume Analysis</span>
              </li>
              <li>
                <Check className="feature-icon feature-yes" />
                <span><strong>2</strong> AI CV Improvement Operations</span>
              </li>
              <li>
                <Check className="feature-icon feature-yes" />
                <span>Modern, Minimal, & Technical Templates</span>
              </li>
              <li>
                <Check className="feature-icon feature-yes" />
                <span>Unlimited Manual Draft Edits & Restores</span>
              </li>
              <li>
                <Check className="feature-icon feature-yes" />
                <span>Word (.docx) & PDF Export</span>
              </li>
              <li className="feature-dimmed">
                <X className="feature-icon feature-no" />
                <span>Limited to 2 AI generations per CV</span>
              </li>
            </ul>
            <div className="plan-status">
              {!isPremium ? (
                <span className="current-badge">Current Active Plan</span>
              ) : (
                <button
                  type="button"
                  className="btn-downgrade-demo"
                  disabled={loading}
                  onClick={() => handleAction("downgrade")}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Free (Demo)</span>
                </button>
              )}
            </div>
          </div>

          {/* Premium Tier Card */}
          <div className={`plan-card plan-premium ${isPremium ? "plan-active" : ""}`}>
            <div className="popular-ribbon">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>RECOMMENDED</span>
            </div>
            <div className="plan-header">
              <span className="plan-type">PRO CANDIDATE</span>
              <h3 className="plan-name">CareerLens Premium</h3>
              <div className="plan-price">
                <span className="price-amount">$3.99</span>
                <span className="price-period">/ improvement</span>
              </div>
              <p className="plan-desc">Accelerate your career with comprehensive AI tools at $3.99 per improvement operation.</p>
            </div>
            <ul className="plan-features">
              <li>
                <Check className="feature-icon feature-yes" />
                <span><strong>$3.99</strong> per AI CV Improvement Operation</span>
              </li>
              <li>
                <Check className="feature-icon feature-yes" />
                <span><strong>20</strong> Extended AI Improvement Operations</span>
              </li>
              <li>
                <Check className="feature-icon feature-yes" />
                <span><strong>10</strong> Deep Rubric Analyses & Re-evaluations</span>
              </li>
              <li>
                <Check className="feature-icon feature-yes" />
                <span>ATS Target Role Keyword Optimization</span>
              </li>
              <li>
                <Check className="feature-icon feature-yes" />
                <span>Full CV Version History & 1-Click Restore</span>
              </li>
              <li>
                <Check className="feature-icon feature-yes" />
                <span>AI Metric & Quantifiable Impact Polisher</span>
              </li>
              <li>
                <Check className="feature-icon feature-yes" />
                <span>Verified Match Score Boost for Jobs</span>
              </li>
            </ul>
            <div className="plan-status">
              {isPremium ? (
                <div className="active-premium-badge">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Active Premium Membership ($3.99/op)</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-upgrade-action"
                  disabled={loading}
                  onClick={() => handleAction("upgrade")}
                >
                  <Zap className="w-4 h-4" />
                  <span>{loading ? "Activating..." : "Upgrade to Premium ($3.99/improvement)"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="upgrade-modal-footer">
          <div className="prototype-notice">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Prototype Environment: No real payment required. Toggle between plans anytime to test all features.</span>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
