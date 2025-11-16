import { ThemeCustomizer as ThemeCustomizerComponent } from '@/components/theme/ThemeCustomizer';
import { ColorContrastChecker } from '@/components/theme/ColorContrastChecker';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ThemeCustomizer() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
        <h1 className="text-3xl font-bold mb-2">Theme Customizer</h1>
        <p className="text-muted-foreground">
          Create and test custom color themes with live preview and contrast validation
        </p>
      </div>

      <div className="space-y-6">
        <ThemeCustomizerComponent />

        <div className="mt-8">
          <ColorContrastChecker />
        </div>

        <div className="mt-8 p-6 rounded-lg bg-muted">
          <h3 className="text-lg font-semibold mb-3">Tips for Creating Accessible Themes</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Contrast Ratio:</strong> Aim for at least 4.5:1 for normal text (WCAG AA) or 7:1 for AAA compliance
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Large Text:</strong> Text 18pt+ or 14pt+ bold requires only 3:1 (AA) or 4.5:1 (AAA)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Test with Simulators:</strong> Use color blind simulators to ensure your theme works for everyone
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Multiple Cues:</strong> Don't rely on color alone - use icons, patterns, and text labels
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Export & Import:</strong> Save your custom themes as JSON files to reuse or share them
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
