import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../hooks/useAuth";
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
        text: "Company profile saved to database successfully.",
      });
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})?.[0] ||
        "Failed to save company profile.";
      setStatusMsg({ type: "error", text: String(detail) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Company profile</h1>
          <p>
            Manage the information candidates see about your organization.{" "}
            {companyId !== null && (
              <span
                style={{
                  fontWeight: 600,
                  color: isVerified ? "#16a34a" : "#d97706",
                }}
              >
                ({isVerified ? "Verified Employer ✓" : "Pending Admin Verification"})
              </span>
            )}
          </p>
        </div>
      </div>

      {statusMsg.text && (
        <div
          style={{
            padding: "12px 16px",
            background: statusMsg.type === "error" ? "#fef2f2" : "#dcfce7",
            color: statusMsg.type === "error" ? "#b91c1c" : "#15803d",
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
        <div className="dashboard-panel" style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
          Loading company profile...
        </div>
      ) : (
        <div className="workspace-split">
          <form className="dashboard-panel" onSubmit={saveProfile}>
            <div className="company-profile-grid">
              <Input
                id="companyName"
                name="companyName"
                label="Company name"
                value={profile.companyName || ""}
                onChange={updateField}
                required
              />
              <Input
                id="industry"
                name="industry"
                label="Industry"
                value={profile.industry || ""}
                onChange={updateField}
                required
              />

              <Select
                id="size"
                name="size"
                label="Company size"
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
                label="Location"
                value={profile.location || ""}
                onChange={updateField}
              />

              <Input
                id="website"
                name="website"
                type="url"
                label="Website"
                value={profile.website || ""}
                onChange={updateField}
              />
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                label="Recruitment email"
                value={profile.contactEmail || ""}
                onChange={updateField}
                required
              />
            </div>

            <Textarea
              id="description"
              name="description"
              label="About the company"
              value={profile.description || ""}
              onChange={updateField}
              required
            />

            <div
              className="workspace-actions"
              style={{ justifyContent: "flex-end", marginTop: "10px" }}
            >
              <Button type="submit" variant="primary" loading={saving}>
                Save profile
              </Button>
            </div>
          </form>

          <CompanyProfileCard profile={profile} />
        </div>
      )}
    </section>
  );
}