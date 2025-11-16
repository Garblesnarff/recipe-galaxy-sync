import { Theme } from '@/config/themes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemePreviewProps {
  theme: Theme;
  onClick?: () => void;
  isActive?: boolean;
}

export function ThemePreview({ theme, onClick, isActive = false }: ThemePreviewProps) {
  const contrastBadgeVariant = {
    'normal': 'secondary',
    'high': 'default',
    'extra-high': 'destructive',
  }[theme.contrastRatio] as 'secondary' | 'default' | 'destructive';

  const contrastLabel = {
    'normal': 'AA',
    'high': 'AA+',
    'extra-high': 'AAA',
  }[theme.contrastRatio];

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md relative",
        isActive && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{theme.name}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {theme.description}
            </CardDescription>
          </div>
          {isActive && (
            <div className="flex-shrink-0">
              <div className="bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <Badge variant={contrastBadgeVariant}>{contrastLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Theme color preview */}
        <div className="space-y-2">
          <div className="text-xs font-medium mb-1">Color Palette</div>
          <div className="grid grid-cols-5 gap-1">
            <div
              className="h-8 rounded border"
              style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
              title="Primary"
            />
            <div
              className="h-8 rounded border"
              style={{ backgroundColor: `hsl(${theme.colors.secondary})` }}
              title="Secondary"
            />
            <div
              className="h-8 rounded border"
              style={{ backgroundColor: `hsl(${theme.colors.success})` }}
              title="Success"
            />
            <div
              className="h-8 rounded border"
              style={{ backgroundColor: `hsl(${theme.colors.warning})` }}
              title="Warning"
            />
            <div
              className="h-8 rounded border"
              style={{ backgroundColor: `hsl(${theme.colors.error})` }}
              title="Error"
            />
          </div>

          {/* Mini preview */}
          <div
            className="mt-3 p-3 rounded-md border"
            style={{
              backgroundColor: `hsl(${theme.colors.background})`,
              color: `hsl(${theme.colors.foreground})`,
            }}
          >
            <div className="text-xs font-medium mb-1">Preview</div>
            <div className="text-xs mb-2">Sample text in this theme</div>
            <div
              className="inline-flex text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: `hsl(${theme.colors.primary})`,
                color: `hsl(${theme.colors.primaryForeground})`,
              }}
            >
              Button
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
