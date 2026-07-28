import React from 'react';
import {
  Button as CarbonButton,
  Checkbox,
  Modal as CarbonModal,
  Select,
  SelectItem,
  Tag as CarbonTag,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
} from '@carbon/react';
import '@carbon/styles/css/styles.css';
import './carbon.css';

const h = React.createElement;

const Button = React.forwardRef(function CarbonAdapterButton({ variant = 'primary', ...props }, ref) {
  const kind = variant === 'quiet' ? 'ghost' : variant === 'secondary' ? 'secondary' : 'primary';
  return h(CarbonButton, { ref, kind, size: 'md', ...props });
});

function TextField({ label, name, value, onChange, type = 'text', placeholder }) {
  return h(TextInput, {
    className: 'carbon-field',
    id: name,
    name,
    labelText: label,
    value,
    type,
    placeholder,
    size: 'md',
    onChange: (event) => onChange(event.target.value),
  });
}

function SelectField({ label, name, value, onChange, options }) {
  return h(
    Select,
    {
      className: 'carbon-field',
      id: name,
      name,
      labelText: label,
      value,
      size: 'md',
      onChange: (event) => onChange(event.target.value),
    },
    options.map((option) => h(SelectItem, { key: option.value, value: option.value, text: option.label })),
  );
}

function CheckboxField({ label, name, checked, onChange, visuallyCompact = false }) {
  return h(Checkbox, {
    id: name,
    labelText: visuallyCompact ? h('span', { className: 'visually-hidden' }, label) : label,
    checked,
    onChange: (event, state) => onChange(Boolean(state?.checked ?? event?.target?.checked ?? event)),
  });
}

function ModalView({ open, title, description, onClose, children, footer }) {
  const actions = React.Children.toArray(footer?.props?.children ?? footer);
  const secondary = actions[0];
  const primary = actions[1];
  return h(
    CarbonModal,
    {
      open,
      size: 'sm',
      modalHeading: title,
      modalLabel: 'Meridian browser spike',
      primaryButtonText: primary?.props?.children ?? '実行',
      secondaryButtonText: secondary?.props?.children ?? '閉じる',
      onRequestClose: secondary?.props?.onClick ?? onClose,
      onSecondarySubmit: secondary?.props?.onClick ?? onClose,
      onRequestSubmit: primary?.props?.onClick ?? onClose,
    },
    h('p', { className: 'carbon-modal-description' }, description),
    children,
  );
}

function Tag({ tone = 'neutral', children }) {
  return h(CarbonTag, { type: tone === 'critical' ? 'red' : 'cool-gray', size: 'sm' }, children);
}

function DataTableView({ rows, selected, onToggle, onOpen, sortDirection, onSort }) {
  const headings = ['選択', 'ID', '件名', '優先度', '状態', '担当', '操作'];
  return h(
    TableContainer,
    { className: 'carbon-table-container', title: '', description: '' },
    h(
      Table,
      { 'aria-label': '問い合わせ一覧', size: 'md', useZebraStyles: false },
      h(
        TableHead,
        null,
        h(
          TableRow,
          null,
          headings.map((heading) =>
            h(
              TableHeader,
              { key: heading },
              heading === '優先度'
                ? h(Button, { variant: 'quiet', onClick: onSort }, `優先度 ${sortDirection === 'asc' ? '↑' : '↓'}`)
                : heading,
            ),
          ),
        ),
      ),
      h(
        TableBody,
        null,
        rows.map((row) =>
          h(
            TableRow,
            { key: row.id, 'data-row-id': row.id },
            h(TableCell, null,
              h(CheckboxField, {
                name: `select-${row.id}`,
                checked: selected.includes(row.id),
                onChange: () => onToggle(row.id),
                label: `${row.id} を選択`,
                visuallyCompact: true,
              }),
            ),
            h(TableCell, null, h('strong', null, row.id)),
            h(TableCell, { className: 'title-cell' }, row.title),
            h(TableCell, null, h(Tag, { tone: row.priority === '緊急' ? 'critical' : 'neutral' }, row.priority)),
            h(TableCell, null, row.state),
            h(TableCell, null, row.owner),
            h(TableCell, null,
              h(Button, {
                variant: 'quiet',
                onClick: (event) => onOpen(row, event.currentTarget),
                'data-testid': `open-${row.id}`,
              }, '詳細'),
            ),
          ),
        ),
      ),
    ),
  );
}

export const adapter = {
  id: 'carbon',
  name: 'Carbon Design System adapter',
  version: '@carbon/react 1.112.0 / @carbon/styles 1.111.0',
  ui: { Button, TextField, SelectField, CheckboxField, Modal: ModalView, DataTable: DataTableView, Tag },
};
