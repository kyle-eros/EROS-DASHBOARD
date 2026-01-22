/**
 * @file availability-calendar.tsx
 * @description Creator availability calendar component
 * @layer UI/Component
 * @status PLACEHOLDER - Future feature
 *
 * This component will show creator availability for scheduling.
 */

'use client';

interface AvailabilityCalendarProps {
  creatorId: string;
}

export function AvailabilityCalendar({ creatorId }: AvailabilityCalendarProps) {
  // TODO: Implement calendar view
  return (
    <div className="rounded-lg border p-4">
      <p className="text-center text-muted-foreground">
        Calendar view coming soon
      </p>
    </div>
  );
}
