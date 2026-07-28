import React from 'react';

const h = React.createElement;

export function createNativeDataTable({ CheckboxField, Button, Tag }) {
  return function NativeDataTable({ rows, selected, onToggle, onOpen, sortDirection, onSort }) {
    return h(
      'div',
      { className: 'table-scroll' },
      h(
        'table',
        { className: 'candidate-table', 'aria-label': '問い合わせ一覧' },
        h(
          'thead',
          null,
          h(
            'tr',
            null,
            h('th', { scope: 'col' }, h('span', { className: 'visually-hidden' }, '選択')),
            h('th', { scope: 'col' }, 'ID'),
            h('th', { scope: 'col' }, '件名'),
            h(
              'th',
              { scope: 'col', 'aria-sort': sortDirection === 'asc' ? 'ascending' : 'descending' },
              h(Button, { variant: 'quiet', onClick: onSort }, `優先度 ${sortDirection === 'asc' ? '↑' : '↓'}`),
            ),
            h('th', { scope: 'col' }, '状態'),
            h('th', { scope: 'col' }, '担当'),
            h('th', { scope: 'col' }, '操作'),
          ),
        ),
        h(
          'tbody',
          null,
          rows.map((row) =>
            h(
              'tr',
              { key: row.id, 'data-row-id': row.id },
              h(
                'td',
                null,
                h(CheckboxField, {
                  name: `select-${row.id}`,
                  checked: selected.includes(row.id),
                  onChange: () => onToggle(row.id),
                  label: `${row.id} を選択`,
                  visuallyCompact: true,
                }),
              ),
              h('td', null, h('strong', null, row.id)),
              h('td', { className: 'title-cell' }, row.title),
              h('td', null, h(Tag, { tone: row.priority === '緊急' ? 'critical' : 'neutral' }, row.priority)),
              h('td', null, row.state),
              h('td', null, row.owner),
              h(
                'td',
                null,
                h(
                  Button,
                  {
                    variant: 'quiet',
                    onClick: (event) => onOpen(row, event.currentTarget),
                    'data-testid': `open-${row.id}`,
                  },
                  '詳細',
                ),
              ),
            ),
          ),
        ),
      ),
    );
  };
}

export function NativeTag({ tone = 'neutral', children }) {
  return h('span', { className: `tag tag-${tone}` }, children);
}

export function NativeTextField({ label, name, value, onChange, type = 'text', placeholder }) {
  return h(
    'label',
    { className: 'field-shell' },
    h('span', { className: 'field-label' }, label),
    h('input', {
      className: 'native-control',
      name,
      value,
      type,
      placeholder,
      onChange: (event) => onChange(event.target.value),
    }),
  );
}

export function NativeSelectField({ label, name, value, onChange, options }) {
  return h(
    'label',
    { className: 'field-shell' },
    h('span', { className: 'field-label' }, label),
    h(
      'select',
      {
        className: 'native-control',
        name,
        value,
        onChange: (event) => onChange(event.target.value),
      },
      options.map((option) => h('option', { key: option.value, value: option.value }, option.label)),
    ),
  );
}
