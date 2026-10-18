'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FaChevronDown,
  FaCheck,
  FaMagnifyingGlass,
  FaFolderTree,
  FaFolder,
  FaTag,
} from 'react-icons/fa6';
import './CustomSelect.scss';

/**
 * Category & Option Icon / Thumbnail Renderer
 */
export function OptionIconRenderer({
  iconUrl,
  imageUrl,
  icon,
  isSubcategory = false,
  fallback = null,
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="category-item-thumb"
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'cover',
          borderRadius: '4px',
          display: 'block',
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  if (iconUrl) {
    if (typeof iconUrl === 'string' && iconUrl.trim().startsWith('<svg')) {
      return (
        <span
          className="category-item-svg"
          dangerouslySetInnerHTML={{ __html: iconUrl }}
        />
      );
    }
    if (
      typeof iconUrl === 'string' &&
      (iconUrl.startsWith('/') || iconUrl.startsWith('http'))
    ) {
      return (
        <img
          src={iconUrl}
          alt=""
          className="category-item-thumb"
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'cover',
            borderRadius: '4px',
            display: 'block',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
  }

  if (icon) {
    return <span className="category-item-react-icon">{icon}</span>;
  }

  if (fallback) {
    return <span className="category-item-react-icon">{fallback}</span>;
  }

  return (
    <span className="category-item-react-icon">
      {isSubcategory ? (
        <FaFolder style={{ color: '#0284c7' }} />
      ) : (
        <FaFolderTree style={{ color: 'var(--main-color, #0057C2)' }} />
      )}
    </span>
  );
}

/**
 * Advanced Custom Select Dropdown
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'اختر...',
  searchable = false,
  searchPlaceholder = 'ابحث في الخيارات...',
  disabled = false,
  className = '',
  isRtl = true,
  defaultIcon = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, searchable]);

  // Find currently selected option object
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  // Filter options by search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => {
      const label = (opt.label || '').toLowerCase();
      const idBadge = (opt.idBadge || '').toLowerCase();
      return label.includes(q) || idBadge.includes(q);
    });
  }, [options, searchQuery]);

  const handleSelect = (optVal) => {
    onChange(optVal);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`custom-select-wrapper ${className}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Trigger Button */}
      <div
        className={`custom-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={toggleDropdown}
      >
        <div className="trigger-content">
          {selectedOption ? (
            <>
              <div className="trigger-icon-wrap">
                <OptionIconRenderer
                  iconUrl={selectedOption.icon_url}
                  imageUrl={selectedOption.image_url}
                  icon={selectedOption.icon || defaultIcon}
                  isSubcategory={selectedOption.isSubcategory}
                />
              </div>
              <span className="trigger-label">{selectedOption.label}</span>
              {selectedOption.idBadge && (
                <span className="trigger-badge">({selectedOption.idBadge})</span>
              )}
            </>
          ) : (
            <>
              {defaultIcon && (
                <div className="trigger-icon-wrap">{defaultIcon}</div>
              )}
              <span className="trigger-placeholder">{placeholder}</span>
            </>
          )}
        </div>

        <span className={`trigger-arrow ${isOpen ? 'rotate' : ''}`}>
          <FaChevronDown />
        </span>
      </div>

      {/* Floating Dropdown List */}
      {isOpen && (
        <div className="custom-select-dropdown">
          {searchable && (
            <div className="dropdown-search-box">
              <div className="search-inner-wrap">
                <FaMagnifyingGlass className="search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="options-scroll-list">
            {filteredOptions.length === 0 ? (
              <div className="no-options-found">
                <FaMagnifyingGlass style={{ fontSize: '18px', color: '#cbd5e1' }} />
                <span>لا توجد نتائج مطابقة</span>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);

                return (
                  <div
                    key={String(opt.value)}
                    className={`option-item ${isSelected ? 'selected' : ''} ${opt.isSubcategory ? 'is-subcategory' : ''}`}
                    onClick={() => handleSelect(opt.value)}
                  >
                    <div className="option-left">
                      <div className="option-icon-box">
                        <OptionIconRenderer
                          iconUrl={opt.icon_url}
                          imageUrl={opt.image_url}
                          icon={opt.icon || defaultIcon}
                          isSubcategory={opt.isSubcategory}
                        />
                      </div>

                      <div className="option-text-group">
                        <span className="option-title">{opt.label}</span>
                        {opt.idBadge && (
                          <span className="option-id-badge">
                            {opt.idBadge}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="option-right">
                      {opt.badge && (
                        <span className="item-count-badge">{opt.badge}</span>
                      )}
                      {isSelected && (
                        <FaCheck className="selected-check-icon" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
