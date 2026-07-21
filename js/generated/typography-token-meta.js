"use strict";
/* AUTO-GENERATED from tokens/src/typography.json. */
const TYPE_SCALE=[
  {
    "id": "display",
    "label": "Display",
    "usage": "ページタイトル・product title",
    "description": "ページやproductの最上位タイトル。",
    "fontFamily": [
      "Inter",
      "Noto Sans JP",
      "Hiragino Sans",
      "Yu Gothic",
      "system-ui",
      "sans-serif"
    ],
    "fontSize": "1.75rem",
    "fontWeight": 650,
    "letterSpacing": "0rem",
    "lineHeight": 1.2,
    "token": "--type-display"
  },
  {
    "id": "h1",
    "label": "Heading 1",
    "usage": "画面見出し",
    "description": "画面の主見出し。",
    "fontFamily": [
      "Inter",
      "Noto Sans JP",
      "Hiragino Sans",
      "Yu Gothic",
      "system-ui",
      "sans-serif"
    ],
    "fontSize": "1.5rem",
    "fontWeight": 650,
    "letterSpacing": "0rem",
    "lineHeight": 1.25,
    "token": "--type-h1"
  },
  {
    "id": "h2",
    "label": "Heading 2",
    "usage": "section見出し",
    "description": "大きなsectionの見出し。",
    "fontFamily": [
      "Inter",
      "Noto Sans JP",
      "Hiragino Sans",
      "Yu Gothic",
      "system-ui",
      "sans-serif"
    ],
    "fontSize": "1.1875rem",
    "fontWeight": 600,
    "letterSpacing": "0rem",
    "lineHeight": 1.3,
    "token": "--type-h2"
  },
  {
    "id": "h3",
    "label": "Heading 3",
    "usage": "小section・card見出し",
    "description": "小sectionやcard groupの見出し。",
    "fontFamily": [
      "Inter",
      "Noto Sans JP",
      "Hiragino Sans",
      "Yu Gothic",
      "system-ui",
      "sans-serif"
    ],
    "fontSize": "1rem",
    "fontWeight": 600,
    "letterSpacing": "0rem",
    "lineHeight": 1.4,
    "token": "--type-h3"
  },
  {
    "id": "h4",
    "label": "Heading 4",
    "usage": "compact panel見出し",
    "description": "compactなpanel内の見出し。",
    "fontFamily": [
      "Inter",
      "Noto Sans JP",
      "Hiragino Sans",
      "Yu Gothic",
      "system-ui",
      "sans-serif"
    ],
    "fontSize": "0.875rem",
    "fontWeight": 600,
    "letterSpacing": "0rem",
    "lineHeight": 1.4,
    "token": "--type-h4"
  },
  {
    "id": "h5",
    "label": "Heading 5",
    "usage": "label的見出し",
    "description": "labelに近い最小見出し。",
    "fontFamily": [
      "Inter",
      "Noto Sans JP",
      "Hiragino Sans",
      "Yu Gothic",
      "system-ui",
      "sans-serif"
    ],
    "fontSize": "0.8125rem",
    "fontWeight": 600,
    "letterSpacing": "0rem",
    "lineHeight": 1.4,
    "token": "--type-h5"
  },
  {
    "id": "reading",
    "label": "Reading",
    "usage": "長文・help・documentation",
    "description": "複数paragraphを読む本文。",
    "fontFamily": [
      "Inter",
      "Noto Sans JP",
      "Hiragino Sans",
      "Yu Gothic",
      "system-ui",
      "sans-serif"
    ],
    "fontSize": "1rem",
    "fontWeight": 400,
    "letterSpacing": "0rem",
    "lineHeight": 1.65,
    "token": "--type-reading"
  },
  {
    "id": "body-lg",
    "label": "Body Large",
    "usage": "lead文・設定画面",
    "description": "短いlead文や余裕のある設定画面。",
    "fontFamily": [
      "Inter",
      "Noto Sans JP",
      "Hiragino Sans",
      "Yu Gothic",
      "system-ui",
      "sans-serif"
    ],
    "fontSize": "0.9375rem",
    "fontWeight": 400,
    "letterSpacing": "0rem",
    "lineHeight": 1.6,
    "token": "--type-body-lg"
  },
  {
    "id": "body",
    "label": "Body",
    "usage": "標準UI本文",
    "description": "標準の短いUI本文。",
    "fontFamily": [
      "Inter",
      "Noto Sans JP",
      "Hiragino Sans",
      "Yu Gothic",
      "system-ui",
      "sans-serif"
    ],
    "fontSize": "0.875rem",
    "fontWeight": 400,
    "letterSpacing": "0rem",
    "lineHeight": 1.55,
    "token": "--type-body"
  },
  {
    "id": "body-sm",
    "label": "Body Small",
    "usage": "補助説明",
    "description": "短い補助説明。",
    "fontFamily": [
      "Inter",
      "Noto Sans JP",
      "Hiragino Sans",
      "Yu Gothic",
      "system-ui",
      "sans-serif"
    ],
    "fontSize": "0.8125rem",
    "fontWeight": 400,
    "letterSpacing": "0rem",
    "lineHeight": 1.5,
    "token": "--type-body-sm"
  },
  {
    "id": "label-lg",
    "label": "Label Large",
    "usage": "large control label",
    "description": "大きなcontrolのlabel。",
    "fontFamily": [
      "Inter",
      "Noto Sans JP",
      "Hiragino Sans",
      "Yu Gothic",
      "system-ui",
      "sans-serif"
    ],
    "fontSize": "0.875rem",
    "fontWeight": 550,
    "letterSpacing": "0rem",
    "lineHeight": 1.4,
    "token": "--type-label-lg"
  },
  {
    "id": "label",
    "label": "Label",
    "usage": "button・form label",
    "description": "標準controlとformのlabel。",
    "fontFamily": [
      "Inter",
      "Noto Sans JP",
      "Hiragino Sans",
      "Yu Gothic",
      "system-ui",
      "sans-serif"
    ],
    "fontSize": "0.8125rem",
    "fontWeight": 550,
    "letterSpacing": "0rem",
    "lineHeight": 1.4,
    "token": "--type-label"
  },
  {
    "id": "label-sm",
    "label": "Label Small",
    "usage": "tab・small control",
    "description": "compact controlのlabel。",
    "fontFamily": [
      "Inter",
      "Noto Sans JP",
      "Hiragino Sans",
      "Yu Gothic",
      "system-ui",
      "sans-serif"
    ],
    "fontSize": "0.75rem",
    "fontWeight": 550,
    "letterSpacing": "0rem",
    "lineHeight": 1.4,
    "token": "--type-label-sm"
  },
  {
    "id": "caption",
    "label": "Caption",
    "usage": "metadata・timestamp",
    "description": "短いmetadata。重要情報には使わない。",
    "fontFamily": [
      "Inter",
      "Noto Sans JP",
      "Hiragino Sans",
      "Yu Gothic",
      "system-ui",
      "sans-serif"
    ],
    "fontSize": "0.6875rem",
    "fontWeight": 500,
    "letterSpacing": "0rem",
    "lineHeight": 1.4,
    "token": "--type-caption"
  },
  {
    "id": "code",
    "label": "Code",
    "usage": "code block",
    "description": "code blockの標準本文。",
    "fontFamily": [
      "JetBrains Mono",
      "Geist Mono",
      "IBM Plex Mono",
      "ui-monospace",
      "monospace"
    ],
    "fontSize": "0.8125rem",
    "fontWeight": 400,
    "letterSpacing": "0rem",
    "lineHeight": 1.6,
    "token": "--type-code"
  },
  {
    "id": "code-sm",
    "label": "Code Small",
    "usage": "log・diff",
    "description": "密度の高いlogやdiff。",
    "fontFamily": [
      "JetBrains Mono",
      "Geist Mono",
      "IBM Plex Mono",
      "ui-monospace",
      "monospace"
    ],
    "fontSize": "0.71875rem",
    "fontWeight": 400,
    "letterSpacing": "0rem",
    "lineHeight": 1.6,
    "token": "--type-code-sm"
  },
  {
    "id": "numeric",
    "label": "Numeric",
    "usage": "table数値・metric",
    "description": "比較するtabular numeric data。",
    "fontFamily": [
      "JetBrains Mono",
      "Geist Mono",
      "IBM Plex Mono",
      "ui-monospace",
      "monospace"
    ],
    "fontSize": "0.875rem",
    "fontWeight": 500,
    "letterSpacing": "0rem",
    "lineHeight": 1.4,
    "token": "--type-numeric"
  }
];
