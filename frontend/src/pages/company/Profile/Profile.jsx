import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../context/LanguageContext";
import CompanyProfileCard from "../../../components/company/CompanyProfileCard";
import Input from "../../../components/common/Input";
import Select from "../../../components/common/Select";
import Textarea from "../../../components/common/Textarea";
import Button from "../../../components/common/Button";
import {
  getCurrentCompanyProfile,
  updateCompanyProfile,
} from "../../../services/companyService";
import "./Profile.css";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [companyId, setCompanyId] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const [profile, setProfile] = useState({
    companyName: user?.full_name || "",
    industry: "",
    size: "11-50 employees",
    location: "",
    website: "",
    contactEmail: user?.email || "",
    description: "",
  });

  const [companyLogo, setCompanyLogo] = useState(() => {
    return (
      (user?.id ? localStorage.getItem(`careerlens_company_logo_${user.id}`) : null) ||
      localStorage.getItem("careerlens_company_logo") ||
      ""
    );
  });

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setStatusMsg({ type: "error", text: "Logo image file size must be less than 3MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setCompanyLogo(dataUrl);
      if (user?.id) {
        localStorage.setItem(`careerlens_company_logo_${user.id}`, dataUrl);
      }
      localStorage.setItem("careerlens_company_logo", dataUrl);
      window.dispatchEvent(new CustomEvent("careerlens_profile_image_updated"));
      setStatusMsg({ type: "success", text: t("company.logoUpdated", "Company logo uploaded successfully.") });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCompanyLogo("");
    if (user?.id) {
      localStorage.removeItem(`careerlens_company_logo_${user.id}`);
    }
    localStorage.removeItem("careerlens_company_logo");
    window.dispatchEvent(new CustomEvent("careerlens_profile_image_updated"));
    setStatusMsg({ type: "success", text: t("company.logoRemoved", "Company logo removed.") });
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const comp = await getCurrentCompanyProfile(user?.id);
      if (comp) {
        setCompanyId(comp.id);
        setIsVerified(
          Boolean(comp.is_verified || comp.verification_status === "VERIFIED")
        );
        setProfile({
          companyName: comp.company_name || user?.full_name || "",
          industry: comp.industry || "",
          size: comp.size || comp.company_size || "11-50 employees",
          location: comp.location || "",
          website: comp.website || "",
          contactEmail: comp.user?.email || user?.email || "",
          description:
            comp.description ||
            `${comp.company_name} is an employer in the ${comp.industry || "technology"} sector located in ${comp.location || "Cambodia"}.`,
        });
      }
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to load company profile.",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateField = (event) => {
    setStatusMsg({ type: "", text: "" });
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!companyId) return;
    setSaving(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const payload = {
        company_name: profile.companyName.trim(),
        industry: profile.industry.trim(),
        size: profile.size,
        company_size: profile.size,
        location: profile.location.trim(),
        website: profile.website.trim(),
        email: profile.contactEmail.trim(),
      };
      const res = await updateCompanyProfile(companyId, payload);
      const updated = res.data;
      setProfile((prev) => ({
        ...prev,
        companyName: updated.company_name || prev.companyName,
        industry: updated.industry || "",
        size: updated.size || updated.company_size || prev.size,
        location: updated.location || "",
        website: updated.website || "",
        contactEmail: updated.user?.email || prev.contactEmail,
      }));
      if (refreshUser) await refreshUser();
      setStatusMsg({
        type: "success",
        text: t("company.profileSaved"),
      });
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})?.[0] ||
        t("common.error");
      setStatusMsg({ type: "error", text: String(detail) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>{t("company.companyProfileTitle")}</h1>
          <p>
            {t("company.companyProfileSub")}{" "}
            {companyId !== null && (
              <span
                style={{
                  fontWeight: 600,
                  color: isVerified ? "#16a34a" : "#d97706",
                }}
              >
                ({isVerified ? `✓ ${t("company.verified")}` : t("company.unverified")})
              </span>
            )}
          </p>
        </div>
      </div>

      {statusMsg.text && (
        <div
          style={{
            padding: "12px 16px",
            background: statusMsg.type === "error" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
            color: statusMsg.type === "error" ? "#ef4444" : "#10b981",
            border: `1px solid ${statusMsg.type === "error" ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {loading ? (
        <div className="dashboard-panel" style={{ padding: "32px", textAlign: "center", color: "var(--color-text-secondary, #64748b)" }}>
          {t("common.loading")}
        </div>
      ) : (
        <div className="workspace-split">
          <form className="dashboard-panel" onSubmit={saveProfile}>
            {/* Company Logo Upload Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "24px",
                paddingBottom: "20px",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "14px",
                  border: "2px dashed var(--color-border-strong)",
                  backgroundColor: "var(--color-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt="Company Logo"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-primary, #016BFB)" }}>
                    {profile.companyName ? profile.companyName.charAt(0).toUpperCase() : "C"}
                  </span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--color-text-primary)" }}>
                  {t("company.companyLogo", "Company Logo / Brand Asset")}
                </div>
                <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                  {t("company.logoSpecs", "PNG, JPG, or SVG recommended. Maximum 3MB.")}
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <label
                    htmlFor="company-logo-file-input"
                    className="workspace-button"
                    style={{
                      fontSize: "12px",
                      padding: "5px 14px",
                      minHeight: "32px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>🖼️</span> {t("company.uploadLogo", "Upload Logo")}
                  </label>
                  <input
                    id="company-logo-file-input"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleLogoChange}
                  />
                  {companyLogo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="workspace-button"
                      style={{
                        fontSize: "12px",
                        padding: "5px 12px",
                        minHeight: "32px",
                        color: "#ef4444",
                        borderColor: "rgba(239, 68, 68, 0.3)",
                      }}
                    >
                      {t("common.remove", "Remove")}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="company-profile-grid">
              <Input
                id="companyName"
                name="companyName"
                label={t("company.companyName")}
                value={profile.companyName || ""}
                onChange={updateField}
                required
              />
              <Input
                id="industry"
                name="industry"
                label={t("company.industry")}
                value={profile.industry || ""}
                onChange={updateField}
                required
              />

              <Select
                id="size"
                name="size"
                label={t("company.companySize")}
                value={profile.size || ""}
                onChange={updateField}
                options={[
                  "1-10 employees",
                  "11-50 employees",
                  "51-200 employees",
                  "201-500 employees",
                  "500+ employees",
                  "1-10",
                  "11-50",
                  "51-200",
                  "201-500",
                  "500+",
                ]}
              />
              <Input
                id="location"
                name="location"
                label={t("candidate.location")}
                value={profile.location || ""}
                onChange={updateField}
              />

              <Input
                id="website"
                name="website"
                type="url"
                label={t("company.website")}
                value={profile.website || ""}
                onChange={updateField}
              />
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                label="Email"
                value={profile.contactEmail || ""}
                onChange={updateField}
                required
              />
            </div>

            <Textarea
              id="description"
              name="description"
              label={t("company.companyDescription")}
              value={profile.description || ""}
              onChange={updateField}
              required
            />

            <div
              className="workspace-actions"
              style={{ justifyContent: "flex-end", marginTop: "10px" }}
            >
              <Button type="submit" variant="primary" loading={saving}>
                {t("company.saveCompanyProfile")}
              </Button>
            </div>
          </form>

          <CompanyProfileCard profile={profile} logo={companyLogo} />
        </div>
      )}
    </section>
  );
}