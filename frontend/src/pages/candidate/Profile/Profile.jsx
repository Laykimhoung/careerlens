import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../hooks/useAuth";
import Input from "../../../components/common/Input";
import Textarea from "../../../components/common/Textarea";
import Button from "../../../components/common/Button";
import {
  getCurrentCandidateProfile,
  updateCandidateProfile,
} from "../../../services/candidateService";
import { updateMeApi } from "../../../services/authService";
import { useLanguage } from "../../../context/LanguageContext";
import "./Profile.css";

export default function CandidateProfile() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();

  const [profileId, setProfileId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const [values, setValues] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    university: "",
    major: "",
    graduation_year: "",
    bio: "",
  });

  const loadProfile = useCallback(async () => {
    setFetching(true);
    try {
      const cand = await getCurrentCandidateProfile(user?.id);
      if (cand) {
        setProfileId(cand.id);
        const u = cand.user || user || {};
        const fullName =
          [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
          u.username ||
          user?.full_name ||
          "";
        setValues({
          full_name: fullName,
          email: u.email || user?.email || "",
          phone: u.phone || "",
          university: cand.university || "",
          major: cand.major || "",
          graduation_year: cand.graduation_year ? String(cand.graduation_year) : "",
          bio: cand.bio || "",
        });
      }
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || "Could not load candidate profile.",
      });
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const initial = values.full_name ? values.full_name.charAt(0).toUpperCase() : "C";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const nameParts = values.full_name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ");

      const payload = {
        first_name: firstName,
        last_name: lastName,
        phone: values.phone.trim(),
        university: values.university.trim(),
        major: values.major.trim(),
        graduation_year: values.graduation_year ? Number(values.graduation_year) : null,
        bio: values.bio.trim(),
      };

      if (profileId) {
        await updateCandidateProfile(profileId, payload);
      } else {
        await updateMeApi({
          first_name: firstName,
          last_name: lastName,
          phone: values.phone.trim(),
        });
      }

      if (refreshUser) {
        await refreshUser();
      }
      await loadProfile();
      setIsEditing(false);
      setStatusMsg({ type: "success", text: "Profile updated and saved to database." });
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})?.[0] ||
        "Failed to save profile changes.";
      setStatusMsg({ type: "error", text: String(detail) });
    } finally {
      setLoading(false);
    }
  };

  const [avatar, setAvatar] = useState(() => {
    return (
      (user?.id ? localStorage.getItem(`careerlens_avatar_${user.id}`) : null) ||
      localStorage.getItem("careerlens_avatar") ||
      ""
    );
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setStatusMsg({ type: "error", text: "Image file size must be less than 3MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setAvatar(dataUrl);
      if (user?.id) {
        localStorage.setItem(`careerlens_avatar_${user.id}`, dataUrl);
      }
      localStorage.setItem("careerlens_avatar", dataUrl);
      window.dispatchEvent(new CustomEvent("careerlens_profile_image_updated"));
      setStatusMsg({ type: "success", text: "Profile photo uploaded successfully." });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar("");
    if (user?.id) {
      localStorage.removeItem(`careerlens_avatar_${user.id}`);
    }
    localStorage.removeItem("careerlens_avatar");
    window.dispatchEvent(new CustomEvent("careerlens_profile_image_updated"));
    setStatusMsg({ type: "success", text: "Profile photo removed." });
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-card__header">
          <div className="profile-card__avatar-wrapper">
            <div className="profile-card__avatar">
              {avatar ? (
                <img
                  src={avatar}
                  alt={values.full_name || "Candidate Avatar"}
                  className="profile-card__avatar-img"
                />
              ) : (
                initial
              )}
            </div>
            <label
              htmlFor="candidate-avatar-input"
              className="profile-card__avatar-edit"
              title="Upload profile photo"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </label>
            <input
              id="candidate-avatar-input"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
          </div>
          <div className="profile-card__info">
            <h2>{values.full_name || "Candidate Profile"}</h2>
            <p>
              {values.major || "Candidate"} &middot;{" "}
              {values.university || "University not set"}
            </p>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <label
                htmlFor="candidate-avatar-input"
                className="workspace-button"
                style={{
                  fontSize: "12px",
                  padding: "4px 12px",
                  minHeight: "30px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>📷</span> {t("candidate.uploadPhoto", "Upload Photo")}
              </label>
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="workspace-button"
                  style={{
                    fontSize: "12px",
                    padding: "4px 10px",
                    minHeight: "30px",
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

        {statusMsg.text && (
          <div
            style={{
              marginBottom: "16px",
              padding: "10px 14px",
              borderRadius: "8px",
              backgroundColor: statusMsg.type === "error" ? "#fef2f2" : "#f0fdf4",
              color: statusMsg.type === "error" ? "#b91c1c" : "#15803d",
              fontSize: "14px",
            }}
          >
            {statusMsg.text}
          </div>
        )}

        {fetching ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
            {t("candidate.loadingProfile", "Loading profile from server...")}
          </div>
        ) : (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-form__grid">
              <Input
                id="full_name"
                label={t("candidate.firstName", "Full Name")}
                value={values.full_name}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
              <Input
                id="email"
                label={t("common.email", "Email Address")}
                value={values.email}
                onChange={handleChange}
                disabled
                required
              />
              <Input
                id="major"
                label={t("candidate.majorField", "Major / Professional Field")}
                value={values.major}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="e.g. Computer Science"
              />
              <Input
                id="phone"
                label={t("common.phone", "Phone Number")}
                value={values.phone}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="+855 12 345 678"
              />
              <Input
                id="university"
                label={t("candidate.universityInstitution", "University / Institution")}
                value={values.university}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="e.g. American University of Phnom Penh"
              />
              <Input
                id="graduation_year"
                label={t("candidate.graduationYear", "Graduation Year")}
                type="number"
                value={values.graduation_year}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="e.g. 2026"
              />
            </div>

            <Textarea
              id="bio"
              label={t("candidate.aboutMe", "About Me")}
              value={values.bio}
              onChange={handleChange}
              disabled={!isEditing}
              rows={5}
              placeholder="Write a short professional bio..."
            />

            <div className="profile-form__actions">
              {!isEditing ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setStatusMsg({ type: "", text: "" });
                    setIsEditing(true);
                  }}
                >
                  {t("candidate.editProfile", "Edit Profile")}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      loadProfile();
                    }}
                    disabled={loading}
                  >
                    {t("common.cancel", "Cancel")}
                  </Button>
                  <Button type="submit" variant="teal" loading={loading}>
                    {t("candidate.saveChanges", "Save Changes")}
                  </Button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}