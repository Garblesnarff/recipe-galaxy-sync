import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { ColorScheme } from '@/config/themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { validateColorContrast } from '@/services/theme/themeService';
import { getContrastRatio } from '@/services/theme/colorUtils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, RotateCcw, Check, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ColorInput {
  key: keyof ColorScheme;
  label: string;
  description?: string;
}

const coreColors: ColorInput[] = [
  { key: 'background', label: 'Background', description: 'Main background color' },
  { key: 'foreground', label: 'Foreground', description: 'Main text color' },
  { key: 'primary', label: 'Primary', description: 'Primary action color' },
  { key: 'primaryForeground', label: 'Primary Foreground', description: 'Text on primary' },
  { key: 'secondary', label: 'Secondary', description: 'Secondary action color' },
  { key: 'secondaryForeground', label: 'Secondary Foreground', description: 'Text on secondary' },
];

const uiColors: ColorInput[] = [
  { key: 'card', label: 'Card', description: 'Card background' },
  { key: 'cardForeground', label: 'Card Foreground', description: 'Card text' },
  { key: 'muted', label: 'Muted', description: 'Muted background' },
  { key: 'mutedForeground', label: 'Muted Foreground', description: 'Muted text' },
  { key: 'accent', label: 'Accent', description: 'Accent color' },
  { key: 'accentForeground', label: 'Accent Foreground', description: 'Text on accent' },
];

const feedbackColors: ColorInput[] = [
  { key: 'success', label: 'Success', description: 'Success messages' },
  { key: 'warning', label: 'Warning', description: 'Warning messages' },
  { key: 'error', label: 'Error', description: 'Error messages' },
  { key: 'info', label: 'Info', description: 'Info messages' },
];

const borderColors: ColorInput[] = [
  { key: 'border', label: 'Border', description: 'Border color' },
  { key: 'input', label: 'Input', description: 'Input border color' },
  { key: 'ring', label: 'Ring', description: 'Focus ring color' },
];

export function ThemeCustomizer() {
  const { theme } = useTheme();
  const [customColors, setCustomColors] = useState<ColorScheme>(theme.colors);

  const updateColor = (key: keyof ColorScheme, value: string) => {
    setCustomColors({ ...customColors, [key]: value });
  };

  const resetToDefault = () => {
    setCustomColors(theme.colors);
  };

  const exportTheme = () => {
    const themeData = {
      name: 'Custom Theme',
      colors: customColors,
    };
    const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-theme.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (data.colors) {
              setCustomColors(data.colors);
            }
          } catch (error) {
            console.error('Error importing theme:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const contrastReport = validateColorContrast(customColors);

  const renderColorInput = (colorInput: ColorInput) => {
    const value = customColors[colorInput.key];
    const hslValue = `hsl(${value})`;

    // Get contrast ratio if this is a foreground/background pair
    let contrastRatio: number | null = null;
    let contrastPair: string = '';

    if (colorInput.key === 'foreground') {
      contrastRatio = getContrastRatio(hslValue, `hsl(${customColors.background})`);
      contrastPair = 'background';
    } else if (colorInput.key === 'primaryForeground') {
      contrastRatio = getContrastRatio(hslValue, `hsl(${customColors.primary})`);
      contrastPair = 'primary';
    } else if (colorInput.key === 'secondaryForeground') {
      contrastRatio = getContrastRatio(hslValue, `hsl(${customColors.secondary})`);
      contrastPair = 'secondary';
    }

    return (
      <div key={colorInput.key} className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor={colorInput.key}>{colorInput.label}</Label>
            {colorInput.description && (
              <p className="text-xs text-muted-foreground">{colorInput.description}</p>
            )}
          </div>
          {contrastRatio && (
            <Badge variant={contrastRatio >= 4.5 ? "default" : "destructive"}>
              {contrastRatio.toFixed(1)}:1
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <div
            className="w-12 h-10 rounded border-2 flex-shrink-0"
            style={{ backgroundColor: hslValue }}
          />
          <Input
            id={colorInput.key}
            value={value}
            onChange={(e) => updateColor(colorInput.key, e.target.value)}
            placeholder="0 0% 0%"
            className="font-mono text-sm"
          />
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Theme Customizer</CardTitle>
            <CardDescription>
              Customize theme colors and validate contrast ratios
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={importTheme}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={exportTheme}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="core" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="core">Core</TabsTrigger>
            <TabsTrigger value="ui">UI</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="core" className="space-y-4 mt-4">
            {coreColors.map(renderColorInput)}
            <Separator />
            {borderColors.map(renderColorInput)}
          </TabsContent>

          <TabsContent value="ui" className="space-y-4 mt-4">
            {uiColors.map(renderColorInput)}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4 mt-4">
            {feedbackColors.map(renderColorInput)}
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 mt-4">
            {/* Live Preview */}
            <div
              className="p-6 rounded-lg border-2"
              style={{
                backgroundColor: `hsl(${customColors.background})`,
                color: `hsl(${customColors.foreground})`,
                borderColor: `hsl(${customColors.border})`,
              }}
            >
              <h3 className="text-lg font-bold mb-4">Theme Preview</h3>
              <p className="mb-4">
                This is how your custom theme will look. Test different color combinations
                to ensure good readability.
              </p>

              <div className="flex gap-2 mb-4">
                <button
                  className="px-4 py-2 rounded"
                  style={{
                    backgroundColor: `hsl(${customColors.primary})`,
                    color: `hsl(${customColors.primaryForeground})`,
                  }}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 py-2 rounded"
                  style={{
                    backgroundColor: `hsl(${customColors.secondary})`,
                    color: `hsl(${customColors.secondaryForeground})`,
                  }}
                >
                  Secondary Button
                </button>
              </div>

              <div
                className="p-4 rounded mb-4"
                style={{
                  backgroundColor: `hsl(${customColors.card})`,
                  color: `hsl(${customColors.cardForeground})`,
                }}
              >
                <h4 className="font-semibold mb-2">Card Component</h4>
                <p className="text-sm">This is a card with custom colors.</p>
              </div>

              <div className="space-y-2">
                <div
                  className="p-2 rounded text-sm"
                  style={{ backgroundColor: `hsl(${customColors.success})`, color: 'white' }}
                >
                  Success message
                </div>
                <div
                  className="p-2 rounded text-sm"
                  style={{ backgroundColor: `hsl(${customColors.warning})`, color: 'white' }}
                >
                  Warning message
                </div>
                <div
                  className="p-2 rounded text-sm"
                  style={{ backgroundColor: `hsl(${customColors.error})`, color: 'white' }}
                >
                  Error message
                </div>
              </div>
            </div>

            {/* Contrast Validation */}
            <div className="space-y-3">
              <h4 className="font-semibold">Contrast Validation</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 rounded bg-muted">
                  {contrastReport.passes ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium">Overall Status</div>
                    <div className="text-xs text-muted-foreground">
                      {contrastReport.summary.passed}/{contrastReport.summary.totalChecks} checks passed
                    </div>
                  </div>
                  <Badge variant={contrastReport.passes ? "default" : "destructive"}>
                    {contrastReport.passes ? "Pass" : "Fail"}
                  </Badge>
                </div>
              </div>

              {contrastReport.issues.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Issues Found</h5>
                  {contrastReport.issues.map((issue, index) => (
                    <div key={index} className="p-2 rounded border text-sm">
                      <div className="font-medium">{issue.pair}</div>
                      <div className="text-xs text-muted-foreground">
                        Ratio: {issue.ratio.toFixed(2)}:1 (requires {issue.required}:1 for {issue.level})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
