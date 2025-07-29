import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PokerMatrix, getCombinations, TOTAL_POKER_COMBINATIONS } from "./PokerMatrix"; // Import helpers
import { Plus, Palette, Trash2, Copy, SlidersHorizontal } from "lucide-react"; // Added Copy and SlidersHorizontal
import { cn } from "@/lib/utils";
import { useRangeContext, ActionButton } from "@/contexts/RangeContext";
import { CreateActionButtonDialog } from "./CreateActionButtonDialog"; // Import the new dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog"; // Import Dialog components, including DialogFooter
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"; // Import Accordion components

interface Range {
  id: string;
  name: string;
  hands: Record<string, string>;
}

interface Folder {
  id: string;
  name: string;
  ranges: Range[];
}

interface RangeEditorProps {
  isMobileMode?: boolean;
}

// Define FolderRangeTreeProps interface
interface FolderRangeTreeProps {
  folders: Folder[]; // This will always be an array, even if it contains only one folder
  selectedRange: string;
  setSelectedRange: (id: string) => void;
  editingFolderId: string | null;
  setEditingFolderId: (id: string | null) => void;
  editingButton: string | null;
  setEditingButton: (id: string | null) => void;
  updateFolderName: (folderId: string, newName: string) => void;
  updateRangeName: (rangeId: string, newName: string) => void;
  addRange: (folderId: string) => void;
  deleteFolder: (folderId: string) => void;
  deleteRange: (rangeId: string) => void;
  cloneRange: (folderId: string, rangeToClone: Range) => void; // Added cloneRange
  isMobileMode: boolean;
  inDialog: boolean;
  totalFoldersCount: number; // New prop
  openFolderId: string | null; // New prop for Accordion
  setOpenFolderId: (id: string | null) => void; // New prop for Accordion
}

// New component for the folder/range tree structure content
const FolderRangeTreeContent = ({
  folders,
  selectedRange,
  setSelectedRange,
  editingFolderId,
  setEditingFolderId,
  editingButton,
  setEditingButton,
  updateFolderName,
  updateRangeName,
  addRange,
  deleteFolder,
  deleteRange,
  cloneRange, // Destructure cloneRange
  isMobileMode,
  inDialog,
  totalFoldersCount,
  openFolderId,
  setOpenFolderId,
}: FolderRangeTreeProps) => {
  return (
    <Accordion type="single" collapsible value={openFolderId || undefined} onValueChange={setOpenFolderId}>
      {folders.map((folder) => (
        <AccordionItem key={folder.id} value={folder.id}>
          <AccordionTrigger className="flex items-center justify-between mb-1 py-2 hover:no-underline">
            {editingFolderId === folder.id ? (
              <Input
                value={folder.name}
                onChange={(e) => updateFolderName(folder.id, e.target.value)}
                onBlur={() => setEditingFolderId(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setEditingFolderId(null);
                  }
                }}
                className={cn(
                  "h-6 text-sm border-none bg-transparent p-0 focus:bg-background",
                  isMobileMode && "max-w-[50vw]"
                )}
                maxLength={isMobileMode ? 12 : 8}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                onDoubleClick={() => setEditingFolderId(folder.id)}
                className={cn(
                  "cursor-text text-sm flex-1 truncate text-left",
                  isMobileMode && "max-w-[50vw]"
                )}
              >
                {folder.name}
              </span>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={(e) => { e.stopPropagation(); addRange(folder.id); }}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
              {totalFoldersCount > 1 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Это действие безвозвратно удалит папку "{folder.name}" и все содержащиеся в ней ренжи.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteFolder(folder.id)}>Удалить</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {/* ChevronDown from AccordionTrigger is automatically added here */}
            </div>
          </AccordionTrigger>
          
          <AccordionContent className="pb-0 pt-0">
            <div className="space-y-1 ml-4">
              {folder.ranges.map((range) => (
                  <div
                    key={range.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded cursor-pointer",
                      selectedRange === range.id ? "bg-primary/10" : "hover:bg-muted/50"
                    )}
                    onClick={() => {
                      setSelectedRange(range.id);
                      // Do NOT close dialog here, only update selectedRange
                    }}
                  >
                    <span
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingButton(range.id);
                      }}
                      className={cn(
                        "cursor-text text-xs flex-1 truncate",
                        isMobileMode && "max-w-[50vw]"
                      )}
                    >
                      {editingButton === range.id ? (
                        <Input
                          value={range.name}
                          onChange={(e) => updateRangeName(range.id, e.target.value)}
                          onBlur={() => setEditingButton(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setEditingButton(null);
                            }
                          }}
                          className="h-5 text-xs border-none bg-transparent p-0 focus:bg-background"
                          maxLength={isMobileMode ? 12 : 8}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        range.name
                      )}
                    </span>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          cloneRange(folder.id, range);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {folder.ranges.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRange(range.id);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export const RangeEditor = ({ isMobileMode = false }: RangeEditorProps) => {
  const [editingButton, setEditingButton] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const { folders, setFolders, actionButtons, setActionButtons } = useRangeContext();
  
  const [selectedRange, setSelectedRange] = useState<string>(folders[0]?.ranges[0]?.id || '');
  const [activeAction, setActiveAction] = useState(actionButtons[0]?.id || 'raise');
  const [showRangeSelectorDialog, setShowRangeSelectorDialog] = useState(false);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null); // State for Accordion
  const [isCreateActionDialogOpen, setCreateActionDialogOpen] = useState(false);

  // Effect to set the open folder based on selectedRange
  useEffect(() => {
    const currentFolder = folders.find(f => f.ranges.some(r => r.id === selectedRange));
    if (currentFolder) {
      setOpenFolderId(currentFolder.id);
    } else if (folders.length > 0) {
      // If selected range is somehow not found (e.g., deleted), default to the first folder
      setOpenFolderId(folders[0].id);
      setSelectedRange(folders[0].ranges[0]?.id || ''); // Also update selectedRange
    } else {
      setOpenFolderId(null); // No folders
    }
  }, [selectedRange, folders]);

  const getCurrentRangeAndFolder = () => {
    for (const folder of folders) {
      const range = folder.ranges.find(r => r.id === selectedRange);
      if (range) return { folder, range };
    }
    // Fallback if selectedRange is invalid or not found
    if (folders.length > 0 && folders[0].ranges.length > 0) {
      return { folder: folders[0], range: folders[0].ranges[0] };
    }
    return { folder: null, range: null };
  };

  const updateRangeName = (rangeId: string, newName: string) => {
    setFolders(prev => prev.map(folder => ({
      ...folder,
      ranges: folder.ranges.map(range => 
        range.id === rangeId ? { ...range, name: newName } : range
      )
    })));
  };

  const updateFolderName = (folderId: string, newName: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, name: newName } : folder
    ));
  };

  const addFolder = () => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name: 'Новая папка',
      ranges: [{
        id: Date.now().toString() + '-range',
        name: 'Новый ренж',
        hands: {}
      }]
    };
    setFolders(prev => [...prev, newFolder]);
    setSelectedRange(newFolder.ranges[0].id);
  };

  const deleteFolder = (folderId: string) => {
    setFolders(prev => {
      const updatedFolders = prev.filter(folder => folder.id !== folderId);
      if (updatedFolders.length === 0) {
        const newFolder: Folder = {
          id: Date.now().toString(),
          name: 'Папка',
          ranges: [{
            id: Date.now().toString() + '-range',
            name: 'Ренж',
            hands: {}
          }]
        };
        setSelectedRange(newFolder.ranges[0].id);
        return [newFolder];
      } else if (!updatedFolders.some(f => f.ranges.some(r => r.id === selectedRange))) {
        setSelectedRange(updatedFolders[0].ranges[0]?.id || '');
      }
      return updatedFolders;
    });
  };

  const addRange = (folderId: string) => {
    const newRange: Range = {
      id: Date.now().toString(),
      name: 'Новый ренж',
      hands: {}
    };
    setFolders(prev => prev.map(folder => 
      folder.id === folderId 
        ? { ...folder, ranges: [...folder.ranges, newRange] }
        : folder
    ));
    setSelectedRange(newRange.id);
  };

  const cloneRange = (folderId: string, rangeToClone: Range) => {
    const newRange: Range = {
      id: Date.now().toString(),
      name: `${rangeToClone.name} +clone`,
      hands: { ...rangeToClone.hands } // Deep copy hands
    };
    setFolders(prev => prev.map(folder =>
      folder.id === folderId
        ? { ...folder, ranges: [...folder.ranges, newRange] }
        : folder
    ));
    setSelectedRange(newRange.id);
  };

  const deleteRange = (rangeId: string) => {
    setFolders(prev => {
      let newSelectedRange = selectedRange;
      const updatedFolders = prev.map(folder => {
        const updatedRanges = folder.ranges.filter(range => range.id !== rangeId);
        if (updatedRanges.length === 0 && folder.id !== '1') { // Prevent deleting the last range in the default folder
          return null;
        }
        return { ...folder, ranges: updatedRanges };
      }).filter(Boolean) as Folder[];

      // If the deleted range was selected, find a new one to select
      if (newSelectedRange === rangeId) {
        let foundNew = false;
        for (const folder of updatedFolders) {
          if (folder.ranges.length > 0) {
            newSelectedRange = folder.ranges[0].id;
            foundNew = true;
            break;
          }
        }
        // If no ranges left at all, create a default one
        if (!foundNew) {
          const newFolder: Folder = {
            id: Date.now().toString(),
            name: 'Папка',
            ranges: [{
              id: Date.now().toString() + '-range',
              name: 'Ренж',
              hands: {}
            }]
          };
          newSelectedRange = newFolder.ranges[0].id;
          return [newFolder]; // Replace all folders with this new default
        }
      }
      setSelectedRange(newSelectedRange);
      return updatedFolders;
    });
  };

  const handleSaveNewAction = (newButton: ActionButton) => {
    setActionButtons(prev => [...prev, newButton]);
    setActiveAction(newButton.id);
  };

  const updateActionButton = (id: string, field: 'name' | 'color', value: string) => {
    setActionButtons(prev => prev.map(button => 
      (button.id === id && button.type === 'simple') ? { ...button, [field]: value } : button
    ));
  };

  const deleteActionButton = (id: string) => {
    if (actionButtons.length <= 1) {
      return; // Prevent deleting the last action button.
    }

    const buttonToDelete = actionButtons.find(b => b.id === id);
    if (!buttonToDelete) return;

    // Collect all action IDs that need to be deleted.
    // This includes the selected action and any weighted actions that depend on it if it's a simple action.
    const idsToDelete = new Set<string>([id]);
    if (buttonToDelete.type === 'simple') {
      actionButtons.forEach(btn => {
        if (btn.type === 'weighted' && (btn.action1Id === id || btn.action2Id === id)) {
          idsToDelete.add(btn.id);
        }
      });
    }

    // Reset hands that use any of the deleted actions across all ranges.
    setFolders(prevFolders =>
      prevFolders.map(folder => ({
        ...folder,
        ranges: folder.ranges.map(range => {
          const newHands = { ...range.hands };
          Object.entries(newHands).forEach(([hand, actionId]) => {
            if (idsToDelete.has(actionId)) {
              delete newHands[hand]; // This effectively reverts it to "fold"
            }
          });
          return { ...range, hands: newHands };
        })
      }))
    );

    // Now, remove the button(s) and update the active action if needed.
    setActionButtons(prevButtons => {
      const updatedButtons = prevButtons.filter(button => !idsToDelete.has(button.id));
      if (idsToDelete.has(activeAction)) {
        setActiveAction(updatedButtons[0]?.id || '');
      }
      return updatedButtons;
    });
  };

  const onHandSelect = (hand: string, mode: 'select' | 'deselect') => {
    const { range: currentRange } = getCurrentRangeAndFolder();
    if (!currentRange) return;

    const newHands = { ...currentRange.hands };
    if (mode === 'select') {
      newHands[hand] = activeAction;
    } else { // mode === 'deselect'
      // Только удаляем, если текущее действие совпадает с активным
      if (newHands[hand] === activeAction) {
        delete newHands[hand];
      }
    }

    setFolders(prev => prev.map(folder => ({
      ...folder,
      ranges: folder.ranges.map(range => 
        range.id === currentRange.id ? { ...range, hands: newHands } : range
      )
    })));
  };

  const { folder: currentFolder, range: currentRange } = getCurrentRangeAndFolder();

  const getSelectedCombinationsCount = () => {
    if (!currentRange) return 0;
    let count = 0;
    Object.entries(currentRange.hands).forEach(([hand, action]) => {
      if (action && action !== 'fold') {
        count += getCombinations(hand);
      }
    });
    return count;
  };

  const getSelectedCombinationsPercentage = () => {
    const selectedCount = getSelectedCombinationsCount();
    return TOTAL_POKER_COMBINATIONS > 0 ? Math.round((selectedCount / TOTAL_POKER_COMBINATIONS) * 100) : 0;
  };

  const renderFolderAndRangeManagement = (inDialog: boolean = false) => (
    <div className={cn(
      "space-y-4",
      inDialog ? "flex-1 flex flex-col" : ""
    )}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {isMobileMode || inDialog ? "Создать папку" : "Создать"}
        </h2>
        {(isMobileMode || inDialog) ? (
          <Button size="sm" onClick={addFolder} variant="outline">
            <Plus className="h-4 w-4" />  
          </Button>
        ) : (
          <Button size="sm" onClick={addFolder} variant="ghost" className="h-6 w-6 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className={cn(
        "space-y-2 overflow-y-auto",
        // Apply max-height only when NOT in dialog and in mobile mode
        !inDialog && isMobileMode && "max-h-64",
        inDialog ? "flex-1" : ""
      )}>
        {inDialog ? (
          // Single adaptive container for dialog
          <div className="space-y-2">
            <FolderRangeTreeContent
              folders={folders}
              selectedRange={selectedRange}
              setSelectedRange={setSelectedRange}
              editingFolderId={editingFolderId}
              setEditingFolderId={setEditingFolderId}
              editingButton={editingButton}
              setEditingButton={setEditingButton}
              updateFolderName={updateFolderName}
              updateRangeName={updateRangeName}
              addRange={addRange}
              deleteFolder={deleteFolder}
              deleteRange={deleteRange}
              cloneRange={cloneRange} // Pass cloneRange
              isMobileMode={isMobileMode}
              inDialog={inDialog}
              totalFoldersCount={folders.length}
              openFolderId={openFolderId}
              setOpenFolderId={setOpenFolderId}
            />
          </div>
        ) : (
          // Original rendering for PC mode (single Card) or mobile (multiple Cards)
          (!isMobileMode ? (
            <Card className="p-3 space-y-2">
              <FolderRangeTreeContent
                folders={folders}
                selectedRange={selectedRange}
                setSelectedRange={setSelectedRange}
                editingFolderId={editingFolderId}
                setEditingFolderId={setEditingFolderId}
                editingButton={editingButton}
                setEditingButton={setEditingButton}
                updateFolderName={updateFolderName}
                updateRangeName={updateRangeName}
                addRange={addRange}
                deleteFolder={deleteFolder}
                deleteRange={deleteRange}
                cloneRange={cloneRange} // Pass cloneRange
                isMobileMode={isMobileMode}
                inDialog={inDialog}
                totalFoldersCount={folders.length}
                openFolderId={openFolderId}
                setOpenFolderId={setOpenFolderId}
              />
            </Card>
          ) : (
            // Mobile mode (not in dialog) still uses individual cards for each folder
            folders.map((folder) => (
              <Card key={folder.id} className="p-3">
                {/* For mobile main view, we don't use Accordion per folder,
                    but the FolderRangeTreeContent is designed to handle a single folder array */}
                <FolderRangeTreeContent
                  folders={[folder]} // Pass single folder in an array
                  selectedRange={selectedRange}
                  setSelectedRange={setSelectedRange}
                  editingFolderId={editingFolderId}
                  setEditingFolderId={setEditingFolderId}
                  editingButton={editingButton}
                  setEditingButton={setEditingButton}
                  updateFolderName={updateFolderName}
                  updateRangeName={updateRangeName}
                  addRange={addRange}
                  deleteFolder={deleteFolder}
                  deleteRange={deleteRange}
                  cloneRange={cloneRange} // Pass cloneRange
                  isMobileMode={isMobileMode}
                  inDialog={inDialog}
                  totalFoldersCount={folders.length}
                  openFolderId={openFolderId}
                  setOpenFolderId={setOpenFolderId}
                />
              </Card>
            ))
          ))
        )}
      </div>
    </div>
  );

  const getActionColor = (actionId: string, allButtons: ActionButton[]): string => {
    if (actionId === 'fold') return '#6b7280'; // Special case for Fold
    const button = allButtons.find(b => b.id === actionId);
    if (button && button.type === 'simple') {
      return button.color;
    }
    return '#ffffff'; // Fallback color
  };

  const getActionButtonStyle = (button: ActionButton) => {
    if (button.type === 'simple') {
      return { backgroundColor: button.color };
    }
    if (button.type === 'weighted') {
      const color1 = getActionColor(button.action1Id, actionButtons);
      const color2 = getActionColor(button.action2Id, actionButtons);
      return {
        background: `linear-gradient(to right, ${color1} ${button.weight}%, ${color2} ${button.weight}%)`,
      };
    }
    return {};
  };

  return (
    <div className={cn(
      "bg-background",
      isMobileMode ? "h-full flex flex-col" : "flex h-screen"
    )}>
      <CreateActionButtonDialog 
        open={isCreateActionDialogOpen}
        onOpenChange={setCreateActionDialogOpen}
        onSave={handleSaveNewAction}
      />

      {isMobileMode ? (
        // MOBILE LAYOUT
        <>
          {/* Main scrollable content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-full">
              {/* Header: Folder/Range Name and Statistics */}
              <div className="flex justify-between items-end mb-4">
                <div className="text-left">
                  {currentFolder && (
                    <h2 className="text-base font-bold text-muted-foreground mb-px">
                      {currentFolder.name}
                    </h2>
                  )}
                  {currentRange && (
                    <h1 className="text-sm font-normal ml-1">
                      {currentRange.name}
                    </h1>
                  )}
                </div>
                {currentRange && (
                  <div className="bg-background/80 px-2 py-1 rounded text-xs font-mono flex items-center gap-1 z-10">
                    <span className="text-primary font-bold">{getSelectedCombinationsPercentage()}%</span>
                    <span className="text-muted-foreground">({getSelectedCombinationsCount()})</span>
                  </div>
                )}
              </div>

              {/* Poker Matrix */}
              {currentRange && (
                <div className="overflow-x-auto">
                  <PokerMatrix
                    selectedHands={currentRange.hands}
                    onHandSelect={onHandSelect}
                    activeAction={activeAction}
                    actionButtons={actionButtons}
                  />
                </div>
              )}

              {/* Action Buttons Block - MOVED HERE */}
              <div className="bg-card rounded-lg p-3 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Действия</h3>
                    <Button size="sm" variant="outline" onClick={() => setCreateActionDialogOpen(true)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {actionButtons.map((button) => (
                      <div key={button.id} className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => setActiveAction(button.id)}
                          style={getActionButtonStyle(button)}
                          className={cn(
                            "flex-1 min-w-0 text-primary-foreground border-transparent",
                            "hover:opacity-90 transition-opacity",
                            activeAction === button.id && "ring-2 ring-offset-2 ring-offset-card ring-primary"
                          )}
                        >
                          {editingButton === button.id ? (
                            <Input
                              value={button.name}
                              onChange={(e) => updateActionButton(button.id, 'name', e.target.value)}
                              onBlur={() => setEditingButton(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setEditingButton(null);
                              }}
                              className="h-5 text-xs border-none bg-transparent p-0 focus:bg-background text-center w-full"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span 
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingButton(button.id);
                              }}
                              className="cursor-text truncate px-1"
                            >
                              {button.name}
                            </span>
                          )}
                        </Button>
                        <div className="flex gap-1">
                          {button.type === 'simple' ? (
                            <input
                              type="color"
                              value={button.color}
                              onChange={(e) => updateActionButton(button.id, 'color', e.target.value)}
                              className="w-6 h-6 rounded border cursor-pointer"
                            />
                          ) : (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          {actionButtons.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteActionButton(button.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Bar */}
          <div className="bg-card border-t p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
            <Dialog open={showRangeSelectorDialog} onOpenChange={setShowRangeSelectorDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Выбрать ренж
                </Button>
              </DialogTrigger>
              <DialogContent mobileFullscreen={true} className="flex flex-col">
                <DialogHeader>
                  <DialogTitle>Выбрать ренж</DialogTitle>
                </DialogHeader>
                {renderFolderAndRangeManagement(true)}
                <DialogFooter className="mt-auto p-4 border-t">
                  <Button onClick={() => setShowRangeSelectorDialog(false)} className="w-full">
                    Выбрать
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </>
      ) : (
        // DESKTOP LAYOUT
        <>
          {/* Sidebar */}
          <div className="bg-card space-y-4 w-80 border-r flex flex-col p-4">
            {/* Folder section */}
            <div className="space-y-4 order-1">
              {renderFolderAndRangeManagement()}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 border-t order-2 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Действия</h3>
                <Button size="sm" variant="outline" onClick={() => setCreateActionDialogOpen(true)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {actionButtons.map((button) => (
                  <div key={button.id} className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setActiveAction(button.id)}
                      style={getActionButtonStyle(button)}
                      className={cn(
                        "flex-1 min-w-0 text-primary-foreground border-transparent",
                        "hover:opacity-90 transition-opacity",
                        activeAction === button.id && "ring-2 ring-offset-2 ring-offset-card ring-primary"
                      )}
                    >
                      {editingButton === button.id ? (
                        <Input
                          value={button.name}
                          onChange={(e) => updateActionButton(button.id, 'name', e.target.value)}
                          onBlur={() => setEditingButton(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingButton(null);
                          }}
                          className="h-5 text-xs border-none bg-transparent p-0 focus:bg-background text-center w-full"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span 
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingButton(button.id);
                          }}
                          className="cursor-text truncate px-1"
                        >
                          {button.name}
                        </span>
                      )}
                    </Button>
                    <div className="flex gap-1">
                      {button.type === 'simple' ? (
                        <input
                          type="color"
                          value={button.color}
                          onChange={(e) => updateActionButton(button.id, 'color', e.target.value)}
                          className="w-6 h-6 rounded border cursor-pointer"
                        />
                      ) : (
                        <div className="w-6 h-6 flex items-center justify-center">
                          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      {actionButtons.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteActionButton(button.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <div className="mx-auto max-w-4xl">
              <div className="space-y-4 lg:w-[63%] mx-auto">
                {/* Header: Folder/Range Name and Statistics */}
                <div className="flex justify-between items-end">
                  <div className="text-left">
                    {currentFolder && (
                      <h2 className="text-base font-bold text-muted-foreground mb-px">
                        {currentFolder.name}
                      </h2>
                    )}
                    {currentRange && (
                      <h1 className="text-sm font-normal ml-1">
                        {currentRange.name}
                      </h1>
                    )}
                  </div>
                  {currentRange && (
                    <div className="bg-background/80 px-2 py-1 rounded text-xs font-mono flex items-center gap-1 z-10">
                      <span className="text-primary font-bold">{getSelectedCombinationsPercentage()}%</span>
                      <span className="text-muted-foreground">({getSelectedCombinationsCount()})</span>
                    </div>
                  )}
                </div>

                {currentRange && (
                  <div className={cn(
                    isMobileMode && "overflow-x-auto"
                  )}>
                    <PokerMatrix
                      selectedHands={currentRange.hands}
                      onHandSelect={onHandSelect}
                      activeAction={activeAction}
                      actionButtons={actionButtons}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
