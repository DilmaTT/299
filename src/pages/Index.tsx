import { useState, useEffect } from "react";
import React from "react";
import { Navigation } from "@/components/Navigation";
import { UserMenu } from "@/components/UserMenu";
import { RangeEditor } from "@/components/RangeEditor";
import { Training } from "@/components/Training";
import { Chart, StoredChart, ChartButton } from "@/components/Chart";
import { ChartEditor } from "@/components/ChartEditor";
import { ChartViewer } from "@/components/ChartViewer";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRangeContext } from "@/contexts/RangeContext";

const Index = () => {
  const { folders } = useRangeContext();
  const allRanges = folders.flatMap(folder => folder.ranges);

  const [activeSection, setActiveSection] = useState<'editor' | 'training' | 'chart' | 'chartEditor' | 'chartViewer'>('chart');
  const [selectedChart, setSelectedChart] = useState<StoredChart | null>(null);
  const [forcedLayout, setForcedLayout] = useState<'desktop' | null>(null);
  const [forceMobileOnDesktop, setForceMobileOnDesktop] = useState(false);
  const isMobileDevice = useIsMobile();

  // State for all charts, managed in Index.tsx
  const [charts, setCharts] = useState<StoredChart[]>(() => {
    try {
      const storedCharts = localStorage.getItem("userCharts");
      return storedCharts ? JSON.parse(storedCharts) : [];
    } catch (error) {
      console.error("Failed to parse charts from localStorage:", error);
      return [];
    }
  });

  // Effect to save charts to localStorage whenever the charts state changes
  useEffect(() => {
    try {
      localStorage.setItem("userCharts", JSON.stringify(charts));
    } catch (error) {
      console.error("Failed to save charts to localStorage:", error);
    }
  }, [charts]);

  const isMobileLayout = (isMobileDevice && forcedLayout !== 'desktop') || (!isMobileDevice && forceMobileOnDesktop);
  const isFullScreenChartMode = isMobileLayout && activeSection === 'chartViewer';

  // Function to handle editing a chart (navigates to editor)
  const handleEditChart = (chart: StoredChart) => {
    setSelectedChart(chart);
    setActiveSection('chartEditor');
  };

  // Function to handle playing a chart (navigates to viewer)
  const handlePlayChart = (chart: StoredChart) => {
    setSelectedChart(chart);
    setActiveSection('chartViewer');
  };

  // Function to create a new chart
  const handleCreateChart = (chartName: string) => {
    const newChartId = String(Date.now());
    const newChart: StoredChart = {
      id: newChartId,
      name: chartName.trim(),
      buttons: [
        {
          id: `exit-${newChartId}`, // Unique ID for the exit button
          name: "Выход",
          color: "#EF4444", // A distinct color for exit, e.g., red
          linkedItem: "", // No linked item for exit button
          x: 10, // Default position
          y: 10,
          width: 150, // Default width
          height: 40, // Default height
          type: 'exit', // Mark as exit button
        }
      ],
      canvasWidth: 800, // Default width for new charts
      canvasHeight: 500, // Default height for new charts
    };
    setCharts((prevCharts) => [...prevCharts, newChart]);
  };

  // Function to delete a chart
  const handleDeleteChart = (id: string) => {
    setCharts((prevCharts) => prevCharts.filter((chart) => chart.id !== id));
  };

  // Function to save the entire chart object (called from ChartEditor)
  const handleSaveChart = (updatedChart: StoredChart) => { // Changed signature
    setCharts((prevCharts) =>
      prevCharts.map((chart) =>
        chart.id === updatedChart.id ? updatedChart : chart // Save the entire updated chart
      )
    );
    // After saving, if the selected chart was updated, update it in state too
    setSelectedChart(prevSelected =>
      prevSelected && prevSelected.id === updatedChart.id
        ? updatedChart
        : prevSelected
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'editor':
        return <RangeEditor isMobileMode={isMobileLayout} />;
      case 'training':
        return <Training isMobileMode={isMobileLayout} />;
      case 'chart':
        return (
          <Chart
            isMobileMode={isMobileLayout}
            charts={charts} // Pass charts from Index.tsx state
            onCreateChart={handleCreateChart} // Pass create function
            onDeleteChart={handleDeleteChart} // Pass delete function
            onEditChart={handleEditChart}
            onPlayChart={handlePlayChart} // Pass play function
          />
        );
      case 'chartEditor':
        return selectedChart ? (
          <ChartEditor
            isMobileMode={isMobileLayout}
            chart={selectedChart}
            onBackToCharts={() => setActiveSection('chart')}
            onSaveChart={handleSaveChart} // Changed prop name
          />
        ) : null;
      case 'chartViewer':
        return selectedChart ? (
          <ChartViewer
            isMobileMode={isMobileLayout}
            chart={selectedChart}
            allRanges={allRanges} // Pass allRanges for button linking
            onBackToCharts={() => setActiveSection('chart')}
          />
        ) : null;
      default:
        return <RangeEditor isMobileMode={isMobileLayout} />;
    }
  };

  const LayoutToggleButton = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        if (isMobileDevice) {
          setForcedLayout(forcedLayout === 'desktop' ? null : 'desktop');
        } else {
          setForceMobileOnDesktop(!forceMobileOnDesktop);
        }
      }}
      className="flex items-center justify-center h-10 w-10 p-0"
    >
      {isMobileLayout ? (
        <Monitor className="h-4 w-4" />
      ) : (
        <Smartphone className="h-4 w-4" />
      )}
    </Button>
  );

  const mobileHeaderActions = (
    <div className="flex items-center gap-2 ml-auto">
      {LayoutToggleButton}
      <UserMenu isMobileMode={isMobileLayout} />
    </div>
  );

  return isFullScreenChartMode ? (
    renderSection()
  ) : (
    <div className="min-h-screen bg-background">
      {!isMobileLayout ? (
        // Desktop Layout
        <>
          <div className="py-1 border-b bg-card">
            <div className="flex items-center">
              <div className="w-80 flex-shrink-0 pl-4">
                <Navigation
                  activeSection={activeSection}
                  onSectionChange={setActiveSection}
                />
              </div>
              <div className="flex-1 flex items-center justify-end pr-4">
                <div className="flex items-center gap-2">
                  {LayoutToggleButton}
                  <UserMenu isMobileMode={isMobileLayout} />
                </div>
              </div>
            </div>
          </div>
          {renderSection()}
        </>
      ) : (
        // Mobile Layout
        <div className="min-h-screen bg-background flex flex-col">
          <div className="px-4 border-b bg-card">
            <div className="flex items-center justify-between">
              <Navigation
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                isMobile={true}
                mobileActions={mobileHeaderActions}
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            {renderSection()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
