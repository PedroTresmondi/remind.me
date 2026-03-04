/** Presets para "notificar X minutos/horas/dias antes" (ou no horário). */
export const REMINDER_PRESETS = [
  { id: "at_time", label: "No horário", minutesBefore: 0 },
  { id: "10m", label: "10 min antes", minutesBefore: 10 },
  { id: "20m", label: "20 min antes", minutesBefore: 20 },
  { id: "30m", label: "30 min antes", minutesBefore: 30 },
  { id: "1h", label: "1 hora antes", minutesBefore: 60 },
  { id: "1d", label: "1 dia antes", minutesBefore: 24 * 60 },
] as const;

export type ReminderPresetId = (typeof REMINDER_PRESETS)[number]["id"];

/** Dado o horário alvo (ISO), retorna trigger_at para um preset (target - minutesBefore). */
export function getTriggerAtForPreset(targetIso: string, minutesBefore: number): string {
  const d = new Date(targetIso);
  d.setMinutes(d.getMinutes() - minutesBefore);
  return d.toISOString();
}
