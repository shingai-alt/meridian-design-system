import * as React from 'react';
import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button as RegistryButton } from '@/registry/new-york-v4/ui/button';
import { Checkbox } from '@/registry/new-york-v4/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/registry/new-york-v4/ui/dialog';
import { Input } from '@/registry/new-york-v4/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/new-york-v4/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/new-york-v4/ui/table';
import '../../registry-parity/styles.css';

const variantMap = {
  primary: 'default',
  secondary: 'outline',
  quiet: 'ghost',
} as const;

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof RegistryButton> & {
    variant?: keyof typeof variantMap;
  }
>(function ShadcnRegistryButton({ variant = 'primary', type = 'button', ...props }, ref) {
  return (
    <RegistryButton
      ref={ref}
      type={type}
      variant={variantMap[variant]}
      {...props}
    />
  );
});

function TextField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
}) {
  return (
    <label className="field-shell">
      <span className="field-label">{label}</span>
      <Input
        name={name}
        value={value}
        type={type}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="field-shell">
      <span className="field-label" id={`${name}-label`}>{label}</span>
      <Select value={value} onValueChange={onChange} name={name}>
        <SelectTrigger
          className="w-full"
          aria-labelledby={`${name}-label`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CheckboxField({
  label,
  name,
  checked,
  onChange,
  visuallyCompact = false,
}: {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  visuallyCompact?: boolean;
}) {
  return (
    <label className={`checkbox-shell${visuallyCompact ? ' compact' : ''}`}>
      <Checkbox
        name={name}
        checked={checked}
        onCheckedChange={(value) => onChange(Boolean(value))}
        aria-label={visuallyCompact ? label : undefined}
      />
      <span className={visuallyCompact ? 'visually-hidden' : undefined}>{label}</span>
    </label>
  );
}

function ModalView({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type IssueRow = {
  id: string;
  title: string;
  priority: string;
  state: string;
  owner: string;
};

function DataTable({
  rows,
  selected,
  onToggle,
  onOpen,
  sortDirection,
  onSort,
}: {
  rows: IssueRow[];
  selected: string[];
  onToggle: (id: string) => void;
  onOpen: (row: IssueRow, trigger: HTMLButtonElement) => void;
  sortDirection: string;
  onSort: () => void;
}) {
  return (
    <div className="table-scroll">
      <Table aria-label="問い合わせ一覧" className="candidate-table">
        <TableHeader>
          <TableRow>
            <TableHead><span className="visually-hidden">選択</span></TableHead>
            <TableHead>ID</TableHead>
            <TableHead>件名</TableHead>
            <TableHead aria-sort={sortDirection === 'asc' ? 'ascending' : 'descending'}>
              <Button variant="quiet" onClick={onSort}>
                優先度 {sortDirection === 'asc' ? '↑' : '↓'}
              </Button>
            </TableHead>
            <TableHead>状態</TableHead>
            <TableHead>担当</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} data-row-id={row.id}>
              <TableCell>
                <CheckboxField
                  name={`select-${row.id}`}
                  checked={selected.includes(row.id)}
                  onChange={() => onToggle(row.id)}
                  label={`${row.id} を選択`}
                  visuallyCompact
                />
              </TableCell>
              <TableCell><strong>{row.id}</strong></TableCell>
              <TableCell className="title-cell">{row.title}</TableCell>
              <TableCell>
                <Tag tone={row.priority === '緊急' ? 'critical' : 'neutral'}>
                  {row.priority}
                </Tag>
              </TableCell>
              <TableCell>{row.state}</TableCell>
              <TableCell>{row.owner}</TableCell>
              <TableCell>
                <Button
                  variant="quiet"
                  data-testid={`open-${row.id}`}
                  onClick={(event) => onOpen(row, event.currentTarget)}
                >
                  詳細
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Tag({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'critical';
  children: React.ReactNode;
}) {
  return (
    <Badge variant={tone === 'critical' ? 'destructive' : 'secondary'}>
      {children}
    </Badge>
  );
}

export const adapter = {
  id: 'shadcn-ui',
  name: 'shadcn/ui captured registry source adapter',
  version: 'shadcn CLI 4.8.3 / captured new-york-v4 TSX + Tailwind v4',
  implementationFidelity: 'captured-registry-source',
  ui: {
    Button,
    TextField,
    SelectField,
    CheckboxField,
    Modal: ModalView,
    DataTable,
    Tag,
  },
};
