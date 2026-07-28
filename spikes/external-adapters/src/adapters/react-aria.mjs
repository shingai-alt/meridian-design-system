import React from 'react';
import {
  Button as AriaButton,
  Cell,
  Checkbox as AriaCheckbox,
  Column,
  Dialog,
  Heading,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Modal,
  ModalOverlay,
  Popover,
  Row,
  Select,
  SelectValue,
  Table,
  TableBody,
  TableHeader,
  TextField as AriaTextField,
} from 'react-aria-components';
import { NativeTag } from './helpers.mjs';
import './react-aria.css';

const h = React.createElement;

const Button = React.forwardRef(function ReactAriaButton({ variant = 'primary', ...props }, ref) {
  return h(AriaButton, { ref, className: `aria-button aria-button-${variant}`, ...props });
});

function TextField({ label, name, value, onChange, type = 'text', placeholder }) {
  return h(
    AriaTextField,
    { className: 'field-shell', name, value, onChange, type },
    h(Label, { className: 'field-label' }, label),
    h(Input, { className: 'aria-input', placeholder }),
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return h(
    Select,
    {
      className: 'field-shell',
      name,
      selectedKey: value,
      onSelectionChange: (key) => onChange(String(key)),
    },
    h(Label, { className: 'field-label' }, label),
    h(AriaButton, { className: 'aria-select-trigger' },
      h(SelectValue),
      h('span', { 'aria-hidden': true }, '▾'),
    ),
    h(
      Popover,
      { className: 'aria-popover' },
      h(
        ListBox,
        { className: 'aria-listbox' },
        options.map((option) =>
          h(ListBoxItem, { id: option.value, key: option.value, className: 'aria-listbox-item' }, option.label),
        ),
      ),
    ),
  );
}

function CheckboxField({ label, name, checked, onChange, visuallyCompact = false }) {
  return h(
    AriaCheckbox,
    {
      className: `checkbox-shell aria-checkbox${visuallyCompact ? ' compact' : ''}`,
      name,
      isSelected: checked,
      onChange,
    },
    h('span', { className: 'aria-checkbox-box', 'aria-hidden': true }, checked ? '✓' : ''),
    h('span', { className: visuallyCompact ? 'visually-hidden' : undefined }, label),
  );
}

function ModalView({ open, title, description, onClose, children, footer }) {
  return h(
    ModalOverlay,
    {
      isOpen: open,
      onOpenChange: (next) => !next && onClose(),
      isDismissable: true,
      className: 'aria-modal-overlay',
    },
    h(
      Modal,
      { className: 'aria-modal' },
      h(
        Dialog,
        { className: 'aria-dialog' },
        ({ close }) =>
          h(
            React.Fragment,
            null,
            h('div', { className: 'dialog-heading' },
              h(Heading, { slot: 'title' }, title),
              h('p', null, description),
            ),
            children,
            h('div', { className: 'dialog-footer' }, footer),
            h(
              AriaButton,
              {
                className: 'dialog-close',
                'aria-label': '閉じる',
                onPress: () => {
                  close();
                  onClose();
                },
              },
              '×',
            ),
          ),
      ),
    ),
  );
}

function DataTable({ rows, selected, onToggle, onOpen, sortDirection, onSort }) {
  return h(
    'div',
    { className: 'table-scroll' },
    h(
      Table,
      { className: 'candidate-table aria-table', 'aria-label': '問い合わせ一覧' },
      h(
        TableHeader,
        null,
        h(Column, { isRowHeader: false }, h('span', { className: 'visually-hidden' }, '選択')),
        h(Column, { isRowHeader: true }, 'ID'),
        h(Column, null, '件名'),
        h(Column, null,
          h(Button, { variant: 'quiet', onPress: onSort }, `優先度 ${sortDirection === 'asc' ? '↑' : '↓'}`),
        ),
        h(Column, null, '状態'),
        h(Column, null, '担当'),
        h(Column, null, '操作'),
      ),
      h(
        TableBody,
        null,
        rows.map((row) =>
          h(
            Row,
            { id: row.id, key: row.id, 'data-row-id': row.id },
            h(Cell, null,
              h(CheckboxField, {
                name: `select-${row.id}`,
                checked: selected.includes(row.id),
                onChange: () => onToggle(row.id),
                label: `${row.id} を選択`,
                visuallyCompact: true,
              }),
            ),
            h(Cell, null, h('strong', null, row.id)),
            h(Cell, { className: 'title-cell' }, row.title),
            h(Cell, null, h(NativeTag, { tone: row.priority === '緊急' ? 'critical' : 'neutral' }, row.priority)),
            h(Cell, null, row.state),
            h(Cell, null, row.owner),
            h(Cell, null,
              h(Button, {
                variant: 'quiet',
                onPress: (event) => onOpen(row, event.target),
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
  id: 'react-aria',
  name: 'React Aria Components adapter',
  version: 'react-aria-components 1.19.0',
  ui: { Button, TextField, SelectField, CheckboxField, Modal: ModalView, DataTable, Tag: NativeTag },
};
