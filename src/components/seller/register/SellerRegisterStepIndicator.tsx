const steps = [
  { id: 1, label: "Account" },
  { id: 2, label: "Shop details" },
  { id: 3, label: "Done" },
] as const;

export function SellerRegisterStepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Registration progress" className="mb-10">
      <ol className="flex items-center justify-center gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <li key={step.id} className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    done || active
                      ? "bg-brand-600 text-white"
                      : "bg-zinc-200 text-zinc-500"
                  }`}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? "✓" : step.id}
                </span>
                <span
                  className={`hidden text-sm font-medium sm:inline ${
                    active ? "text-zinc-900" : "text-zinc-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <span
                  className={`h-px w-6 sm:w-10 ${done ? "bg-brand-600" : "bg-zinc-200"}`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
