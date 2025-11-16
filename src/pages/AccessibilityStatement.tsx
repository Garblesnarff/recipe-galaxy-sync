import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccessibilityStatement() {
  const navigate = useNavigate();
  const lastUpdated = new Date('2025-11-16').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Accessibility Statement</h1>
        </div>
      </header>

      <main className="container max-w-4xl py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Our Commitment to Accessibility</CardTitle>
            <CardDescription>
              We are committed to ensuring digital accessibility for all users, including those with disabilities.
              We continually improve the user experience for everyone and apply relevant accessibility standards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Conformance Status</h2>
              <p className="text-muted-foreground">
                This application aims to conform to the{' '}
                <a
                  href="https://www.w3.org/WAI/WCAG21/quickref/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline inline-flex items-center gap-1"
                >
                  Web Content Accessibility Guidelines (WCAG) 2.1 Level AA
                  <ExternalLink className="h-3 w-3" />
                </a>
                . These guidelines explain how to make web content more accessible for people with disabilities.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accessibility Features</CardTitle>
            <CardDescription>
              Our application includes the following accessibility features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Keyboard Navigation</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>All functionality is accessible via keyboard</li>
                  <li>Visible focus indicators for keyboard users</li>
                  <li>Skip links to bypass repetitive content</li>
                  <li>Keyboard shortcuts for common actions (press ? to view)</li>
                  <li>Logical tab order throughout the application</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Screen Reader Support</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>ARIA labels and landmarks for better navigation</li>
                  <li>Live regions for dynamic content updates</li>
                  <li>Descriptive alt text for all images</li>
                  <li>Form labels and error announcements</li>
                  <li>Semantic HTML structure</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Visual Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>High contrast mode option</li>
                  <li>Customizable text sizes (small, medium, large, extra large)</li>
                  <li>Color contrast ratios meeting WCAG AA standards (4.5:1 minimum)</li>
                  <li>No reliance on color alone to convey information</li>
                  <li>Responsive design supporting browser zoom up to 200%</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Motion & Animation</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Reduced motion option for users sensitive to animations</li>
                  <li>Respects system prefers-reduced-motion settings</li>
                  <li>No auto-playing videos or animations</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Forms & Input</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Clear labels for all form fields</li>
                  <li>Required fields clearly marked</li>
                  <li>Error messages clearly associated with fields</li>
                  <li>Focus automatically moves to first error on validation</li>
                  <li>Help text available for complex inputs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compatibility</CardTitle>
            <CardDescription>
              This application has been tested with the following assistive technologies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>NVDA (NonVisual Desktop Access) on Windows</li>
              <li>JAWS (Job Access With Speech) on Windows</li>
              <li>VoiceOver on macOS and iOS</li>
              <li>TalkBack on Android</li>
              <li>Keyboard-only navigation in major browsers</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Known Issues & Limitations</CardTitle>
            <CardDescription>
              We are actively working to address the following known accessibility issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Some third-party integrations may have limited accessibility support</li>
              <li>Video content may not have captions in all cases</li>
              <li>Complex data visualizations are being enhanced for screen reader users</li>
            </ul>
            <p className="mt-4 text-muted-foreground">
              We have a roadmap to address these issues and are committed to improving accessibility
              in future releases.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback & Contact</CardTitle>
            <CardDescription>
              We welcome your feedback on the accessibility of this application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              If you encounter any accessibility barriers or have suggestions for improvement,
              please contact us:
            </p>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <a
                href="mailto:accessibility@fitness-app.com"
                className="text-primary underline"
              >
                accessibility@fitness-app.com
              </a>
            </div>
            <p className="text-muted-foreground text-sm">
              We aim to respond to accessibility feedback within 3 business days.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-4">
                <dt className="font-semibold min-w-[200px]">Last Updated:</dt>
                <dd className="text-muted-foreground">{lastUpdated}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-semibold min-w-[200px]">Standards:</dt>
                <dd className="text-muted-foreground">WCAG 2.1 Level AA</dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-semibold min-w-[200px]">Testing Tools:</dt>
                <dd className="text-muted-foreground">axe DevTools, WAVE, Lighthouse</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
