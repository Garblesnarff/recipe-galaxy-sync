import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getContrastRatio, meetsWCAG, suggestAccessibleColor } from '@/services/theme/colorUtils';
import { Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ColorContrastChecker() {
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');

  const ratio = getContrastRatio(foreground, background);
  const meetsAA = meetsWCAG(ratio, 'AA', 'normal');
  const meetsAALarge = meetsWCAG(ratio, 'AA', 'large');
  const meetsAAA = meetsWCAG(ratio, 'AAA', 'normal');
  const meetsAAALarge = meetsWCAG(ratio, 'AAA', 'large');

  const suggestedAA = suggestAccessibleColor(foreground, background, 'AA', 'normal');
  const suggestedAAA = suggestAccessibleColor(foreground, background, 'AAA', 'normal');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Contrast Checker</CardTitle>
        <CardDescription>
          Test color combinations for WCAG compliance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="foreground">Foreground Color</Label>
            <div className="flex gap-2">
              <Input
                id="foreground"
                type="color"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                type="text"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="flex-1"
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="background">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="background"
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                type="text"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="flex-1"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div
            className="p-6 rounded-md border-2"
            style={{ backgroundColor: background, color: foreground }}
          >
            <p className="text-base font-medium mb-2">Normal text preview</p>
            <p className="text-lg">Large text preview (18pt+)</p>
          </div>
        </div>

        {/* Contrast ratio */}
        <div className="space-y-2">
          <Label>Contrast Ratio</Label>
          <div className="text-3xl font-bold">
            {ratio.toFixed(2)}:1
          </div>
        </div>

        {/* WCAG compliance */}
        <div className="space-y-3">
          <Label>WCAG Compliance</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* AA Normal */}
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
              {meetsAA ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-red-600" />
              )}
              <div className="flex-1">
                <div className="font-medium">AA (Normal Text)</div>
                <div className="text-xs text-muted-foreground">
                  Requires 4.5:1
                </div>
              </div>
              <Badge variant={meetsAA ? "default" : "destructive"}>
                {meetsAA ? "Pass" : "Fail"}
              </Badge>
            </div>

            {/* AA Large */}
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
              {meetsAALarge ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-red-600" />
              )}
              <div className="flex-1">
                <div className="font-medium">AA (Large Text)</div>
                <div className="text-xs text-muted-foreground">
                  Requires 3:1
                </div>
              </div>
              <Badge variant={meetsAALarge ? "default" : "destructive"}>
                {meetsAALarge ? "Pass" : "Fail"}
              </Badge>
            </div>

            {/* AAA Normal */}
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
              {meetsAAA ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-red-600" />
              )}
              <div className="flex-1">
                <div className="font-medium">AAA (Normal Text)</div>
                <div className="text-xs text-muted-foreground">
                  Requires 7:1
                </div>
              </div>
              <Badge variant={meetsAAA ? "default" : "destructive"}>
                {meetsAAA ? "Pass" : "Fail"}
              </Badge>
            </div>

            {/* AAA Large */}
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
              {meetsAAALarge ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-red-600" />
              )}
              <div className="flex-1">
                <div className="font-medium">AAA (Large Text)</div>
                <div className="text-xs text-muted-foreground">
                  Requires 4.5:1
                </div>
              </div>
              <Badge variant={meetsAAALarge ? "default" : "destructive"}>
                {meetsAAALarge ? "Pass" : "Fail"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {(!meetsAA || !meetsAAA) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <Label>Suggested Improvements</Label>
            </div>
            <div className="space-y-2">
              {!meetsAA && suggestedAA !== foreground && (
                <div className="p-3 rounded-md border">
                  <div className="font-medium mb-2">AA Compliant Alternative</div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: suggestedAA }}
                    />
                    <code className="text-sm">{suggestedAA}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setForeground(suggestedAA)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
              {!meetsAAA && suggestedAAA !== foreground && (
                <div className="p-3 rounded-md border">
                  <div className="font-medium mb-2">AAA Compliant Alternative</div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: suggestedAAA }}
                    />
                    <code className="text-sm">{suggestedAAA}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setForeground(suggestedAAA)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
