import { useTheme } from '@/hooks/useTheme';
import { ThemePreview } from './ThemePreview';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette } from 'lucide-react';

interface ThemeSwitcherProps {
  variant?: 'dropdown' | 'grid';
}

export function ThemeSwitcher({ variant = 'dropdown' }: ThemeSwitcherProps) {
  const { theme, themeId, setTheme, availableThemes } = useTheme();

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableThemes.map((t) => (
          <ThemePreview
            key={t.id}
            theme={t}
            isActive={t.id === themeId}
            onClick={() => setTheme(t.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <Select value={themeId} onValueChange={setTheme}>
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <SelectValue placeholder="Select theme" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {availableThemes.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            <div className="flex items-center gap-2">
              <span>{t.name}</span>
              <span className="text-xs text-muted-foreground">
                ({t.contrastRatio === 'extra-high' ? 'AAA' : 'AA'})
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
