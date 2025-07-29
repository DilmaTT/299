import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

interface NavigationProps {
  activeSection: 'editor' | 'training' | 'chart'; // Updated type
  onSectionChange: (section: 'editor' | 'training' | 'chart') => void; // Updated type
  isMobile?: boolean;
  mobileActions?: React.ReactNode;
}

export const Navigation = ({ activeSection, onSectionChange, isMobile = false, mobileActions }: NavigationProps) => {
  const sections = [
    { id: 'editor' as const, label: 'Редактор' },
    { id: 'training' as const, label: 'Тренировка' },
    { id: 'chart' as const, label: 'Чарт' } // Updated id and label
  ];

  const content = (
    <>
      <div className={cn(
        "flex items-center",
        isMobile ? "gap-0" : "gap-1"
      )}>
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "poker" : "ghost"}
            size="sm"
            onClick={() => onSectionChange(section.id)}
            className={cn(
              "transition-all duration-200",
              activeSection === section.id && "shadow-md"
            )}
          >
            {section.label}
          </Button>
        ))}
      </div>
      {isMobile && mobileActions}
    </>
  );

  // The <nav> wrapper is removed for both mobile and desktop views.
  // This removes the container's background, border, and allows the parent
  // component to control alignment, fulfilling the request.
  return content;
};
