import React, { useState } from "react";
import { Instagram, Mail } from "lucide-react";
import { PageHero, PageScaffold, SectionBand, SurfacePanel, formInputClass, formLabelClass, statusMessageClass } from "../components/PageScaffold";

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");

    if (!formData.fullName || !formData.email || !formData.subject || !formData.message) {
      setStatus("Please fill out every field before sending.");
      return;
    }

    const body = [
      `Name: ${formData.fullName}`,
      `Email: ${formData.email}`,
      "",
      formData.message,
    ].join("\n");

    const mailtoUrl = `mailto:contact.apro.pk@gmail.com?subject=${encodeURIComponent(
      formData.subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoUrl;
    setStatus("Your email app should open with the message filled in.");
  };

  return (
    <PageScaffold>
      <PageHero
        eyebrow="Contact"
        title="Get in touch with APRO."
        description="Reach out for partnerships, questions, or conversations around structured rocketry and aerospace culture in Pakistan."
      />

      <SectionBand className="bg-[linear-gradient(180deg,rgba(12,14,28,0.96),rgba(8,10,18,1))]">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <SurfacePanel className="bg-[linear-gradient(180deg,rgba(18,24,44,0.9),rgba(8,10,18,0.96))]">
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
                <Mail className="h-6 w-6 text-cyan-100" />
              </div>
              <div className="mt-8 text-[11px] uppercase tracking-[0.34em] text-slate-400">Email</div>
              <h3 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">General inquiries</h3>
              <a href="mailto:contact.apro.pk@gmail.com" className="mt-5 block text-base text-slate-200 hover:text-white">
                contact.apro.pk@gmail.com
              </a>
            </SurfacePanel>

            <SurfacePanel className="bg-[linear-gradient(180deg,rgba(31,21,56,0.88),rgba(8,10,18,0.96))]">
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
                <Instagram className="h-6 w-6 text-violet-100" />
              </div>
              <div className="mt-8 text-[11px] uppercase tracking-[0.34em] text-slate-400">Instagram</div>
              <h3 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">Follow APRO</h3>
              <a href="https://www.instagram.com/apro.pk?igsh=OGY1Mmw4ZWI3MXhx" target="_blank" rel="noreferrer" className="mt-5 block text-base text-slate-200 hover:text-white">
                @apro.pk
              </a>
            </SurfacePanel>
          </div>

          <SurfacePanel>
            <h3 className="text-3xl font-bold tracking-[-0.05em] text-white">Send a message</h3>
            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {[
                { label: "Full Name", name: "fullName", type: "text", placeholder: "Your name" },
                { label: "Email Address", name: "email", type: "email", placeholder: "you@example.com" },
                { label: "Subject", name: "subject", type: "text", placeholder: "What is this about?" },
              ].map((field) => (
                <div key={field.name}>
                  <label className={formLabelClass}>{field.label}</label>
                  <input
                    name={field.name}
                    type={field.type}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    className={formInputClass}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
              <div>
                <label className={formLabelClass}>Message</label>
                <textarea
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className={formInputClass}
                  placeholder="Your message"
                />
              </div>
              {status ? <div className={statusMessageClass}>{status}</div> : null}
              <button className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">
                Send message
              </button>
            </form>
          </SurfacePanel>
        </div>
      </SectionBand>
    </PageScaffold>
  );
};

export default Contact;
