import Select from "../common/Select";
import "./ApplicationStatus.css";

const statuses = ["Applied", "Reviewing", "Interview", "Offered", "Rejected"];

export default function ApplicationStatus({ status, onChange }) {
  return (
    <Select
      id="application-status"
      label="Application status"
      value={status}
      onChange={(event) => onChange?.(event.target.value)}
      options={statuses}
    />
  );
}