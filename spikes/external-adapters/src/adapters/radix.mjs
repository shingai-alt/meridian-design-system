import React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Checkbox, Dialog, Select } from 'radix-ui';
import { createNativeDataTable, NativeTag } from './helpers.mjs';
import './radix.css';

const h = React.createElement;

const Button = React.forwardRef(function RadixButton({ variant = 'primary', ...props }, ref) {
  return h('button', {
    ref,
    type: props.type ?? 'button',
    className: `radix-button radix-button-${variant}`,
    ...props,
  });
});

function TextField({ label, name, value, onChange, type = 'text', placeholder }) {
  return h(
    'label',
    { className: 'field-shell' },
    h('span', { className: 'field-label' }, label),
    h('input', {
      className: 'radix-input',
      name,
      value,
      type,
      placeholder,
      onChange: (event) => onChange(event.target.value),
    }),
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return h(
    'div',
    { className: 'field-shell' },
    h('label', { className: 'field-label', id: `${name}-label` }, label),
    h(
      Select.Root,
      { value, onValueChange: onChange, name },
      h(
        Select.Trigger,
        { className: 'radix-select-trigger', 'aria-labelledby': `${name}-label` },
        h(Select.Value),
        h(Select.Icon, { asChild: true }, h(ChevronDown, { size: 16 })),
      ),
      h(
        Select.Portal,
        null,
        h(
          Select.Content,
          { className: 'radix-select-content', position: 'popper' },
          h(
            Select.Viewport,
            null,
            options.map((option) =>
              h(
                Select.Item,
                { className: 'radix-select-item', key: option.value, value: option.value },
                h(Select.ItemText, null, option.label),
                h(Select.ItemIndicator, { className: 'select-indicator' }, h(Check, { size: 15 })),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

function CheckboxField({ label, name, checked, onChange, visuallyCompact = false }) {
  return h(
    'label',
    { className: `checkbox-shell${visuallyCompact ? ' compact' : ''}` },
    h(
      Checkbox.Root,
      {
        className: 'radix-checkbox',
        name,
        checked,
        onCheckedChange: (value) => onChange(Boolean(value)),
      },
      h(Checkbox.Indicator, null, h(Check, { size: 13, strokeWidth: 3 })),
    ),
    h('span', { className: visuallyCompact ? 'visually-hidden' : undefined }, label),
  );
}

function Modal({ open, title, description, onClose, children, footer }) {
  return h(
    Dialog.Root,
    { open, onOpenChange: (next) => !next && onClose() },
    h(
      Dialog.Portal,
      null,
      h(Dialog.Overlay, { className: 'radix-dialog-overlay' }),
      h(
        Dialog.Content,
        { className: 'radix-dialog-content' },
        h('div', { className: 'dialog-heading' },
          h(Dialog.Title, null, title),
          h(Dialog.Description, null, description),
        ),
        children,
        h('div', { className: 'dialog-footer' }, footer),
        h(Dialog.Close, { className: 'dialog-close', 'aria-label': '閉じる' }, h(X, { size: 18 })),
      ),
    ),
  );
}

const DataTable = createNativeDataTable({ CheckboxField, Button, Tag: NativeTag });

export const adapter = {
  id: 'radix-primitives',
  name: 'Radix Primitives adapter',
  version: 'radix-ui 1.6.7',
  ui: { Button, TextField, SelectField, CheckboxField, Modal, DataTable, Tag: NativeTag },
};
