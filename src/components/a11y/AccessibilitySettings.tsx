import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useA11y } from '@/hooks/useA11y';
import { detectUserPreferences } from '@/services/accessibility/accessibilityService';
import { AccessibilityConfig } from '@/config/accessibility';
import { Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TEXT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra Large' },
] as const;

/**
 * Comprehensive accessibility settings panel
 * Allows users to customize their accessibility preferences
 */
export const AccessibilitySettings: React.FC = () => {
  const { a11yConfig, updateA11yConfig } = useA11y();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [localConfig, setLocalConfig] = useState<AccessibilityConfig>(a11yConfig);

  const handleToggle = (key: keyof AccessibilityConfig) => {
    setLocalConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTextSizeChange = (value: string) => {
    setLocalConfig((prev) => ({
      ...prev,
      textSize: value as AccessibilityConfig['textSize'],
    }));
  };

  const handleFocusIndicatorChange = (value: string) => {
    setLocalConfig((prev) => ({
      ...prev,
      focusIndicators: value as AccessibilityConfig['focusIndicators'],
    }));
  };

  const handleDetectPreferences = () => {
    const detected = detectUserPreferences();
    setLocalConfig((prev) => ({
      ...prev,
      ...detected,
    }));

    toast({
      title: 'System preferences detected',
      description: 'Your accessibility settings have been updated based on your system preferences.',
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateA11yConfig(localConfig);
      toast({
        title: 'Settings saved',
        description: 'Your accessibility preferences have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save accessibility settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(localConfig) !== JSON.stringify(a11yConfig);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Motion & Animation</CardTitle>
          <CardDescription>
            Control animations and transitions throughout the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduced-motion">Reduced Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              id="reduced-motion"
              checked={localConfig.reducedMotion}
              onCheckedChange={() => handleToggle('reducedMotion')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visual Preferences</CardTitle>
          <CardDescription>
            Adjust visual settings for better readability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="high-contrast">High Contrast Mode</Label>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={localConfig.highContrast}
              onCheckedChange={() => handleToggle('highContrast')}
            />
          </div>

          <div className="space-y-3">
            <Label>Text Size</Label>
            <RadioGroup
              value={localConfig.textSize}
              onValueChange={handleTextSizeChange}
            >
              <div className="grid grid-cols-2 gap-3">
                {TEXT_SIZE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`text-size-${option.value}`} />
                    <Label htmlFor={`text-size-${option.value}`} className="cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Focus Indicators</Label>
            <RadioGroup
              value={localConfig.focusIndicators}
              onValueChange={handleFocusIndicatorChange}
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="focus-standard" />
                  <Label htmlFor="focus-standard" className="cursor-pointer">
                    Standard (subtle outlines)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="enhanced" id="focus-enhanced" />
                  <Label htmlFor="focus-enhanced" className="cursor-pointer">
                    Enhanced (prominent outlines with glow)
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interaction & Navigation</CardTitle>
          <CardDescription>
            Configure how you interact with the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="screen-reader">Screen Reader Announcements</Label>
              <p className="text-sm text-muted-foreground">
                Enable dynamic announcements for screen readers
              </p>
            </div>
            <Switch
              id="screen-reader"
              checked={localConfig.screenReaderAnnouncements}
              onCheckedChange={() => handleToggle('screenReaderAnnouncements')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="keyboard-shortcuts">Keyboard Shortcuts</Label>
              <p className="text-sm text-muted-foreground">
                Enable keyboard shortcuts for quick navigation (press ? to view)
              </p>
            </div>
            <Switch
              id="keyboard-shortcuts"
              checked={localConfig.keyboardShortcuts}
              onCheckedChange={() => handleToggle('keyboardShortcuts')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleDetectPreferences} variant="outline">
          Detect from System
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : hasChanges ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </>
          ) : (
            'Saved'
          )}
        </Button>
      </div>
    </div>
  );
};

AccessibilitySettings.displayName = 'AccessibilitySettings';
