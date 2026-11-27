export interface TaskFilterValues {
  search: string;
  status: string;
  priority: string;
  from: string;
  to: string;
}

export const DEFAULT_TASK_FILTERS: TaskFilterValues = {
  search: '', status: 'ALL', priority: 'ALL', from: '', to: ''
};

interface Props {
  value: TaskFilterValues;
  onChange: (value: TaskFilterValues) => void;
  onClear: () => void;
}

export function TaskFilters({ value, onChange, onClear }: Props) {
  const set = (key: keyof TaskFilterValues, next: string) => onChange({ ...value, [key]: next });
  return (
    <div className="dashboard-task-filters" role="group" aria-label="Lọc công việc">
      <label>Tìm theo tiêu đề
        <input type="search" value={value.search} onChange={event => set('search', event.target.value)} />
      </label>
      <label>Trạng thái
        <select value={value.status} onChange={event => set('status', event.target.value)}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="TODO">Chưa hoàn thành</option>
          <option value="COMPLETED">Đã hoàn thành</option>
        </select>
      </label>
      <label>Ưu tiên
        <select aria-label="Lọc ưu tiên" value={value.priority} onChange={event => set('priority', event.target.value)}>
          <option value="ALL">Tất cả ưu tiên</option>
          <option value="HIGH">Ưu tiên cao</option>
          <option value="MEDIUM">Ưu tiên vừa</option>
          <option value="LOW">Ưu tiên thấp</option>
        </select>
      </label>
      <label>Hạn từ ngày
        <input type="date" value={value.from} max={value.to || undefined} onChange={event => set('from', event.target.value)} />
      </label>
      <label>Hạn đến ngày
        <input type="date" value={value.to} min={value.from || undefined} onChange={event => set('to', event.target.value)} />
      </label>
      <button type="button" onClick={onClear}>Xóa tất cả bộ lọc</button>
    </div>
  );
}
