
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, Download } from "lucide-react";
import { checkSalesScrapingHealth, triggerSalesScrape } from "@/services/sales/salesScraping";

export const SalesScrapingTest = () => {
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [lastScrapeResult, setLastScrapeResult] = useState<boolean | null>(null);

  const handleHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      const healthy = await checkSalesScrapingHealth();
      setIsHealthy(healthy);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleTriggerScrape = async () => {
    setIsScraping(true);
    try {
      const success = await triggerSalesScrape();
      setLastScrapeResult(success);
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Sales Scraping Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleHealthCheck} 
            disabled={isCheckingHealth}
            variant="outline"
            className="w-full"
          >
            {isCheckingHealth ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Activity className="mr-2 h-4 w-4" />
                Check Health
              </>
            )}
          </Button>
          
          {isHealthy !== null && (
            <Badge variant={isHealthy ? "default" : "destructive"} className="w-fit">
              {isHealthy ? "Service Healthy ✅" : "Service Unhealthy ❌"}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleTriggerScrape} 
            disabled={isScraping}
            className="w-full"
          >
            {isScraping ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Trigger Scrape
              </>
            )}
          </Button>
          
          {lastScrapeResult !== null && (
            <Badge variant={lastScrapeResult ? "default" : "destructive"} className="w-fit">
              {lastScrapeResult ? "Scrape Successful ✅" : "Scrape Failed ❌"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
