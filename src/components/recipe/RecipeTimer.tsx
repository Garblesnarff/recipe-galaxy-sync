
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Drawer, 
  DrawerClose, 
  DrawerContent, 
  DrawerFooter, 
  DrawerHeader, 
  DrawerTitle 
} from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, PauseCircle, Timer, XCircle } from "lucide-react";
import { toast } from "sonner";

interface RecipeTimerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialTime?: number; // time in minutes
}

export function RecipeTimer({ isOpen, onOpenChange, initialTime = 0 }: RecipeTimerProps) {
  const [time, setTime] = useState<number>(initialTime * 60); // Convert minutes to seconds
  const [totalTime, setTotalTime] = useState<number>(initialTime * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [customTime, setCustomTime] = useState<string>("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            toast.success("Timer complete!");
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const padZero = (num: number) => (num < 10 ? `0${num}` : num);

    if (hours > 0) {
      return `${padZero(hours)}:${padZero(minutes)}:${padZero(remainingSeconds)}`;
    }

    return `${padZero(minutes)}:${padZero(remainingSeconds)}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(totalTime);
  };

  const handleSetCustomTime = () => {
    const timeValue = parseInt(customTime, 10);
    if (!isNaN(timeValue) && timeValue > 0) {
      const newTime = timeValue * 60;
      setTime(newTime);
      setTotalTime(newTime);
      setCustomTime("");
      toast.success(`Timer set for ${timeValue} minutes`);
    } else {
      toast.error("Please enter a valid time in minutes");
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-2xl font-semibold flex items-center justify-center gap-2">
            <Timer className="h-6 w-6" />
            Recipe Timer
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4">
          <div className="text-center py-6">
            <div className="text-5xl font-mono mb-4">{formatTime(time)}</div>
            <Progress 
              value={time === 0 ? 0 : (time / totalTime) * 100} 
              className="h-2 mb-8" 
              color="recipe-green"
            />
          </div>

          <div className="flex justify-center space-x-3 mb-8">
            <Button 
              size="lg" 
              variant="app" 
              onClick={handleStartPause} 
              className="h-16 w-16 rounded-full p-0 flex items-center justify-center"
            >
              {isRunning ? (
                <PauseCircle className="h-8 w-8" />
              ) : (
                <PlayCircle className="h-8 w-8" />
              )}
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleReset} 
              className="h-16 w-16 rounded-full p-0 flex items-center justify-center"
            >
              <XCircle className="h-8 w-8" />
            </Button>
          </div>

          <div className="flex space-x-2 mb-4">
            <input
              type="number"
              placeholder="Set minutes"
              className="border rounded px-3 py-2 flex-1"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
            />
            <Button onClick={handleSetCustomTime} variant="app">
              Set
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[5, 10, 15, 20, 30, 45].map((min) => (
              <Button 
                key={min} 
                variant="outline"
                onClick={() => {
                  const seconds = min * 60;
                  setTime(seconds);
                  setTotalTime(seconds);
                  toast.success(`Timer set for ${min} minutes`);
                }}
              >
                {min} min
              </Button>
            ))}
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
