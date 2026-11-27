/**
 * Định dạng ngày YYYY-MM-DD sang DD/MM ngắn gọn cho trục hoành biểu đồ.
 */
export function formatShortDateLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

/**
 * Định dạng ngày YYYY-MM-DD sang DD/MM/YYYY cho Tooltip.
 */
export function formatFullDateLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
