import React, { useState } from 'react';
import { MediaFolder } from '../../lib/api/media';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Edit2,
  Trash2,
  Layers,
  FileQuestion,
  Search,
} from 'lucide-react';

export interface FolderTreeProps {
  folders: MediaFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectOrphans?: () => void;
  isOrphansSelected?: boolean;
  onCreateFolder?: (parentId?: string | null) => void;
  onRenameFolder?: (folder: MediaFolder) => void;
  onDeleteFolder?: (folder: MediaFolder) => void;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  totalAssets?: number;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders = [],
  selectedFolderId,
  onSelectFolder,
  onSelectOrphans,
  isOrphansSelected = false,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
  totalAssets,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [folderSearch, setFolderSearch] = useState('');

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Build folder hierarchy tree from flat array or nested array
  const buildTree = (items: MediaFolder[]): MediaFolder[] => {
    const map = new Map<string, MediaFolder & { children: MediaFolder[] }>();
    const roots: (MediaFolder & { children: MediaFolder[] })[] = [];

    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    items.forEach((item) => {
      const node = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const rootFolders = buildTree(folders);

  // Filter folders if search query present
  const filterTree = (nodes: MediaFolder[]): MediaFolder[] => {
    if (!folderSearch.trim()) return nodes;
    const q = folderSearch.toLowerCase();
    return nodes.reduce<MediaFolder[]>((acc, node) => {
      const matches = node.name.toLowerCase().includes(q) || node.slug.toLowerCase().includes(q);
      const filteredChildren = node.children ? filterTree(node.children) : [];
      if (matches || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
      return acc;
    }, []);
  };

  const displayedRoots = filterTree(rootFolders);

  const renderFolderNode = (folder: MediaFolder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id) || Boolean(folderSearch.trim());
    const isSelected = selectedFolderId === folder.id && !isOrphansSelected;
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <div key={folder.id} className="space-y-0.5">
        <div
          onClick={() => onSelectFolder(folder.id)}
          className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer select-none font-sans ${
            isSelected
              ? 'bg-charcoal-900 text-white font-medium shadow-xs'
              : 'text-charcoal-700 hover:bg-sand-100 hover:text-charcoal-900'
          }`}
          style={{ paddingLeft: `${Math.max(0.5, level * 0.85 + 0.5)}rem` }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(folder.id, e)}
                className={`p-0.5 rounded transition-colors ${
                  isSelected ? 'text-sand-300 hover:text-white' : 'text-charcoal-400 hover:text-charcoal-700'
                }`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-3.5" />
            )}

            {isSelected || isExpanded ? (
              <FolderOpen className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-gold-400' : 'text-gold-600'}`} />
            ) : (
              <Folder className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-gold-400' : 'text-gold-600'}`} />
            )}

            <span className="truncate">{folder.name}</span>
          </div>

          {/* Action trigger menu */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity relative">
            {(canCreate || canUpdate || canDelete) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(activeMenuId === folder.id ? null : folder.id);
                }}
                className={`p-1 rounded ${
                  isSelected ? 'text-sand-300 hover:text-white hover:bg-charcoal-800' : 'text-charcoal-400 hover:text-charcoal-800 hover:bg-sand-200'
                }`}
                title="Folder Actions"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            )}

            {activeMenuId === folder.id && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(null);
                  }}
                />
                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-sand-300 rounded-lg shadow-lg z-30 py-1 font-sans text-xs text-charcoal-800">
                  {canCreate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(null);
                        onCreateFolder?.(folder.id);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-sand-50"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-gold-600" />
                      Add Subfolder
                    </button>
                  )}
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(null);
                        onRenameFolder?.(folder);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-sand-50"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-charcoal-500" />
                      Rename
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(null);
                        onDeleteFolder?.(folder);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-sand-50 text-terracotta-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Folder
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {folder.children!.map((child) => renderFolderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-sand-200 p-3 flex flex-col h-full font-sans select-none">
      {/* Search folders */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-400" />
        <input
          type="text"
          value={folderSearch}
          onChange={(e) => setFolderSearch(e.target.value)}
          placeholder="Filter folders..."
          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-sand-50/80 border border-sand-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gold-500 focus:bg-white"
        />
      </div>

      {/* Static Root Navigation Items */}
      <div className="space-y-0.5 mb-2 pb-2 border-b border-sand-200">
        {/* All Media (Root) */}
        <div
          onClick={() => onSelectFolder(null)}
          className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
            selectedFolderId === null && !isOrphansSelected
              ? 'bg-charcoal-900 text-white font-medium shadow-xs'
              : 'text-charcoal-700 hover:bg-sand-100 hover:text-charcoal-900'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <Layers className={`w-4 h-4 ${selectedFolderId === null && !isOrphansSelected ? 'text-gold-400' : 'text-gold-600'}`} />
            <span className="truncate">All Media Assets</span>
          </div>
          {totalAssets !== undefined && (
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              selectedFolderId === null && !isOrphansSelected ? 'bg-charcoal-800 text-sand-300' : 'bg-sand-100 text-charcoal-500'
            }`}>
              {totalAssets}
            </span>
          )}
        </div>

        {/* Orphans / Unassigned filter */}
        {onSelectOrphans && (
          <div
            onClick={onSelectOrphans}
            className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
              isOrphansSelected
                ? 'bg-charcoal-900 text-white font-medium shadow-xs'
                : 'text-charcoal-700 hover:bg-sand-100 hover:text-charcoal-900'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <FileQuestion className={`w-4 h-4 ${isOrphansSelected ? 'text-amber-400' : 'text-amber-600'}`} />
              <span className="truncate">Orphaned / Unattached</span>
            </div>
          </div>
        )}
      </div>

      {/* Folders Tree Header */}
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">
          Folders ({folders.length})
        </span>
        {canCreate && (
          <button
            type="button"
            onClick={() => onCreateFolder?.(null)}
            className="p-1 rounded text-charcoal-500 hover:text-gold-700 hover:bg-sand-100 transition-colors"
            title="Create Root Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dynamic Nested Folders */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {displayedRoots.length === 0 ? (
          <div className="py-6 text-center text-xs text-charcoal-400">
            {folderSearch ? 'No matching folders' : 'No folders created yet'}
          </div>
        ) : (
          displayedRoots.map((root) => renderFolderNode(root))
        )}
      </div>
    </aside>
  );
};
