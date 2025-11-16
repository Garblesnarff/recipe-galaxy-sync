import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeSwitcher } from './ThemeSwitcher';
import { saveVisualPreferences, getVisualPreferences, applyVisualPreferences, VisualPreferences } from '@/services/theme/themeService';
import { getColorBlindTypeName, getColorBlindTypeDescription, ColorBlindType } from '@/services/theme/colorBlindSimulation';
import { Separator } from '@/components/ui/separator';
import { Type, Minus, Eye, Zap, Link2, Bold } from 'lucide-react';

export function VisualSettings() {
  const [preferences, setPreferences] = useState<VisualPreferences>({});

  useEffect(() => {
    const prefs = getVisualPreferences();
    setPreferences(prefs);
  }, []);

  const updatePreference = <K extends keyof VisualPreferences>(
    key: K,
    value: VisualPreferences[K]
  ) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    saveVisualPreferences(newPrefs);
  };

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose a color theme that works best for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher variant="grid" />
        </CardContent>
      </Card>

      {/* Text Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Text Settings
          </CardTitle>
          <CardDescription>
            Customize text appearance for better readability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Text Size */}
          <div className="space-y-2">
            <Label htmlFor="text-size">Text Size</Label>
            <Select
              value={preferences.textSize || 'normal'}
              onValueChange={(value: VisualPreferences['textSize']) =>
                updatePreference('textSize', value)
              }
            >
              <SelectTrigger id="text-size">
                <SelectValue placeholder="Select text size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal (16px)</SelectItem>
                <SelectItem value="large">Large (18px)</SelectItem>
                <SelectItem value="extra-large">Extra Large (20px)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Line Spacing */}
          <div className="space-y-2">
            <Label htmlFor="line-spacing" className="flex items-center gap-2">
              <Minus className="h-4 w-4" />
              Line Spacing
            </Label>
            <Select
              value={preferences.lineSpacing || 'normal'}
              onValueChange={(value: VisualPreferences['lineSpacing']) =>
                updatePreference('lineSpacing', value)
              }
            >
              <SelectTrigger id="line-spacing">
                <SelectValue placeholder="Select line spacing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal (1.5)</SelectItem>
                <SelectItem value="relaxed">Relaxed (1.75)</SelectItem>
                <SelectItem value="loose">Loose (2.0)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <Label htmlFor="font-family">Font Family</Label>
            <Select
              value={preferences.fontFamily || 'system'}
              onValueChange={(value: VisualPreferences['fontFamily']) =>
                updatePreference('fontFamily', value)
              }
            >
              <SelectTrigger id="font-family">
                <SelectValue placeholder="Select font family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System Default</SelectItem>
                <SelectItem value="sans">Sans Serif</SelectItem>
                <SelectItem value="serif">Serif</SelectItem>
                <SelectItem value="mono">Monospace</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Bold UI Text */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              <Bold className="h-4 w-4" />
              <div>
                <Label htmlFor="bold-ui">Bold UI Text</Label>
                <p className="text-sm text-muted-foreground">
                  Make all UI text bold for better visibility
                </p>
              </div>
            </div>
            <Switch
              id="bold-ui"
              checked={preferences.boldUi || false}
              onCheckedChange={(checked) => updatePreference('boldUi', checked)}
            />
          </div>

          {/* Underline Links */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              <div>
                <Label htmlFor="underline-links">Underline Links</Label>
                <p className="text-sm text-muted-foreground">
                  Always underline clickable links
                </p>
              </div>
            </div>
            <Switch
              id="underline-links"
              checked={preferences.underlineLinks || false}
              onCheckedChange={(checked) => updatePreference('underlineLinks', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Motion Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Motion & Animations
          </CardTitle>
          <CardDescription>
            Control animation speed and motion effects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="animation-speed">Animation Speed</Label>
            <Select
              value={preferences.animationSpeed || 'normal'}
              onValueChange={(value: VisualPreferences['animationSpeed']) =>
                updatePreference('animationSpeed', value)
              }
            >
              <SelectTrigger id="animation-speed">
                <SelectValue placeholder="Select animation speed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="slow">Slow (50% speed)</SelectItem>
                <SelectItem value="off">Off (No animations)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Reducing motion can help with motion sensitivity and improve focus
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Color Blind Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Color Blind Mode
          </CardTitle>
          <CardDescription>
            Adjust colors for different types of color vision deficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="color-blind-mode">Color Vision Adjustment</Label>
            <Select
              value={preferences.colorBlindMode || 'none'}
              onValueChange={(value: ColorBlindType) =>
                updatePreference('colorBlindMode', value)
              }
            >
              <SelectTrigger id="color-blind-mode">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div>
                    <div className="font-medium">None</div>
                    <div className="text-xs text-muted-foreground">
                      Normal color vision
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="deuteranopia">
                  <div>
                    <div className="font-medium">Deuteranopia</div>
                    <div className="text-xs text-muted-foreground">
                      Green color blindness (6% of males)
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="protanopia">
                  <div>
                    <div className="font-medium">Protanopia</div>
                    <div className="text-xs text-muted-foreground">
                      Red color blindness (2% of males)
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="tritanopia">
                  <div>
                    <div className="font-medium">Tritanopia</div>
                    <div className="text-xs text-muted-foreground">
                      Blue color blindness (rare)
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="achromatopsia">
                  <div>
                    <div className="font-medium">Achromatopsia</div>
                    <div className="text-xs text-muted-foreground">
                      Total color blindness (very rare)
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {preferences.colorBlindMode && preferences.colorBlindMode !== 'none' && (
              <div className="p-3 rounded-md bg-muted text-sm">
                <p className="font-medium mb-1">
                  {getColorBlindTypeName(preferences.colorBlindMode)}
                </p>
                <p className="text-muted-foreground">
                  {getColorBlindTypeDescription(preferences.colorBlindMode)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
