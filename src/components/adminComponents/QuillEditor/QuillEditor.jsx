'use client';

import React, { useEffect, useState } from 'react';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
import './QuillEditor.scss';

export default function QuillEditor({
  value = '',
  onChange,
  placeholder = '',
  dir = 'rtl',
  minHeight = '180px',
}) {
  const isRtl = dir === 'rtl';

  const { quill, quillRef } = useQuill({
    theme: 'snow',
    placeholder,
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }, { direction: 'rtl' }],
        [{ color: [] }, { background: [] }],
        ['link', 'clean'],
      ],
    },
  });

  const [initialized, setInitialized] = useState(false);

  // Set initial content once quill is available
  useEffect(() => {
    if (quill && !initialized) {
      if (value) {
        quill.clipboard.dangerouslyPasteHTML(value);
      }
      setInitialized(true);

      quill.on('text-change', () => {
        const html = quill.root.innerHTML;
        const cleaned = html === '<p><br></p>' ? '' : html;
        if (onChange) {
          onChange(cleaned);
        }
      });
    }
  }, [quill, initialized, value, onChange]);

  // Keep synced if value is cleared externally
  useEffect(() => {
    if (quill && initialized) {
      if (!value && quill.root.innerHTML !== '<p><br></p>' && quill.root.innerHTML !== '') {
        quill.setText('');
      }
    }
  }, [value, quill, initialized]);

  return (
    <div
      className={`trendline-quill-wrapper ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}
      dir={dir}
      style={{ '--editor-min-height': minHeight }}
    >
      <div ref={quillRef} />
    </div>
  );
}
