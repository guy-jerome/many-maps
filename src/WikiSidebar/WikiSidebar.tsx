// src/WikiSidebar/WikiSidebar.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Link,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  Save,
} from "lucide-react";

import {
  WikiSection,
  WikiCategory,
  MapWiki,
  DEFAULT_WIKI_CATEGORIES,
  getMapWiki,
  createWikiSection,
  updateWikiSection,
  deleteWikiSection,
  PinData,
} from "../idbService";

import "./WikiSidebar.css";

interface WikiSidebarProps {
  mapId: string;
  isOpen: boolean;
  onToggle: () => void;
  pins: PinData[];
  selectedPinLabel?: string | null;
  onPinSelect?: (pinLabel: string) => void;
  onWidthChange?: (width: number) => void;
}

interface EditingSection {
  id?: string;
  title: string;
  content: string;
  category: WikiCategory;
  tags: string[];
  linkedPinIds: string[];
}

const WikiSidebar: React.FC<WikiSidebarProps> = ({
  mapId,
  isOpen,
  onToggle,
  pins,
  selectedPinLabel,
  onPinSelect,
  onWidthChange,
}) => {
  const [wiki, setWiki] = useState<MapWiki | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [editingSection, setEditingSection] = useState<EditingSection | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [width, setWidth] = useState(350);
  const [newTagInput, setNewTagInput] = useState("");

  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Notify parent of width changes
  useEffect(() => {
    if (onWidthChange && isOpen) {
      onWidthChange(width);
    }
  }, [width, onWidthChange, isOpen]);

  // Load wiki data
  useEffect(() => {
    const loadWiki = async () => {
      setLoading(true);
      try {
        const wikiData = await getMapWiki(mapId);
        setWiki(
          wikiData || {
            sections: [],
            categories: DEFAULT_WIKI_CATEGORIES,
            lastModified: new Date(),
          }
        );
      } catch (error) {
        console.error("Error loading wiki:", error);
      } finally {
        setLoading(false);
      }
    };

    if (mapId) {
      loadWiki();
    }
  }, [mapId]);

  // Resizing logic
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const dx = e.clientX - startX.current;
      setWidth(Math.max(250, Math.min(600, startWidth.current + dx)));
    };

    const onUp = () => {
      isResizing.current = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const startCreating = () => {
    setEditingSection({
      title: "",
      content: "",
      category: DEFAULT_WIKI_CATEGORIES[0],
      tags: [],
      linkedPinIds: [],
    });
    setIsCreating(true);
  };

  const startEditing = (section: WikiSection) => {
    setEditingSection({
      id: section.id,
      title: section.title,
      content: section.content,
      category: section.category,
      tags: section.tags || [],
      linkedPinIds: section.linkedPinIds || [],
    });
    setIsCreating(false);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setIsCreating(false);
    setNewTagInput("");
  };

  const saveSection = async () => {
    if (!editingSection || !editingSection.title.trim()) return;

    try {
      if (isCreating) {
        await createWikiSection(
          mapId,
          editingSection.title,
          editingSection.content,
          editingSection.category,
          editingSection.tags,
          editingSection.linkedPinIds
        );
      } else if (editingSection.id) {
        await updateWikiSection(mapId, editingSection.id, {
          title: editingSection.title,
          content: editingSection.content,
          category: editingSection.category,
          tags: editingSection.tags,
          linkedPinIds: editingSection.linkedPinIds,
        });
      }

      // Reload wiki data
      const updatedWiki = await getMapWiki(mapId);
      setWiki(updatedWiki || wiki);
      cancelEditing();
    } catch (error) {
      console.error("Error saving section:", error);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!window.confirm("Are you sure you want to delete this wiki section?"))
      return;

    try {
      await deleteWikiSection(mapId, sectionId);
      const updatedWiki = await getMapWiki(mapId);
      setWiki(updatedWiki || wiki);
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  const addTag = () => {
    if (!editingSection || !newTagInput.trim()) return;

    const tag = newTagInput.trim();
    if (!editingSection.tags.includes(tag)) {
      setEditingSection({
        ...editingSection,
        tags: [...editingSection.tags, tag],
      });
    }
    setNewTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    if (!editingSection) return;

    setEditingSection({
      ...editingSection,
      tags: editingSection.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const togglePinLink = (pinLabel: string) => {
    if (!editingSection) return;

    const isLinked = editingSection.linkedPinIds.includes(pinLabel);
    setEditingSection({
      ...editingSection,
      linkedPinIds: isLinked
        ? editingSection.linkedPinIds.filter((id) => id !== pinLabel)
        : [...editingSection.linkedPinIds, pinLabel],
    });
  };

  // Filter sections based on search and category
  const filteredSections =
    wiki?.sections.filter((section) => {
      const matchesSearch =
        searchQuery === "" ||
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (section.tags &&
          section.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          ));

      const matchesCategory =
        selectedCategory === "all" || section.category.id === selectedCategory;

      return matchesSearch && matchesCategory;
    }) || [];

  // Group sections by category
  const sectionsByCategory = filteredSections.reduce((acc, section) => {
    const categoryId = section.category.id;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(section);
    return acc;
  }, {} as Record<string, WikiSection[]>);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="wiki-toggle-button"
        title="Open Wiki"
      >
        <BookOpen size={20} />
        <span>Wiki</span>
      </button>
    );
  }

  return (
    <>
      {/* Sidebar */}
      <div ref={sidebarRef} className="wiki-sidebar" style={{ width }}>
        {/* Resizer */}
        <div className="wiki-resizer" onMouseDown={handleMouseDown} />

        {/* Header */}
        <div className="wiki-header">
          <div className="wiki-header-content">
            <BookOpen size={20} />
            <h2>Map Wiki</h2>
          </div>
          <div className="wiki-header-actions">
            <button
              onClick={startCreating}
              className="wiki-action-button"
              title="Add new section"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={onToggle}
              className="wiki-action-button"
              title="Close wiki"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="wiki-content">
          {editingSection ? (
            // Edit Form
            <div className="wiki-edit-form">
              <div className="wiki-edit-header">
                <h3>{isCreating ? "Create New Section" : "Edit Section"}</h3>
                <div className="wiki-edit-actions">
                  <button onClick={saveSection} className="wiki-save-button">
                    <Save size={14} />
                    Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="wiki-cancel-button"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                </div>
              </div>

              <div className="wiki-form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editingSection.title}
                  onChange={(e) =>
                    setEditingSection({
                      ...editingSection,
                      title: e.target.value,
                    })
                  }
                  placeholder="Section title..."
                  className="wiki-input"
                />
              </div>

              <div className="wiki-form-group">
                <label>Category</label>
                <select
                  value={editingSection.category.id}
                  onChange={(e) => {
                    const category = DEFAULT_WIKI_CATEGORIES.find(
                      (c) => c.id === e.target.value
                    );
                    if (category) {
                      setEditingSection({
                        ...editingSection,
                        category,
                      });
                    }
                  }}
                  className="wiki-select"
                >
                  {DEFAULT_WIKI_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="wiki-form-group">
                <label>Content</label>
                <textarea
                  value={editingSection.content}
                  onChange={(e) =>
                    setEditingSection({
                      ...editingSection,
                      content: e.target.value,
                    })
                  }
                  placeholder="Write your content here..."
                  className="wiki-textarea"
                  rows={8}
                />
              </div>

              <div className="wiki-form-group">
                <label>Tags</label>
                <div className="wiki-tags">
                  {editingSection.tags.map((tag) => (
                    <span key={tag} className="wiki-tag">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="wiki-tag-remove"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="wiki-tag-input">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                    placeholder="Add tag..."
                    className="wiki-input"
                  />
                  <button onClick={addTag} className="wiki-tag-add">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="wiki-form-group">
                <label>Linked Pins</label>
                <div className="wiki-pin-links">
                  {pins.map((pin) => (
                    <div key={pin.label} className="wiki-pin-link">
                      <label className="wiki-checkbox-label">
                        <input
                          type="checkbox"
                          checked={editingSection.linkedPinIds.includes(
                            pin.label
                          )}
                          onChange={() => togglePinLink(pin.label)}
                        />
                        <span className="wiki-pin-info">
                          <span
                            className="wiki-pin-icon"
                            style={{ color: pin.pinType.color }}
                          >
                            {pin.pinType.icon}
                          </span>
                          {pin.areaName || `Pin ${pin.label}`}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Normal View
            <>
              {/* Search and Filter */}
              <div className="wiki-controls">
                <div className="wiki-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search wiki..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="wiki-search-input"
                  />
                </div>
                <div className="wiki-filter">
                  <Filter size={16} />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="wiki-filter-select"
                  >
                    <option value="all">All Categories</option>
                    {DEFAULT_WIKI_CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sections List */}
              <div className="wiki-sections">
                {loading ? (
                  <div className="wiki-loading">Loading wiki...</div>
                ) : filteredSections.length === 0 ? (
                  <div className="wiki-empty">
                    <BookOpen size={48} />
                    <h3>No wiki sections yet</h3>
                    <p>
                      Create your first section to start building your campaign
                      wiki.
                    </p>
                    <button
                      onClick={startCreating}
                      className="wiki-create-first"
                    >
                      <Plus size={16} />
                      Create Section
                    </button>
                  </div>
                ) : (
                  Object.entries(sectionsByCategory).map(
                    ([categoryId, sections]) => {
                      const category = DEFAULT_WIKI_CATEGORIES.find(
                        (c) => c.id === categoryId
                      );
                      if (!category) return null;

                      return (
                        <div key={categoryId} className="wiki-category">
                          <div className="wiki-category-header">
                            <span
                              className="wiki-category-icon"
                              style={{ color: category.color }}
                            >
                              {category.icon}
                            </span>
                            <span className="wiki-category-name">
                              {category.name}
                            </span>
                            <span className="wiki-category-count">
                              ({sections.length})
                            </span>
                          </div>

                          {sections.map((section) => (
                            <div key={section.id} className="wiki-section">
                              <div className="wiki-section-header">
                                <button
                                  onClick={() => toggleSection(section.id)}
                                  className="wiki-section-toggle"
                                >
                                  {expandedSections.has(section.id) ? (
                                    <ChevronDown size={16} />
                                  ) : (
                                    <ChevronRight size={16} />
                                  )}
                                </button>
                                <h4 className="wiki-section-title">
                                  {section.title}
                                </h4>
                                <div className="wiki-section-actions">
                                  <button
                                    onClick={() => startEditing(section)}
                                    className="wiki-section-action"
                                    title="Edit section"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    onClick={() => deleteSection(section.id)}
                                    className="wiki-section-action wiki-section-delete"
                                    title="Delete section"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              {expandedSections.has(section.id) && (
                                <div className="wiki-section-content">
                                  {section.content && (
                                    <div className="wiki-section-text">
                                      {section.content
                                        .split("\n")
                                        .map((line, i) => (
                                          <p key={i}>{line}</p>
                                        ))}
                                    </div>
                                  )}

                                  {section.tags && section.tags.length > 0 && (
                                    <div className="wiki-section-tags">
                                      {section.tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="wiki-tag-readonly"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {section.linkedPinIds &&
                                    section.linkedPinIds.length > 0 && (
                                      <div className="wiki-section-pins">
                                        <h5>Linked Pins:</h5>
                                        {section.linkedPinIds.map(
                                          (pinLabel) => {
                                            const pin = pins.find(
                                              (p) => p.label === pinLabel
                                            );
                                            if (!pin) return null;

                                            return (
                                              <button
                                                key={pinLabel}
                                                onClick={() =>
                                                  onPinSelect?.(pinLabel)
                                                }
                                                className={`wiki-linked-pin ${
                                                  selectedPinLabel === pinLabel
                                                    ? "active"
                                                    : ""
                                                }`}
                                              >
                                                <span
                                                  className="wiki-pin-icon"
                                                  style={{
                                                    color: pin.pinType.color,
                                                  }}
                                                >
                                                  {pin.pinType.icon}
                                                </span>
                                                {pin.areaName ||
                                                  `Pin ${pin.label}`}
                                                <Link size={12} />
                                              </button>
                                            );
                                          }
                                        )}
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    }
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default WikiSidebar;
