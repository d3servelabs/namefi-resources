'use client';

import { useState, useEffect, useMemo } from 'react';

// Global constants
const DEBOUNCE_TIME_MS = 3000;
const COUNTDOWN_INITIAL_VALUE = 3;
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import {
  Alert,
  AlertDescription,
} from '@namefi-astra/ui/components/shadcn/alert';
import {
  Loader2,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  RotateCcw,
  Play,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useDebounceValue } from 'usehooks-ts';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { equals } from 'ramda';

// Dynamically import the entire MDXEditor component
const MarkdownEditor = dynamic(() => import('./markdown-editor'), {
  ssr: false,
  loading: () => (
    <div className="h-64 border rounded-lg animate-pulse bg-gray-100" />
  ),
});

// Get preview dimensions based on selected size
const getPreviewDimensions = (previewSize: 'desktop' | 'tablet' | 'mobile') => {
  switch (previewSize) {
    case 'mobile':
      return { width: '375px', height: '667px' };
    case 'tablet':
      return { width: '768px', height: '1024px' };
    case 'desktop':
    default:
      return { width: '100%', height: '500px' };
  }
};

const formatHtml = async (html: string): Promise<string> => {
  try {
    // Dynamic import to avoid SSR issues
    const [prettier, htmlParser] = await Promise.all([
      import('prettier/standalone'),
      import('prettier/plugins/html'),
    ]);

    return prettier.default.format(html, {
      parser: 'html',
      plugins: [htmlParser.default],
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      singleQuote: true,
      htmlWhitespaceSensitivity: 'css',
    });
  } catch (error) {
    console.warn('Failed to format HTML:', error);
    return html;
  }
};

export function EmailTemplateManager() {
  const [templateData, setTemplateData] = useState({
    name: '',
    title: '',
    content: '',
    useContainer: true,
    useHeader: true,
    useFooter: true,
    showGoToDashboard: true,
  });

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [countdown, setCountdown] = useState(COUNTDOWN_INITIAL_VALUE);
  const [previewSize, setPreviewSize] = useState<
    'desktop' | 'tablet' | 'mobile'
  >('desktop');
  const [formattedHtml, setFormattedHtml] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [currentPreviewData, setCurrentPreviewData] = useState<{
    title: string;
    content: string;
    useContainer: boolean;
    useHeader: boolean;
    useFooter: boolean;
    showGoToDashboard: boolean;
  } | null>(null);
  const [stablePreviewHtml, setStablePreviewHtml] = useState<string>('');

  const trpc = useTRPC();

  // Debounce the template data for preview updates
  const [debouncedTemplateData] = useDebounceValue(
    templateData,
    DEBOUNCE_TIME_MS,
  );

  const previewTemplate = useQuery({
    ...trpc.admin.emails.previewEmailTemplate.queryOptions(
      autoRefresh ? debouncedTemplateData : templateData,
      {
        trpc: {
          context: { skipBatch: true },
        },
      },
    ),
    enabled: autoRefresh
      ? Boolean(
          debouncedTemplateData.title.length > 0 &&
            debouncedTemplateData.content.length > 0,
        )
      : false, // Disable auto-fetching when manual mode
    refetchOnWindowFocus: false,
    staleTime: 0, // Disable stale time for now to debug
  });

  // Track current preview data for out-of-sync detection and maintain stable preview
  useEffect(() => {
    if (previewTemplate.data?.htmlContent && !previewTemplate.isLoading) {
      // Update stable preview HTML
      setStablePreviewHtml(previewTemplate.data.htmlContent);

      // Update current preview data tracking
      setCurrentPreviewData(autoRefresh ? debouncedTemplateData : templateData);
    }
  }, [
    previewTemplate.data,
    previewTemplate.isLoading,
    autoRefresh,
    debouncedTemplateData,
    templateData,
  ]);

  const createTemplate = useMutation({
    ...trpc.admin.emails.createListmonkTemplate.mutationOptions({
      trpc: {
        context: { skipBatch: true },
      },
    }),
    onMutate: () => {
      setMessage(null);
      return undefined;
    },
    onSuccess: (data) => {
      setMessage({ type: 'success', text: data.message });
      // Reset form
      setTemplateData({
        name: '',
        title: '',
        content: '',
        useContainer: true,
        useHeader: true,
        useFooter: true,
        showGoToDashboard: true,
      });
      return undefined;
    },
    onError: (error: any) => {
      setMessage({
        type: 'error',
        text: `Failed to create template: ${error.message}`,
      });
      return undefined;
    },
  });

  const handleInputChange = (
    field: keyof typeof templateData,
    value: string | boolean,
  ) => {
    setTemplateData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateTemplate = () => {
    if (!templateData.name || !templateData.title || !templateData.content) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    createTemplate.mutate(templateData);
  };

  const handleManualRefresh = () => {
    previewTemplate.refetch();
  };

  // Check if we have any preview data (current or outdated)
  const hasPreviewData = Boolean(previewTemplate.data?.htmlContent);

  // Check if current input has minimum required data
  const hasMinimumData = Boolean(
    templateData.title?.length > 0 && templateData.content?.length > 0,
  );

  // For display, use stable preview HTML (keeps showing while loading new one)
  const previewHtml = stablePreviewHtml;

  // Preview is ready if we have stable data
  const isPreviewReady = Boolean(stablePreviewHtml);

  // Format HTML asynchronously when preview data changes
  useEffect(() => {
    if (previewHtml) {
      formatHtml(previewHtml).then(setFormattedHtml);
    } else {
      setFormattedHtml('');
    }
  }, [previewHtml]);

  // Check if current data differs from debounced data (preview is outdated)
  const isPreviewOutdated = useMemo(
    () => autoRefresh && !equals(templateData, debouncedTemplateData),
    [autoRefresh, debouncedTemplateData, templateData],
  );

  // Check if current data differs from what's shown in preview
  const isDataOutOfSync = useMemo(
    () => currentPreviewData && !equals(currentPreviewData, templateData),
    [currentPreviewData, templateData],
  );

  // Check if manual refresh is needed (for manual mode)
  const needsManualRefresh =
    !autoRefresh && hasMinimumData && (!hasPreviewData || isDataOutOfSync);

  // Countdown timer effect
  useEffect(() => {
    setCountdown(COUNTDOWN_INITIAL_VALUE);
    if (!isPreviewOutdated) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return COUNTDOWN_INITIAL_VALUE; // Reset when it reaches 0
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPreviewOutdated]);

  const previewDimensions = useMemo(
    () => getPreviewDimensions(previewSize),
    [previewSize],
  );

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Editor and Preview Layout */}
      <div className="xl:block hidden">
        <PanelGroup direction="horizontal" className="min-h-[600px]">
          <Panel defaultSize={50} minSize={30} className="pe-3">
            {/* Left Column: Editor */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Email Template Editor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name *</Label>
                      <Input
                        id="template-name"
                        placeholder="Enter template name"
                        value={templateData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleInputChange('name', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-title">Email Title *</Label>
                      <Input
                        id="email-title"
                        placeholder="Enter email title"
                        value={templateData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleInputChange('title', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-content">
                      Email Content (Markdown) *
                    </Label>
                    <MarkdownEditor
                      markdown={templateData.content}
                      onChange={(content) =>
                        handleInputChange('content', content)
                      }
                      placeholder="Enter your email content using the rich text editor..."
                    />
                    <p className="text-sm text-muted-foreground">
                      Use the rich text editor above or write Markdown directly.
                      Links will automatically open in new tabs.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="use-container"
                        checked={templateData.useContainer}
                        onCheckedChange={(checked: boolean) =>
                          handleInputChange('useContainer', checked)
                        }
                      />
                      <Label htmlFor="use-container">
                        Use email container layout
                      </Label>
                    </div>

                    {templateData.useContainer && (
                      <div className="ms-6 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="use-header"
                            checked={templateData.useHeader}
                            onCheckedChange={(checked: boolean) =>
                              handleInputChange('useHeader', checked)
                            }
                          />
                          <Label htmlFor="use-header">Show header</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="use-footer"
                            checked={templateData.useFooter}
                            onCheckedChange={(checked: boolean) =>
                              handleInputChange('useFooter', checked)
                            }
                          />
                          <Label htmlFor="use-footer">Show footer</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-dashboard"
                            checked={templateData.showGoToDashboard}
                            onCheckedChange={(checked: boolean) =>
                              handleInputChange('showGoToDashboard', checked)
                            }
                          />
                          <Label htmlFor="show-dashboard">
                            Show "Go to Dashboard" button
                          </Label>
                        </div>
                      </div>
                    )}

                    {!templateData.useContainer && (
                      <div className="ms-6 text-sm text-muted-foreground">
                        Raw markdown mode - no container, header, footer, or
                        dashboard button
                      </div>
                    )}
                  </div>

                  {/* Create Template Button */}
                  {isPreviewReady && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={handleCreateTemplate}
                        disabled={
                          createTemplate.isPending || !templateData.name
                        }
                        size="lg"
                        className="w-full"
                      >
                        {createTemplate.isPending ? (
                          <>
                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                            Creating Template...
                          </>
                        ) : (
                          'Create Template in Listmonk'
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-transparent hover:bg-gray-50 cursor-col-resize transition-colors duration-200 flex items-center justify-center">
            <div className="w-px h-4 bg-gray-200 opacity-40" />
          </PanelResizeHandle>

          <Panel defaultSize={50} minSize={30} className="ps-3">
            {/* Right Column: Preview */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex flex-row items-center justify-between">
                    <CardTitle>Email Preview</CardTitle>
                    <div className="flex items-center space-x-2">
                      {/* Auto/Manual Refresh Toggle */}
                      <div className="flex items-center space-x-1 border rounded-md p-1">
                        <Button
                          onClick={() => setAutoRefresh(true)}
                          size="sm"
                          variant={autoRefresh ? 'default' : 'ghost'}
                          className="h-8 px-2"
                          title="Auto refresh"
                        >
                          <Play className="h-3 w-3 me-1" />
                          Auto
                        </Button>
                        <Button
                          onClick={() => setAutoRefresh(false)}
                          size="sm"
                          variant={!autoRefresh ? 'default' : 'ghost'}
                          className="h-8 px-2"
                          title="Manual refresh"
                        >
                          <RotateCcw className="h-3 w-3 me-1" />
                          Manual
                        </Button>
                      </div>

                      {/* Screen Size Controls */}
                      <div className="flex items-center space-x-1 border rounded-md p-1">
                        <Button
                          onClick={() => setPreviewSize('desktop')}
                          size="sm"
                          variant={
                            previewSize === 'desktop' ? 'default' : 'ghost'
                          }
                          className="h-8 px-2"
                          title="Desktop view"
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setPreviewSize('tablet')}
                          size="sm"
                          variant={
                            previewSize === 'tablet' ? 'default' : 'ghost'
                          }
                          className="h-8 px-2"
                          title="Tablet view"
                        >
                          <Tablet className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setPreviewSize('mobile')}
                          size="sm"
                          variant={
                            previewSize === 'mobile' ? 'default' : 'ghost'
                          }
                          className="h-8 px-2"
                          title="Mobile view"
                        >
                          <Smartphone className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        onClick={handleManualRefresh}
                        size="sm"
                        variant="outline"
                        disabled={
                          previewTemplate.isLoading ||
                          !templateData.title ||
                          !templateData.content
                        }
                      >
                        <RefreshCw className="h-4 w-4 me-1" />
                        Refresh Now
                      </Button>
                    </div>
                  </div>

                  {/* Status indicators - moved underneath */}
                  <div className="flex justify-end">
                    <span
                      className={`text-xs text-muted-foreground ${
                        isPreviewOutdated ? 'visible' : 'invisible'
                      }`}
                    >
                      Preview updating in {countdown}s
                    </span>
                    <span
                      className={`text-sm text-orange-600 ${
                        needsManualRefresh ? 'visible' : 'invisible'
                      }`}
                    >
                      Refresh needed
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {isPreviewReady ? (
                    <div className="flex justify-center">
                      <div
                        className={`border rounded-lg bg-white overflow-hidden relative ${
                          isDataOutOfSync ? 'opacity-70' : ''
                        }`}
                        style={{
                          width: previewDimensions.width,
                          height: previewDimensions.height,
                          maxWidth: '100%',
                        }}
                      >
                        <iframe
                          srcDoc={previewHtml}
                          className="w-full h-full border-0"
                          title="Email Preview"
                        />
                        {/* Loading overlay */}
                        {previewTemplate.isLoading && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                            <div className="flex items-center bg-white shadow-lg rounded-lg px-4 py-2 border">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                              <span className="ms-2 text-sm text-gray-700">
                                Updating preview...
                              </span>
                            </div>
                          </div>
                        )}
                        {/* Out-of-sync overlay */}
                        {isDataOutOfSync && !previewTemplate.isLoading && (
                          <div className="absolute inset-0 bg-amber-100/20 border-2 border-amber-300/30 rounded-lg pointer-events-none" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      Fill in the title and content to see a preview
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* HTML Source Card */}
              <Card>
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex flex-row items-center justify-between">
                    <CardTitle>HTML Source</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={handleManualRefresh}
                        size="sm"
                        variant="outline"
                        disabled={
                          previewTemplate.isLoading ||
                          !templateData.title ||
                          !templateData.content
                        }
                      >
                        <RefreshCw className="h-4 w-4 me-1" />
                        Refresh Now
                      </Button>
                    </div>
                  </div>

                  {/* Status indicators - moved underneath */}
                  <div className="flex justify-end">
                    <span
                      className={`text-xs text-muted-foreground ${
                        isPreviewOutdated ? 'visible' : 'invisible'
                      }`}
                    >
                      HTML updating in {countdown}s
                    </span>
                    <span
                      className={`text-sm text-orange-600 ${
                        needsManualRefresh ? 'visible' : 'invisible'
                      }`}
                    >
                      Refresh needed
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {isPreviewReady ? (
                    <div className="relative">
                      <pre className="bg-gray-50 text-gray-900 p-4 rounded-lg overflow-auto text-sm max-h-80 border border-gray-200">
                        <code className="text-gray-900">{formattedHtml}</code>
                      </pre>
                      <Button
                        onClick={() =>
                          navigator.clipboard.writeText(formattedHtml)
                        }
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2 opacity-70 hover:opacity-100"
                      >
                        Copy
                      </Button>
                      {/* Loading overlay */}
                      {previewTemplate.isLoading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                          <div className="flex items-center bg-white shadow-lg rounded-lg px-4 py-2 border">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span className="ms-2 text-sm text-gray-700">
                              Updating HTML...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      Fill in the title and content to see the HTML source
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Fallback layout for smaller screens */}
      <div className="block xl:hidden">
        <div className="space-y-6">
          {/* Editor Section */}
          <Card>
            <CardHeader>
              <CardTitle>Email Template Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name-mobile">Template Name *</Label>
                  <Input
                    id="template-name-mobile"
                    placeholder="Enter template name"
                    value={templateData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('name', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-title-mobile">Email Title *</Label>
                  <Input
                    id="email-title-mobile"
                    placeholder="Enter email title"
                    value={templateData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('title', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-content-mobile">
                  Email Content (Markdown) *
                </Label>
                <MarkdownEditor
                  markdown={templateData.content}
                  onChange={(content) => handleInputChange('content', content)}
                  placeholder="Enter your email content using the rich text editor..."
                />
                <p className="text-sm text-muted-foreground">
                  Use the rich text editor above or write Markdown directly.
                  Links will automatically open in new tabs.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-container-mobile"
                    checked={templateData.useContainer}
                    onCheckedChange={(checked: boolean) =>
                      handleInputChange('useContainer', checked)
                    }
                  />
                  <Label htmlFor="use-container-mobile">
                    Use email container layout
                  </Label>
                </div>

                {templateData.useContainer && (
                  <div className="ms-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="use-header-mobile"
                        checked={templateData.useHeader}
                        onCheckedChange={(checked: boolean) =>
                          handleInputChange('useHeader', checked)
                        }
                      />
                      <Label htmlFor="use-header-mobile">Show header</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="use-footer-mobile"
                        checked={templateData.useFooter}
                        onCheckedChange={(checked: boolean) =>
                          handleInputChange('useFooter', checked)
                        }
                      />
                      <Label htmlFor="use-footer-mobile">Show footer</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-dashboard-mobile"
                        checked={templateData.showGoToDashboard}
                        onCheckedChange={(checked: boolean) =>
                          handleInputChange('showGoToDashboard', checked)
                        }
                      />
                      <Label htmlFor="show-dashboard-mobile">
                        Show "Go to Dashboard" button
                      </Label>
                    </div>
                  </div>
                )}

                {!templateData.useContainer && (
                  <div className="ms-6 text-sm text-muted-foreground">
                    Raw markdown mode - no container, header, footer, or
                    dashboard button
                  </div>
                )}
              </div>

              {/* Create Template Button */}
              {isPreviewReady && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleCreateTemplate}
                    disabled={createTemplate.isPending || !templateData.name}
                    size="lg"
                    className="w-full"
                  >
                    {createTemplate.isPending ? (
                      <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        Creating Template...
                      </>
                    ) : (
                      'Create Template in Listmonk'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs for smaller screens */}
      <div className="xl:hidden">
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="html">HTML Source</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Email Preview</CardTitle>
                <div className="flex items-center space-x-2">
                  {/* Screen Size Controls */}
                  <div className="flex items-center space-x-1 border rounded-md p-1">
                    <Button
                      onClick={() => setPreviewSize('desktop')}
                      size="sm"
                      variant={previewSize === 'desktop' ? 'default' : 'ghost'}
                      className="h-8 px-2"
                      title="Desktop view"
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setPreviewSize('tablet')}
                      size="sm"
                      variant={previewSize === 'tablet' ? 'default' : 'ghost'}
                      className="h-8 px-2"
                      title="Tablet view"
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setPreviewSize('mobile')}
                      size="sm"
                      variant={previewSize === 'mobile' ? 'default' : 'ghost'}
                      className="h-8 px-2"
                      title="Mobile view"
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>

                  {isPreviewOutdated && (
                    <span className="text-sm text-amber-600">
                      Preview updating in {countdown}s
                    </span>
                  )}
                  <Button
                    onClick={handleManualRefresh}
                    size="sm"
                    variant="outline"
                    disabled={
                      previewTemplate.isLoading ||
                      !templateData.title ||
                      !templateData.content
                    }
                  >
                    <RefreshCw className="h-4 w-4 me-1" />
                    Refresh Now
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {previewTemplate.isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ms-2">Generating preview...</span>
                  </div>
                ) : isPreviewReady ? (
                  <div className="flex justify-center">
                    <div
                      className="border rounded-lg bg-white overflow-hidden"
                      style={{
                        width: previewDimensions.width,
                        height: previewDimensions.height,
                        maxWidth: '100%',
                      }}
                    >
                      <iframe
                        srcDoc={previewHtml}
                        className="w-full h-full border-0"
                        title="Email Preview"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    Fill in the title and content to see a preview
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="html" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>HTML Source</CardTitle>
                <div className="flex items-center space-x-2">
                  {isPreviewOutdated && (
                    <span className="text-sm text-amber-600">
                      HTML updating in {countdown}s
                    </span>
                  )}
                  <Button
                    onClick={handleManualRefresh}
                    size="sm"
                    variant="outline"
                    disabled={
                      previewTemplate.isLoading ||
                      !templateData.title ||
                      !templateData.content
                    }
                  >
                    <RefreshCw className="h-4 w-4 me-1" />
                    Refresh Now
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {previewTemplate.isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ms-2">Generating HTML...</span>
                  </div>
                ) : isPreviewReady ? (
                  <div className="relative">
                    <pre className="bg-gray-50 text-gray-900 p-4 rounded-lg overflow-auto text-sm max-h-96 border border-gray-200">
                      <code className="text-gray-900">{formattedHtml}</code>
                    </pre>
                    <Button
                      onClick={() =>
                        navigator.clipboard.writeText(formattedHtml)
                      }
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2 opacity-70 hover:opacity-100"
                    >
                      Copy
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    Fill in the title and content to see the HTML source
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
