import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "./AuthDialog";
import { Settings, Download, Upload, Menu } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRangeContext } from "@/contexts/RangeContext";
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

interface UserMenuProps {
  isMobileMode: boolean;
}

export const UserMenu = ({ isMobileMode }: UserMenuProps) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { setFolders, setActionButtons } = useRangeContext();
  const { toast } = useToast();

  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [exportImportDialogOpen, setExportImportDialogOpen] = useState(false);
  const [exportPath, setExportPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const data = {
      folders: JSON.parse(localStorage.getItem('poker-ranges-folders') || '[]'),
      actionButtons: JSON.parse(localStorage.getItem('poker-ranges-actions') || '[]'),
      trainings: JSON.parse(localStorage.getItem('training-sessions') || '[]'),
      trainingStatistics: JSON.parse(localStorage.getItem('training-statistics') || '[]'),
      charts: JSON.parse(localStorage.getItem('poker-charts') || '[]'),
    };

    const filename = `poker_app_data_${new Date().toISOString().slice(0, 10)}.json`;
    const jsonString = JSON.stringify(data, null, 2);

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({
          path: filename,
          data: jsonString,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        setExportPath(result.uri);
        toast({
          title: "Экспорт завершен",
          description: `Файл сохранен в Документах: ${filename}`,
        });
      } catch (e) {
        console.error('Unable to write file', e);
        toast({
          title: "Ошибка экспорта",
          description: "Не удалось сохранить файл. Проверьте разрешения приложения.",
          variant: "destructive",
        });
      }
    } else {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportPath(filename);
      toast({
        title: "Экспорт завершен",
        description: `Данные сохранены в файл: ${filename}`,
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== 'application/json') {
      toast({
        title: "Ошибка импорта",
        description: "Пожалуйста, выберите файл формата JSON.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);

        if (importedData.folders) {
          localStorage.setItem('poker-ranges-folders', JSON.stringify(importedData.folders));
          setFolders(importedData.folders);
        }
        if (importedData.actionButtons) {
          localStorage.setItem('poker-ranges-actions', JSON.stringify(importedData.actionButtons));
          setActionButtons(importedData.actionButtons);
        }
        if (importedData.trainings) {
          localStorage.setItem('training-sessions', JSON.stringify(importedData.trainings));
        }
        if (importedData.trainingStatistics) {
          localStorage.setItem('training-statistics', JSON.stringify(importedData.trainingStatistics));
        }
        if (importedData.charts) {
          localStorage.setItem('poker-charts', JSON.stringify(importedData.charts));
        }

        toast({
          title: "Импорт завершен",
          description: "Данные успешно загружены и применены.",
        });
        setExportImportDialogOpen(false);
      } catch (error) {
        console.error("Error parsing or applying imported data:", error);
        toast({
          title: "Ошибка импорта",
          description: "Не удалось обработать файл. Убедитесь, что это корректный файл данных приложения.",
          variant: "destructive",
        });
      }
    };
    reader.onerror = () => {
      toast({
        title: "Ошибка чтения файла",
        description: "Не удалось прочитать выбранный файл.",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  if (!isAuthenticated) {
    return (
      <>
        <Button
          variant="outline"
          size={isMobileMode ? "icon" : "sm"}
          onClick={() => setAuthDialogOpen(true)}
          className={isMobileMode ? "p-0" : ""}
        >
          {isMobileMode ? (
            <Settings className="h-4 w-4" />
          ) : (
            <>
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  ?
                </AvatarFallback>
              </Avatar>
              Войти
            </>
          )}
        </Button>

        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
        />
      </>
    );
  }

  const userInitial = user?.username?.charAt(0).toUpperCase() || '?';

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: 'none' }}
      />

      {isMobileMode ? (
        <>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setExportImportDialogOpen(true);
              setExportPath(null);
            }}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <Dialog open={exportImportDialogOpen} onOpenChange={setExportImportDialogOpen}>
            <DialogContent mobileFullscreen>
              <DialogHeader>
                <DialogTitle>Меню пользователя</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Экспорт
                </Button>
                <Button variant="outline" onClick={handleImportClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  Импорт
                </Button>
                {exportPath && (
                  <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded-md break-all">
                    Файл сохранен: <strong>{exportPath}</strong>
                  </div>
                )}
                <Button variant="destructive" onClick={logout}>
                  Выйти
                </Button>
              </div>
              <DialogFooter>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <DropdownMenu onOpenChange={(open) => {
          if (!open) setExportPath(null);
        }}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              {user?.username}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Экспорт
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImportClick}>
              <Upload className="mr-2 h-4 w-4" />
              Импорт
            </DropdownMenuItem>
            {exportPath && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground break-all">
                Файл сохранен: <strong>{exportPath}</strong>
              </div>
            )}
            <DropdownMenuItem onClick={logout}>
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
};
