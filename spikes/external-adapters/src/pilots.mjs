import React from 'react';

const h = React.createElement;
const longJapanese =
  'プロダクト運用・セキュリティ監査・請求管理を横断して担当する外部共同作業者';

function FieldRow({ ui, row, index, canRemove, onChange, onRemove }) {
  return h(
    'div',
    { className: 'recipient-row', 'data-testid': `recipient-${index}` },
    h(ui.TextField, {
      label: `招待先 ${index + 1}`,
      name: `email-${index}`,
      type: 'email',
      value: row.email,
      onChange: (value) => onChange(row.id, 'email', value),
      placeholder: 'name@example.com',
    }),
    h(ui.SelectField, {
      label: 'ロール',
      name: `role-${index}`,
      value: row.role,
      onChange: (value) => onChange(row.id, 'role', value),
      options: [
        { value: 'viewer', label: '閲覧者' },
        { value: 'editor', label: '編集者' },
        { value: 'admin', label: '管理者' },
      ],
    }),
    h(
      ui.Button,
      {
        variant: 'quiet',
        disabled: !canRemove,
        onClick: () => onRemove(row.id),
        'aria-label': `招待先 ${index + 1} を削除`,
      },
      '削除',
    ),
  );
}

export function TeamInvitation({ ui }) {
  const [rows, setRows] = React.useState([
    { id: 'recipient-1', email: 'aiko@example.com', role: 'editor' },
    { id: 'recipient-2', email: 'blocked@example.com', role: 'viewer' },
  ]);
  const [notify, setNotify] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const reviewButton = React.useRef(null);

  const changeRow = (id, field, value) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  const closeReview = () => {
    setOpen(false);
    window.setTimeout(() => reviewButton.current?.focus(), 100);
  };
  const send = () => {
    setResult({
      successful: rows.filter((row) => !row.email.includes('blocked')),
      failed: rows.filter((row) => row.email.includes('blocked')),
    });
    closeReview();
  };

  return h(
    'main',
    { className: 'pilot-page', 'aria-labelledby': 'page-title' },
    h(
      'section',
      { className: 'page-heading' },
      h('div', null,
        h('p', { className: 'eyebrow' }, 'Team management / staged invitation'),
        h('h1', { id: 'page-title' }, 'メンバーをまとめて招待'),
        h('p', { className: 'lede' }, longJapanese),
      ),
      h('span', { className: 'count-chip' }, `${rows.length} 件`),
    ),
    result &&
      h(
        'section',
        {
          className: result.failed.length ? 'result-panel result-warning' : 'result-panel result-success',
          role: 'status',
          'aria-live': 'polite',
          'data-testid': 'invitation-result',
        },
        h('strong', null, `${result.successful.length} 件を招待しました`),
        result.failed.length
          ? h('p', null, `${result.failed.length} 件はドメインポリシーにより送信できませんでした。入力内容は保持されています。`)
          : h('p', null, 'すべての招待を送信しました。'),
      ),
    h(
      'section',
      { className: 'surface-card', 'aria-labelledby': 'recipients-title' },
      h(
        'div',
        { className: 'section-heading' },
        h('div', null,
          h('h2', { id: 'recipients-title' }, '招待するメンバー'),
          h('p', null, '送信前に一覧で権限と通知内容を確認できます。'),
        ),
        h(
          ui.Button,
          {
            variant: 'secondary',
            onClick: () =>
              setRows((current) => [
                ...current,
                { id: `recipient-${Date.now()}`, email: '', role: 'viewer' },
              ]),
            'data-testid': 'add-recipient',
          },
          '招待先を追加',
        ),
      ),
      h(
        'div',
        { className: 'recipient-list' },
        rows.map((row, index) =>
          h(FieldRow, {
            key: row.id,
            ui,
            row,
            index,
            canRemove: rows.length > 1,
            onChange: changeRow,
            onRemove: (id) => setRows((current) => current.filter((entry) => entry.id !== id)),
          }),
        ),
      ),
      h(ui.CheckboxField, {
        name: 'notify',
        checked: notify,
        onChange: setNotify,
        label: '招待メールで権限と参加方法を通知する',
      }),
      h(
        'div',
        { className: 'page-actions' },
        h(ui.Button, { variant: 'quiet' }, '下書きを保存'),
        h(
          ui.Button,
          {
            ref: reviewButton,
            onClick: () => setOpen(true),
            'data-testid': 'review-invitations',
          },
          '送信内容を確認',
        ),
      ),
    ),
    h(
      ui.Modal,
      {
        open,
        title: '招待内容を確認',
        description: '送信後も失敗した宛先は編集可能な状態で保持されます。',
        onClose: closeReview,
        footer: h(
          React.Fragment,
          null,
          h(ui.Button, { variant: 'secondary', onClick: closeReview, 'data-testid': 'cancel-review' }, '戻って編集'),
          h(ui.Button, { onClick: send, 'data-testid': 'confirm-invitations' }, `${rows.length} 件を招待`),
        ),
      },
      h(
        'ul',
        { className: 'review-list' },
        rows.map((row) =>
          h('li', { key: row.id },
            h('span', null, row.email || '未入力'),
            h('strong', null, row.role),
          ),
        ),
      ),
      h('p', null, notify ? '参加方法をメールで通知します。' : '通知メールは送信しません。'),
    ),
  );
}

const priorities = ['緊急', '高', '中', '低'];
const states = ['未対応', '調査中', '回答待ち', '解決済み'];
const issues = Array.from({ length: 200 }, (_, index) => ({
  id: `ISS-${String(index + 1).padStart(4, '0')}`,
  title:
    index % 13 === 0
      ? `${longJapanese}から届いた、監査ログの保持期間とエクスポート権限に関する問い合わせ`
      : `顧客環境で報告された運用課題 ${index + 1}`,
  priority: priorities[index % priorities.length],
  state: states[index % states.length],
  owner: ['田中', '佐藤', '未割当', '鈴木'][index % 4],
}));

export function IssueTriage({ ui }) {
  const [query, setQuery] = React.useState('');
  const [sortDirection, setSortDirection] = React.useState('asc');
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [density, setDensity] = React.useState('comfortable');
  const [detail, setDetail] = React.useState(null);
  const detailButton = React.useRef(null);

  const filtered = issues
    .filter((issue) => `${issue.id} ${issue.title} ${issue.owner}`.toLowerCase().includes(query.toLowerCase()))
    .toSorted((a, b) => {
      const delta = priorities.indexOf(a.priority) - priorities.indexOf(b.priority);
      return sortDirection === 'asc' ? delta : -delta;
    });
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const closeDetail = () => {
    setDetail(null);
    window.setTimeout(() => detailButton.current?.focus(), 100);
  };
  const toggleSelection = (id) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );

  return h(
    'main',
    { className: 'pilot-page triage-page', 'aria-labelledby': 'page-title' },
    h(
      'section',
      { className: 'page-heading' },
      h('div', null,
        h('p', { className: 'eyebrow' }, 'Issue operations / triage queue'),
        h('h1', { id: 'page-title' }, '問い合わせトリアージ'),
        h('p', { className: 'lede' }, '優先度、担当、状態を横断して判断し、詳細を失わずに次の処理へ進めます。'),
      ),
      h('span', { className: 'count-chip', 'aria-live': 'polite' }, `${filtered.length} / 200 件`),
    ),
    h(
      'section',
      { className: 'surface-card collection-card' },
      h(
        'div',
        { className: 'collection-toolbar' },
        h(ui.TextField, {
          label: '問い合わせを検索',
          name: 'issue-search',
          type: 'search',
          value: query,
          onChange: (value) => {
            setQuery(value);
            setPage(1);
          },
          placeholder: 'ID、件名、担当者',
        }),
        h(ui.SelectField, {
          label: '表示密度',
          name: 'density',
          value: density,
          onChange: setDensity,
          options: [
            { value: 'comfortable', label: '標準' },
            { value: 'compact', label: 'コンパクト' },
          ],
        }),
        h(
          ui.Button,
          {
            variant: 'secondary',
            onClick: () => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc')),
            'data-testid': 'sort-priority',
          },
          `優先度 ${sortDirection === 'asc' ? '↑' : '↓'}`,
        ),
      ),
      selected.length > 0 &&
        h(
          'div',
          { className: 'batch-bar', role: 'status' },
          h('strong', null, `${selected.length} 件を選択中`),
          h(ui.Button, { variant: 'secondary', onClick: () => setSelected([]) }, '選択解除'),
        ),
      h(
        'div',
        { className: `desktop-collection table-density-${density}`, 'data-total-rows': filtered.length },
        h(ui.DataTable, {
          rows: visibleRows,
          selected,
          onToggle: toggleSelection,
          onOpen: (row, button) => {
            detailButton.current = button;
            setDetail(row);
          },
          sortDirection,
          onSort: () => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc')),
        }),
      ),
      h(
        'div',
        { className: 'mobile-collection', 'data-total-rows': filtered.length },
        visibleRows.map((row) =>
          h(
            'article',
            { className: 'issue-card', key: row.id },
            h('div', { className: 'issue-card-heading' },
              h(ui.CheckboxField, {
                name: `mobile-${row.id}`,
                checked: selected.includes(row.id),
                onChange: () => toggleSelection(row.id),
                label: `選択 ${row.id}`,
                visuallyCompact: true,
              }),
              h('strong', null, row.id),
              h(ui.Tag, { tone: row.priority === '緊急' ? 'critical' : 'neutral' }, row.priority),
            ),
            h('h2', null, row.title),
            h('dl', null,
              h('div', null, h('dt', null, '状態'), h('dd', null, row.state)),
              h('div', null, h('dt', null, '担当'), h('dd', null, row.owner)),
            ),
            h(ui.Button, {
              variant: 'secondary',
              onClick: (event) => {
                detailButton.current = event.currentTarget;
                setDetail(row);
              },
              'data-testid': `open-${row.id}`,
            }, '詳細を開く'),
          ),
        ),
      ),
      h(
        'nav',
        { className: 'pagination', 'aria-label': '問い合わせページ' },
        h(ui.Button, { variant: 'quiet', disabled: page <= 1, onClick: () => setPage((value) => value - 1) }, '前へ'),
        h('span', { 'aria-live': 'polite', dir: 'ltr' }, `${page} / ${pageCount}`),
        h(ui.Button, { variant: 'quiet', disabled: page >= pageCount, onClick: () => setPage((value) => value + 1), 'data-testid': 'next-page' }, '次へ'),
      ),
    ),
    h(
      ui.Modal,
      {
        open: Boolean(detail),
        title: detail?.id ?? '問い合わせ詳細',
        description: detail?.title ?? '',
        onClose: closeDetail,
        footer: h(
          React.Fragment,
          null,
          h(ui.Button, { variant: 'secondary', onClick: closeDetail }, '閉じる'),
          h(ui.Button, { onClick: closeDetail }, '調査を開始'),
        ),
      },
      detail &&
        h('dl', { className: 'detail-list' },
          h('div', null, h('dt', null, '優先度'), h('dd', null, detail.priority)),
          h('div', null, h('dt', null, '状態'), h('dd', null, detail.state)),
          h('div', null, h('dt', null, '担当'), h('dd', null, detail.owner)),
        ),
    ),
  );
}
