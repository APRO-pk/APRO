import React from "react";
import { AuthShell, GhostButton, formInputClass, formLabelClass, helperTextClass } from "../components/PageScaffold";

const Resources: React.FC = () => {
  return (
    <AuthShell
      eyebrow="Resource Portal"
      title="Member access layer."
      description="This portal is reserved for approved APRO members. Sign in to continue into protected material and internal resources."
    >
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className={formLabelClass}>APRO ID</label>
          <input type="text" placeholder="Enter your APRO ID" className={formInputClass} />
        </div>

        <div>
          <label className={formLabelClass}>Password</label>
          <input type="password" placeholder="Password" className={formInputClass} />
        </div>

        <button className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">
          Login
        </button>

        <div className={helperTextClass}>Not a member yet?</div>
        <GhostButton to="/membership">Join APRO</GhostButton>
      </form>
    </AuthShell>
  );
};

export default Resources;
