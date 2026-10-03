import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import Input from "../../components/common/Input";
import Textarea from "../../components/common/Textarea";
import Button from "../../components/common/Button";
import "./Profile.css";

export default function CandidateProfile() {
  const { user } = useAuth();
  
  // Local state for the form
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: "+855 12 345 678", // Mock default
    location: "Phnom Penh, Cambodia",
    title: "Junior Software Developer",
    bio: "Passionate software developer with a strong foundation in web technologies. Looking for an opportunity to build scalable applications and learn from experienced teams.",
  });

  const initial = values.full_name ? values.full_name.charAt(0) : "U";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // MOCK API CALL
    setTimeout(() => {
      setLoading(false);
      setIsEditing(false);
      // In a real app, this would also call `setUser(newUserData)` in AuthContext
    }, 1000);
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-card__header">
          <div className="profile-card__avatar-wrapper">
            <div className="profile-card__avatar">{initial}</div>
            <button className="profile-card__avatar-edit" aria-label="Change photo" title="Upload new photo">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width: 16, height: 16}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </button>
          </div>
          <div className="profile-card__info">
            <h2>{values.full_name}</h2>
            <p>{values.title} &middot; {values.location}</p>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-form__grid">
            <Input 
              id="full_name" 
              label="Full Name" 
              value={values.full_name} 
              onChange={handleChange} 
              disabled={!isEditing} 
              required 
            />
            <Input 
              id="email" 
              label="Email Address" 
              value={values.email} 
              onChange={handleChange} 
              disabled // Always disabled, usually changed via a separate secure flow
              required 
            />
            <Input 
              id="title" 
              label="Professional Title" 
              value={values.title} 
              onChange={handleChange} 
              disabled={!isEditing} 
              placeholder="e.g. Frontend Developer"
            />
            <Input 
              id="phone" 
              label="Phone Number" 
              value={values.phone} 
              onChange={handleChange} 
              disabled={!isEditing} 
            />
            <Input 
              id="location" 
              label="Location" 
              value={values.location} 
              onChange={handleChange} 
              disabled={!isEditing} 
            />
          </div>

          <Textarea
            id="bio"
            label="About Me"
            value={values.bio}
            onChange={handleChange}
            disabled={!isEditing}
            rows={5}
            placeholder="Write a short professional bio..."
          />

          <div className="profile-form__actions">
            {!isEditing ? (
              <Button type="button" variant="primary" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="teal" loading={loading}>
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}