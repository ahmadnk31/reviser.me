import React, { useState } from 'react'
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs"
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel"
import { Card } from "@/components/ui/card"

// Define the type for a single tab
type status= 'pending' | 'in_progress' | 'completed' | 'declined'|''
type Tab = {
  value: status;
  label: string;
}

// Define props type
type ResponsiveTabsProps = {
  defaultValue?: status;
  tabs?: Tab[];
  renderContent: (status: status) => React.ReactNode;
}

export function ResponsiveTabs({ 
  tabs = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "declined", label: "Declined" }
  ],
  renderContent 
}: ResponsiveTabsProps) {
  const [activeTab, setActiveTab] = useState<status>('')

  return (
    <div className="w-full">
      {/* Desktop View */}
      <Tabs 
        defaultValue='all'
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as status)}
        className="hidden md:block"
      >
        <TabsList className="grid grid-cols-5 w-full space-x-2 overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              className="shrink-0"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent 
            key={tab.value} 
            value={tab.value}
          >
            {renderContent(tab.value)}
          </TabsContent>
        ))}
      </Tabs>

      {/* Mobile View - Carousel */}
      <div className="block md:hidden px-8">
        <Carousel 
          opts={{
            align: "start",
            slidesToScroll: 2,
          }}
        >
          <CarouselContent>
            {tabs.map((tab) => (
              <CarouselItem 
                key={tab.value} 
                className="basis-1/2 sm:basis-1/4 lg:basis-1/5"
              >
                <Card 
                  className={`p-2 text-center cursor-pointer ${activeTab === tab.value 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted'}`}
                  onClick={() => setActiveTab(tab.value)}
                >
                  {tab.label}
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className='' />
          <CarouselNext />
        </Carousel>

        {/* Content for Mobile */}
        <div className="mt-4">
          {renderContent(activeTab)}
        </div>
      </div>
    </div>
  )
}