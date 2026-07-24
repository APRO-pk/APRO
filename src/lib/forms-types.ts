export type EventStatus = "draft" | "open" | "closed";
export type HeaderType = "text" | "image" | "video" | "model" | "html";
export type Audience = "public" | "members";
export type FieldType =
  | "short_text" | "long_text" | "number" | "slider"
  | "date" | "time" | "datetime"
  | "dropdown" | "checkboxes" | "radio_buttons" | "file_upload";

export interface EventSession {
  date: string;
  startTime: string;
  endTime: string;
}

export interface AdminEvent {
  id: string;
  admin_id: number;
  title: string;
  description: string;
  slug: string;
  event_days: number;
  sessions: EventSession[];
  location: string;
  capacity: number;
  reg_deadline: string | null;
  status: EventStatus;
  audience: Audience;
  header_type: HeaderType;
  header_content: string;
  created_at: string;
  updated_at: string;
}

export interface FormField {
  id: string;
  event_id: string;
  field_type: FieldType;
  label: string;
  placeholder: string;
  required: boolean;
  field_order: number;
  options: string[];
  min: number | null;
  max: number | null;
  step: number | null;
  created_at: string;
}

export interface FormResponse {
  id: string;
  event_id: string;
  respondent_name: string;
  respondent_email: string;
  submitted_at: string;
}

export interface FormFieldResponse {
  id: string;
  response_id: string;
  field_id: string;
  value: any;
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  number: "Number",
  slider: "Slider",
  date: "Date",
  time: "Time",
  datetime: "Date & Time",
  dropdown: "Dropdown",
  checkboxes: "Checkboxes",
  radio_buttons: "Radio Buttons",
  file_upload: "File Upload",
};

export const FIELD_TYPES: FieldType[] = [
  "short_text", "long_text", "number", "slider",
  "date", "time", "datetime",
  "dropdown", "checkboxes", "radio_buttons", "file_upload",
];