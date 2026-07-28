import React from 'react';
import {
  Box,
  Button as MuiButton,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField as MuiTextField,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import './material-ui.css';

const h = React.createElement;
const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: { main: '#3959c9' },
    background: { default: '#edf1f7' },
  },
  shape: { borderRadius: 9 },
  typography: {
    fontFamily: 'Inter, "Noto Sans JP", system-ui, sans-serif',
  },
});

function Provider({ children }) {
  return h(ThemeProvider, { theme }, children);
}

const Button = React.forwardRef(function MaterialButton({ variant = 'primary', ...props }, ref) {
  const muiVariant = variant === 'quiet' ? 'text' : variant === 'secondary' ? 'outlined' : 'contained';
  return h(MuiButton, {
    ref,
    variant: muiVariant,
    size: 'small',
    disableElevation: true,
    ...props,
  });
});

function TextField({ label, name, value, onChange, type = 'text', placeholder }) {
  return h(MuiTextField, {
    className: 'field-shell mui-field',
    label,
    name,
    value,
    type,
    placeholder,
    size: 'small',
    onChange: (event) => onChange(event.target.value),
  });
}

function SelectField({ label, name, value, onChange, options }) {
  return h(
    FormControl,
    { className: 'field-shell mui-field', size: 'small' },
    h(InputLabel, { id: `${name}-label` }, label),
    h(
      Select,
      {
        labelId: `${name}-label`,
        label,
        name,
        value,
        onChange: (event) => onChange(event.target.value),
      },
      options.map((option) => h(MenuItem, { key: option.value, value: option.value }, option.label)),
    ),
  );
}

function CheckboxField({ label, name, checked, onChange, visuallyCompact = false }) {
  return h(FormControlLabel, {
    className: visuallyCompact ? 'mui-checkbox-compact' : '',
    control: h(Checkbox, {
      name,
      checked,
      size: 'small',
      onChange: (event) => onChange(event.target.checked),
      onKeyDown: (event) => event.stopPropagation(),
      inputProps: visuallyCompact ? { 'aria-label': label } : undefined,
    }),
    label: visuallyCompact ? h('span', { className: 'visually-hidden' }, label) : label,
  });
}

function ModalView({ open, title, description, onClose, children, footer }) {
  return h(
    Dialog,
    { open, onClose, fullWidth: true, maxWidth: 'sm', 'aria-describedby': 'mui-dialog-description' },
    h(DialogTitle, null, title),
    h(
      DialogContent,
      null,
      h(DialogContentText, { id: 'mui-dialog-description', sx: { mb: 2 } }, description),
      children,
    ),
    h(DialogActions, { sx: { px: 3, pb: 2 } }, footer),
  );
}

function Tag({ tone = 'neutral', children }) {
  return h(Chip, {
    size: 'small',
    color: tone === 'critical' ? 'error' : 'default',
    label: children,
  });
}

function DataTable({ rows, selected, onToggle, onOpen, sortDirection, onSort }) {
  const columns = [
    {
      field: 'selection',
      headerName: '選択',
      width: 64,
      sortable: false,
      renderHeader: () => h('span', { className: 'visually-hidden' }, '選択'),
      renderCell: ({ row }) =>
        h(CheckboxField, {
          name: `select-${row.id}`,
          checked: selected.includes(row.id),
          onChange: () => onToggle(row.id),
          label: `${row.id} を選択`,
          visuallyCompact: true,
        }),
    },
    { field: 'id', headerName: 'ID', width: 110 },
    { field: 'title', headerName: '件名', minWidth: 300, flex: 1, sortable: false },
    {
      field: 'priority',
      headerName: `優先度 ${sortDirection === 'asc' ? '↑' : '↓'}`,
      width: 110,
      renderHeader: () => h(Button, { variant: 'quiet', onClick: onSort }, `優先度 ${sortDirection === 'asc' ? '↑' : '↓'}`),
      renderCell: ({ value }) => h(Tag, { tone: value === '緊急' ? 'critical' : 'neutral' }, value),
    },
    { field: 'state', headerName: '状態', width: 105, sortable: false },
    { field: 'owner', headerName: '担当', width: 95, sortable: false },
    {
      field: 'actions',
      headerName: '操作',
      width: 86,
      sortable: false,
      renderCell: ({ row }) =>
        h(Button, {
          variant: 'quiet',
          onClick: (event) => onOpen(row, event.currentTarget),
          'data-testid': `open-${row.id}`,
        }, '詳細'),
    },
  ];
  return h(
    Box,
    { sx: { height: 620, width: '100%' } },
    h(DataGrid, {
      rows,
      columns,
      hideFooter: true,
      disableRowSelectionOnClick: true,
      rowHeight: 48,
      columnHeaderHeight: 48,
      'aria-label': '問い合わせ一覧',
    }),
  );
}

export const adapter = {
  id: 'material-ui',
  name: 'Material UI adapter',
  version: '@mui/material 9.2.0 / @mui/x-data-grid 9.10.1',
  Provider,
  ui: { Button, TextField, SelectField, CheckboxField, Modal: ModalView, DataTable, Tag },
};
