'use client';

import React, { useState, useMemo } from 'react';
import './AdminDataTable.scss';

export default function AdminDataTable({
  title,
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder,
  searchKeys = [],
  primaryAction,
  itemsPerPage = 10,
  lang = 'ar'
}) {
  const isRtl = lang === 'ar';
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) => {
      if (searchKeys.length > 0) {
        return searchKeys.some((k) => String(row[k] || '').toLowerCase().includes(term));
      }
      return Object.values(row).some((val) =>
        String(val || '').toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKeys]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  return (
    <div className="admin-data-table-wrapper">
      {/* Top Bar with Title & Actions */}
      {(title || searchable || primaryAction) && (
        <div className="table-top-bar">
          <div className="table-title-area">
            {title && <h3 className="table-title">{title}</h3>}
            <span className="table-count-badge">
              {filteredData.length} {isRtl ? 'عنصر' : 'items'}
            </span>
          </div>

          <div className="table-actions-area">
            {searchable && (
              <input
                type="text"
                className="table-search-input"
                placeholder={searchPlaceholder || (isRtl ? 'بحث...' : 'Search...')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            )}

            {primaryAction && (
              <button
                type="button"
                className="primary-table-btn"
                onClick={primaryAction.onClick}
              >
                {primaryAction.icon || (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                )}
                <span>{primaryAction.label}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Data */}
      <div className="table-responsive-container">
        <table>
          <thead>
            <tr>
              {columns.map((col, cIdx) => (
                <th key={col.key || cIdx} style={col.width ? { width: col.width } : undefined}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rIdx) => (
                <tr key={row.id || rIdx}>
                  {columns.map((col, cIdx) => (
                    <td key={col.key || cIdx}>
                      {col.render ? col.render(row[col.key], row, rIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  <div className="table-empty-state">
                    <div className="empty-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>
                    <h4>{isRtl ? 'لا توجد بيانات متوفرة' : 'No Data Available'}</h4>
                    <p>{isRtl ? 'لم يتم العثور على أي نتائج تطابق البحث' : 'No records match your criteria'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="table-pagination-footer">
          <div>
            {isRtl
              ? `عرض ${((currentPage - 1) * itemsPerPage) + 1} إلى ${Math.min(currentPage * itemsPerPage, filteredData.length)} من أصل ${filteredData.length}`
              : `Showing ${((currentPage - 1) * itemsPerPage) + 1} to ${Math.min(currentPage * itemsPerPage, filteredData.length)} of ${filteredData.length}`}
          </div>

          <div className="pagination-btn-group">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              {isRtl ? 'السابق' : 'Prev'}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={currentPage === page ? 'active' : ''}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              {isRtl ? 'التالي' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
