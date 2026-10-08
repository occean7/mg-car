import { Clock3 } from "lucide-react";
import { BRAND } from "@/constants/brand";

export const BusinessHours = ({ testIdPrefix }) => (
  <div data-testid={`${testIdPrefix}-business-hours`}>
    <h3
      data-testid={`${testIdPrefix}-hours-title`}
      className="inline-flex items-center gap-2 font-display text-base font-bold uppercase text-brand-text"
    >
      <Clock3 className="h-4 w-4 shrink-0 text-brand-lime" aria-hidden="true" />
      Horário de funcionamento
    </h3>
    <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm">
      {BRAND.businessHours.map(({ id, label, hours }) => (
        <div key={id} className="contents" data-testid={`${testIdPrefix}-hours-${id}`}>
          <dt data-testid={`${testIdPrefix}-hours-${id}-label`} className="text-brand-muted">{label}</dt>
          <dd data-testid={`${testIdPrefix}-hours-${id}-value`} className="whitespace-nowrap text-right font-medium tabular-nums text-brand-text">{hours}</dd>
        </div>
      ))}
    </dl>
  </div>
);